# WhatsApp AI Assistant — Implementation Plan

## Resolved Design Decisions

| Decision | Choice |
|----------|--------|
| Integration model | New top-level module `/whatsapp-assistant` with API routes under `/api/whatsapp/` |
| User/auth boundary | Shares `users` table; new module tables are `user_id`-scoped |
| Property source | Reuse `crm_listings`; extend with `pet_friendly` and `property_type` columns |
| AI provider | Replicate: `meta/llama-3.1-70b-instruct` via prompt-based tool calling |
| Primary flow | Customer-facing AI: inbound WhatsApp → orchestrator → AI → WhatsApp reply |
| Agent identity | Existing `agent_profiles` table (name, phone, branding) |
| Agent notifications | Existing `notifications` table + `/api/notifications`; extend for escalation events |
| CRM integration | New module does **not** duplicate contacts/listings; uses `crm_listings` for properties, `crm_contacts` optional for lead creation |

---

## 1. Database Changes

### 1.1 Extend `crm_listings` (idempotent SQL)

Add columns required by the Property Service tool:

```sql
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS pet_friendly BOOLEAN DEFAULT false;
ALTER TABLE crm_listings ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'house'
  CHECK (property_type IN ('house', 'apartment', 'townhouse', 'condo', 'land', 'commercial'));
CREATE INDEX IF NOT EXISTS idx_crm_listings_property_type ON crm_listings(property_type);
CREATE INDEX IF NOT EXISTS idx_crm_listings_pet_friendly ON crm_listings(pet_friendly);
```

### 1.2 New tables (idempotent SQL)

**`whatsapp_connections`** — one row per connected WhatsApp Business number per user.

```sql
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  meta_business_id text NOT NULL,
  phone_number_id text NOT NULL,
  display_phone text NOT NULL,
  access_token text NOT NULL,          -- encrypted at rest by app logic
  refresh_token text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  error_message text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_connections_user_phone
  ON whatsapp_connections(user_id, display_phone);
```

**`conversations`** — WhatsApp conversations, user-scoped.

```sql
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  client_phone text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  assigned_agent uuid REFERENCES users(id) ON DELETE SET NULL,
  last_message text,
  last_activity timestamptz DEFAULT NOW(),
  summary text,
  ai_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_client
  ON conversations(user_id, client_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity
  ON conversations(last_activity DESC);
```

**`messages`** — individual WhatsApp messages.

```sql
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location')),
  text text,
  media_url text,
  timestamp timestamptz DEFAULT NOW(),
  meta_message_id text UNIQUE,
  ai_generated boolean DEFAULT false,
  created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, timestamp DESC);
```

**`ai_settings`** — per-user AI configuration for the WhatsApp assistant.

```sql
CREATE TABLE IF NOT EXISTS ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  assistant_name text DEFAULT 'Assistant',
  system_prompt text DEFAULT 'You are a helpful real estate assistant...',
  temperature numeric(3,2) DEFAULT 0.70,
  language text DEFAULT 'en',
  greeting text DEFAULT 'Hello! How can I help you find your dream home?',
  office_hours jsonb DEFAULT '{"start":"08:00","end":"18:00","timezone":"Africa/Johannesburg","enabled":false}',
  handover_rules text,
  followup_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);
```

**`knowledge_base`** — optional RAG source for AI context.

```sql
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  embedding vector(1536),              -- for future semantic search; can be null initially
  updated_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user
  ON knowledge_base(user_id);
```

### 1.3 RLS policies

Enable RLS and add user-scoped policies for all new tables. Use the same pattern as existing tables:

```sql
-- Enable RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- whatsapp_connections
CREATE POLICY "Users manage own whatsapp connections" ON whatsapp_connections
  FOR ALL USING (auth.uid() = user_id);

-- conversations
CREATE POLICY "Users manage own conversations" ON conversations
  FOR ALL USING (auth.uid() = user_id);

-- messages
CREATE POLICY "Users manage own messages" ON messages
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM conversations WHERE conversations.id = messages.conversation_id)
  );

-- ai_settings
CREATE POLICY "Users manage own ai settings" ON ai_settings
  FOR ALL USING (auth.uid() = user_id);

-- knowledge_base
CREATE POLICY "Users manage own knowledge base" ON knowledge_base
  FOR ALL USING (auth.uid() = user_id);
```

### 1.4 Updated files

- **`supabase-setup.sql`** — append new tables, indexes, RLS policies, and `crm_listings` extension
- **`supabase/migrations/010_whatsapp_assistant.sql`** — new migration file for the new tables

---

## 2. New Files to Create

### 2.1 Library modules (`src/lib/`)

| File | Purpose |
|------|---------|
| `src/lib/replicate.ts` | Shared Replicate client wrapper (`createPrediction`, `poll`, webhook handling). Extracted from existing `video-make-studio/replicate.ts` to avoid duplication. |
| `src/lib/whatsapp/types.ts` | TypeScript interfaces: `WhatsAppConnection`, `Conversation`, `Message`, `AISettings`, `KnowledgeBase`, `ToolCall`, `ToolResult`, `PropertySearchFilters` |
| `src/lib/whatsapp/supabase.ts` | Scoped Supabase helpers for WhatsApp tables (get/create conversation, save message, load settings, etc.) |
| `src/lib/whatsapp/meta.ts` | Meta Cloud API helpers: webhook signature verification (`X-Hub-Signature-256`), send message (`/v21.0/<phone-id>/messages`), upload/download media, delivery/read receipt handlers |
| `src/lib/whatsapp/property-service.ts` | `searchProperties(filters)` — queries `crm_listings` with area/price/bedrooms/bathrooms/pet_friendly/property_type filters. Returns normalised property objects. |
| `src/lib/whatsapp/crm-service.ts` | `createLead(data)` — inserts into `crm_contacts` + optionally creates a CRM task. `updateClient(contactId, data)` — updates contact. |
| `src/lib/whatsapp/notification-service.ts` | `escalate(conversationId, reason)` — inserts into `notifications`, optionally sends WhatsApp to agent via Meta API. |
| `src/lib/whatsapp/ai-orchestrator.ts` | Core brain. `processMessage(userId, conversationId, inboundMessage)` → loads context → builds prompt → calls Replicate → parses tool calls → executes tools → validates → returns reply. |
| `src/lib/whatsapp/context-builder.ts` | Builds the AI prompt context: agent profile → business rules → conversation summary → recent messages → matching properties → knowledge base snippets → office hours → tool definitions. |
| `src/lib/whatsapp/tools.ts` | Tool definitions for Llama 3.1: `search_properties`, `get_property_details`, `create_lead`, `book_viewing`, `notify_agent`, `update_client`, `search_knowledge`, `calculate_bond`, `send_property_link`. Each tool has a JSON schema and a handler. |

### 2.2 API routes (`src/app/api/whatsapp/`)

| Route | Methods | Purpose |
|-------|---------|---------|
| `webhook/route.ts` | GET, POST | Meta webhook verification (GET) + inbound message handling (POST). Signature validation, save message, trigger orchestrator, send reply. |
| `send/route.ts` | POST | Send a WhatsApp message (text/media) on behalf of the agent or AI. |
| `connections/route.ts` | GET, POST, DELETE | CRUD for WhatsApp Business connections. |
| `connections/[id]/route.ts` | PUT | Update connection tokens/status. |
| `conversations/route.ts` | GET | List conversations for the authenticated user with search/filter. |
| `conversations/[id]/messages/route.ts` | GET | Paginated message history for a conversation. |
| `conversations/[id]/close/route.ts` | POST | Close/escalate a conversation. |
| `ai-settings/route.ts` | GET, PUT | Get/update AI settings for the authenticated user. |
| `knowledge-base/route.ts` | GET, POST, DELETE | CRUD for knowledge base entries. |
| `knowledge-base/[id]/route.ts` | PUT, DELETE | Update/delete single entry. |
| `tools/route.ts` | POST | Internal endpoint for executing AI-declared tools (called by orchestrator, not exposed to clients directly). |

### 2.3 Frontend pages (`src/app/whatsapp-assistant/`)

| Page | Purpose |
|------|---------|
| `layout.tsx` | Sidebar + layout shell, integrated into main app navigation |
| `page.tsx` | Dashboard: conversation list, connection status, quick stats |
| `connections/page.tsx` | WhatsApp connection setup (business ID, phone number ID, token input) |
| `conversations/[id]/page.tsx` | Conversation detail view with message thread, manual override controls, AI toggle |
| `settings/page.tsx` | AI settings editor (prompt, greeting, office hours, handover rules) |
| `knowledge-base/page.tsx` | Knowledge base entry management |

---

## 3. Existing Files to Modify

### 3.1 `supabase-setup.sql`

- Append `crm_listings` column extensions (`pet_friendly`, `property_type`, indexes)
- Append all 5 new table definitions, indexes, and RLS policies
- No changes to existing tables beyond the `crm_listings` extension

### 3.2 `src/lib/types.ts` (or create `src/lib/whatsapp/types.ts`)

- Add WhatsApp-specific TypeScript interfaces
- Optionally extend existing `User` type with WhatsApp-specific fields if needed

### 3.3 `src/app/layout.tsx` (root navigation)

- Add `/whatsapp-assistant` link to the sidebar navigation, visible to authenticated users only

### 3.4 `src/components/layout/Sidebar.tsx` (if it exists)

- Ensure the new WhatsApp link is integrated with existing navigation structure

---

## 4. Core Data Flow (Customer-Facing AI)

```
Customer WhatsApp
       │
       ▼
Meta Cloud API
       │
       ▼
GET/POST /api/whatsapp/webhook
  - Verify X-Hub-Signature-256
  - Save inbound message to `messages`
  - Load/create `conversation`
       │
       ▼
AI Orchestrator (`ai-orchestrator.ts`)
  - Load AI settings
  - Load agent profile
  - Load conversation summary + last 10 messages
  - Search matching properties via `property-service.ts`
  - Load relevant knowledge base snippets
  - Check office hours
  - Build prompt via `context-builder.ts`
       │
       ▼
Replicate (`meta/llama-3.1-70b-instruct`)
  - System prompt + user message + tool definitions
  - Model returns tool call or text response
       │
       ▼
Tool Execution (`tools.ts`)
  - If tool call: execute handler (search_properties, create_lead, etc.)
  - If text: validate and return
       │
       ▼
Save AI reply to `messages` (ai_generated = true)
       │
       ▼
POST /api/whatsapp/send
  - Send via Meta Cloud API to customer
  - Log delivery receipt
```

---

## 5. Implementation Order

### Phase 0: Foundation (database + shared libs)

1. Add `crm_listings` extensions to `supabase-setup.sql`
2. Create migration `010_whatsapp_assistant.sql` with all new tables
3. Create `src/lib/replicate.ts` (shared client, extracted from existing code)
4. Create `src/lib/whatsapp/types.ts`

### Phase 1: Infrastructure (webhook + send)

5. Create `src/lib/whatsapp/meta.ts` — webhook signature verification + send message
6. Create `src/app/api/whatsapp/webhook/route.ts` — GET (verify) + POST (receive + trigger orchestrator stub)
7. Create `src/app/api/whatsapp/send/route.ts`
8. Create `src/app/api/whatsapp/connections/route.ts` + `[id]/route.ts`
9. Create `src/lib/whatsapp/supabase.ts`

**Validation**: Connect a Meta test number, send a message, verify it hits the webhook, is saved to DB, and a static reply is sent back.

### Phase 2: Services + Tools

10. Create `src/lib/whatsapp/property-service.ts` — query `crm_listings`
11. Create `src/lib/whatsapp/crm-service.ts` — create lead in `crm_contacts`
12. Create `src/lib/whatsapp/notification-service.ts` — insert into `notifications`, optional agent WhatsApp alert
13. Create `src/lib/whatsapp/tools.ts` — tool schemas + handlers
14. Create `src/lib/whatsapp/context-builder.ts`

**Validation**: Unit-test each service independently against a test Supabase instance.

### Phase 3: AI Orchestrator

15. Create `src/lib/whatsapp/ai-orchestrator.ts` — `processMessage()` pipeline
16. Wire orchestrator into `POST /api/whatsapp/webhook`
17. Add conversation summary update after each interaction

**Validation**: End-to-end test with a real or test Meta number. Send "I want a 3-bed house under 2M in Sandton" and verify the AI searches properties and replies with matches.

### Phase 4: Agent Dashboard

18. Create `/whatsapp-assistant` layout + navigation entry
19. Create conversation list page (`GET /api/whatsapp/conversations`)
20. Create conversation detail page with message thread
21. Create AI settings page (`GET/PUT /api/whatsapp/ai-settings`)
22. Create knowledge base page (`GET/POST /api/whatsapp/knowledge-base`)
23. Create connections page

**Validation**: Log in as a user, connect a WhatsApp number, view conversations, toggle AI on/off, update settings.

### Phase 5: Hardening

24. Add rate limiting on webhook and send endpoints
25. Add idempotency keys for webhook processing (deduplicate `meta_message_id`)
26. Add retry logic for failed Replicate predictions
27. Add credit deduction per AI message (reuse existing `credits.ts` pattern)
28. Add admin visibility into WhatsApp usage (extend `/api/admin/usage`)

---

## 6. Validation Plan

| Level | What | How |
|-------|------|-----|
| Typecheck | No TypeScript errors | `bun typecheck` scoped to new/modified files |
| Lint | Code style | `bun lint` scoped to `src/lib/whatsapp/` and `src/app/api/whatsapp/` |
| DB migration | Tables + RLS + indexes | Run `supabase-setup.sql` and new migration in a test project; verify with `SELECT table_name FROM information_schema.tables` |
| Webhook unit | Signature verification + message save | Test with mock Meta payloads and known signatures |
| Orchestrator unit | Prompt building, tool parsing, tool execution | Mock Replicate responses with tool-call JSON payloads |
| E2E | Full customer flow | Meta test number → webhook → orchestrator → AI reply → customer receives WhatsApp |
| Dashboard | Auth, conversation list, settings CRUD | Manual smoke test in browser |
| Credits | AI messages deduct credits | Verify `credit_transactions` entries |

---

## 7. Out of Scope (Explicitly)

- Multi-language / i18n beyond a configurable `language` string
- Semantic search / RAG with `embedding` column (column added but vector search not implemented yet)
- Multi-agent assignment / complex handover rules (basic escalation to `assigned_agent` only)
- WhatsApp group chat support (1:1 conversations only)
- Audio/video message processing (text + image only initially)
- Media upload/download via WhatsApp (send text + image URLs; full media pipeline later)
- Rate limiting / usage quotas at the WhatsApp module level (reuse global credit system)

---

## 8. Key Risks

| Risk | Mitigation |
|------|------------|
| Replicate tool-call reliability with Llama 3.1 | Strict JSON validation + retry with fallback text response; log raw model output for debugging |
| Webhook replay/duplicate messages | Deduplicate on `meta_message_id` (UNIQUE constraint in `messages` table) |
| Meta token expiry | Store `refresh_token`, auto-refresh in `meta.ts` before sending |
| Prompt injection via customer messages | Sanitize inbound text before including in prompt; do not pass raw `meta_message_id` into prompt context |
| Cost of Replicate at scale | Cache property search results per conversation context; use smaller context window (last 10 messages + summary, not full history) |

---

## 9. Dependencies on Existing Code

- `src/lib/supabase.ts` — shared client, `getCurrentUser()`, `getAdminClient()`
- `src/lib/credits.ts` — credit reservation/refund for AI messages
- `src/app/api/notifications/route.ts` — existing notification creation (reuse for escalations)
- `src/app/api/crm/contacts/route.ts` — existing contact CRUD (reuse for `create_lead`)
- `src/app/api/crm/listings/route.ts` — existing listing CRUD (reuse for property management)
- `supabase-setup.sql` — existing schema (must be run before new tables)

---

## 10. Environment Variables

No new env vars required beyond existing Supabase and Replicate keys. Meta WhatsApp credentials are stored per-user in `whatsapp_connections.access_token` (not global env vars), so each agent manages their own Meta Business connection.

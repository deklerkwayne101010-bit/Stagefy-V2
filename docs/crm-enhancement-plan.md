# Stagefy CRM Enhancement Plan

## Executive Summary
Transform the basic CRM into a comprehensive **Real Estate Agent Platform** that provides genuine value and becomes an indispensable tool for agents.

---

## Current State Analysis

### Existing Components
- **Contacts** - Basic contact management (name, email, phone, type, status, notes, tags)
- **Listings** - Basic property listings (address, city, price, bedrooms, bathrooms, sqft, status)
- **Media** - Gallery linked to listings
- **Agent Profile** - Agent contact info for templates

### Current Limitations
1. No relationship tracking between buyers and listings
2. No task/follow-up management
3. No pipeline view for leads
4. No activity logging/history
5. No showing scheduling
6. No commission tracking
7. No document storage (mandates, agreements)
8. No automation workflows
9. No property matching for buyers
10. No integration with listing portals (Property24, etc.)

---

## Phase 1: Core CRM Enhancements

### 1.1 Enhanced Contacts
```typescript
interface EnhancedContact {
  // Existing fields
  id, user_id, name, email, phone, type, status, notes, tags
  
  // New fields
  preferred_locations: string[]        // Areas the buyer is interested in
  budget_range: { min: number; max: number }
  property_types_interest: string[]    // house, apartment, townhouse, etc.
  bedrooms_required: number
  bathrooms_required: number
  features_required: string[]         // pool, garden, garage, etc.
  timeline: 'urgent' | 'flexible' | 'browsing'
  source: 'online' | 'referral' | 'walk-in' | 'social' | 'other'
  last_contacted_at: timestamp
  preferred_contact_method: 'email' | 'phone' | 'whatsapp' | 'sms'
  rating: 1-5                         // Hot lead to cold lead
}
```

### 1.2 Enhanced Listings
```typescript
interface EnhancedListing {
  // Existing fields
  id, user_id, contact_id, address, city, state, zip_code
  price, bedrooms, bathrooms, sqft, status, media, notes
  
  // New fields
  property_type: 'house' | 'apartment' | 'townhouse' | 'villa' | 'penthouse' | 'commercial'
  land_size: number                    // erf size in sqm
  year_built: number
  levies: number                       // monthly levy for complexes
  rates: number                        // monthly rates
  parking: number                      // number of parking bays
  features: string[]                   // pool, garden, security, etc.
  listing_type: 'sole' | 'open' | 'shared'
  mandate_expiry: date
  instructions: string                 // special instructions for showings
  virtual_tour_url: string
  floorplan_url: string
  open_house_dates: date[]
  price_history: { date: date; price: number }[]
  view_count: number                   // how many times listing viewed
  inquiry_count: number                // how many inquiries received
}
```

### 1.3 Contact-Listing Matching Engine
```typescript
// Auto-match buyers to listings
interface BuyerListingMatch {
  contact_id: string
  listing_id: string
  match_score: number                 // 0-100 percentage
  match_reasons: string[]             // e.g., "Within budget", "Correct bedrooms", "Has pool"
  match_date: timestamp
}
```

---

## Phase 2: Pipeline & Task Management

### 2.1 Sales Pipeline
```typescript
interface PipelineStage {
  id: string
  name: string                         // e.g., "New Lead", "Qualified", "Viewing", "Offer", "Sold"
  order: number
  color: string
}

interface PipelineDeal {
  id: string
  contact_id: string
  listing_id?: string                  // Optional - can be buy-side without specific listing
  pipeline_stage_id: string
  value: number                        // Commission value
  probability: number                   // 0-100%
  expected_close_date: date
  notes: string
  created_at: timestamp
  updated_at: timestamp
}
```

### 2.2 Task Management
```typescript
interface Task {
  id: string
  user_id: string
  contact_id?: string
  listing_id?: string
  pipeline_deal_id?: string
  
  title: string
  description: string
  task_type: 'call' | 'email' | 'showing' | 'meeting' | 'follow-up' | 'open-house' | 'other'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'completed' | 'cancelled' | 'missed'
  due_date: timestamp
  completed_at?: timestamp
  reminder?: timestamp                 // For reminders
  recurring?: {                        // For recurring tasks
    frequency: 'daily' | 'weekly' | 'monthly'
    end_date?: date
  }
  created_at: timestamp
}
```

### 2.3 Calendar Integration
```typescript
interface Showing {
  id: string
  listing_id: string
  contact_id: string
  agent_id: string
  
  scheduled_date: timestamp
  duration: number                     // minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  notes: string
  feedback?: string                   // Buyer feedback after showing
  follow_up_required: boolean
  next_steps: string
  created_at: timestamp
}

interface OpenHouse {
  id: string
  listing_id: string
  agent_id: string
  
  date: date
  start_time: string                 // "10:00"
  end_time: string                   // "14:00"
  address: string
  instructions: string
  expected_visitors: number
  sign_ins: {                        // Visitor sign-in sheet
    name: string
    phone: string
    email: string
    interest_level: 'high' | 'medium' | 'low'
    feedback: string
  }[]
  photos: string[]                   // Photos of visitors/attendance
}
```

---

## Phase 3: Activity & Communication

### 3.1 Activity Log
```typescript
interface Activity {
  id: string
  user_id: string                     // Agent who performed action
  contact_id?: string
  listing_id?: string
  
  activity_type: 'call' | 'email' | 'sms' | 'whatsapp' | 'meeting' | 
                 'showing' | 'note' | 'document' | 'status-change' | 'listing-created' |
                 'listing-updated' | 'media-added' | 'template-sent'
  
  subject?: string
  content: string
  direction: 'inbound' | 'outbound' | 'internal'
  duration?: number                    // minutes for calls
  outcome?: string                     // Result of the interaction
  next_action?: string                // Suggested next step
  
  attachments?: string[]               // URLs to documents/audio/etc.
  
  created_at: timestamp
}
```

### 3.2 Communication Templates
```typescript
interface CommunicationTemplate {
  id: string
  user_id: string
  
  name: string
  category: 'listing-intro' | 'follow-up' | 'offer' | 'open-house' | 
            'new-listing' | 'price-change' | 'general' | 'milestone'
  
  subject: string                      // Email subject
  content: string                      // Template with placeholders
  placeholders: string[]              // e.g., ["{{contact_name}}", "{{listing_address}}"]
  
  is_default: boolean
  usage_count: number
  created_at: timestamp
  updated_at: timestamp
}
```

### 3.3 Quick Actions
- **One-click** to call, email, SMS, or WhatsApp from contact record
- **Call logging** - Auto-log after calls (integrate with telephony)
- **Email tracking** - Open/read notifications
- **WhatsApp Web integration**

---

## Phase 4: Document Management

### 4.1 Document Storage
```typescript
interface Document {
  id: string
  user_id: string
  contact_id?: string
  listing_id?: string
  
  name: string
  type: 'mandate' | 'sale-agreement' | 'offer' | 'inspection-report' | 
        'title-deed' | 'plans' | 'compliance' | 'other'
  
  file_url: string
  file_size: number
  mime_type: string
  
  expiry_date?: date                 // For documents that expire
  notes: string
  
  created_at: timestamp
  updated_at: timestamp
}
```

### 4.2 E-Signature Integration
- Send documents for e-signature (DocuSign, HelloSign integration)
- Track signing status
- Auto-archive signed documents

---

## Phase 5: Analytics & Reporting

### 5.1 Agent Dashboard
```typescript
interface AgentDashboardMetrics {
  // Pipeline
  total_pipeline_value: number
  deals_this_month: number
  deals_closed_this_month: number
  conversion_rate: number
  
  // Activity
  calls_today: number
  emails_sent_today: number
  showings_this_week: number
  
  // Listings
  active_listings: number
  listings_sold_this_month: number
  avg_days_on_market: number
  
  // Contacts
  new_leads_this_week: number
  hot_leads: number
  contacts_not_contacted_7_days: number
  
  // Commission
  commission_earned_this_month: number
  commission_expected_this_month: number
}
```

### 5.2 Reports
- **Pipeline Report** - All deals by stage with value
- **Activity Report** - Calls, emails, showings by agent
- **Listing Performance** - Views, inquiries, days on market
- **Top Performers** - Best converting agents (for teams)
- **Revenue Report** - Commission tracking

---

## Phase 6: Automation & AI

### 6.1 Workflow Automation
```typescript
interface AutomationWorkflow {
  id: string
  user_id: string
  
  name: string
  description: string
  is_active: boolean
  
  trigger: {
    type: 'lead-new' | 'listing-new' | 'showing-completed' | 
           'listing-status-change' | 'contact-tag-added' | 'manual'
    conditions?: {                 // Additional trigger conditions
      field: string
      operator: 'equals' | 'not-equals' | 'contains' | 'greater-than'
      value: any
    }[]
  }
  
  actions: {                       // Actions to perform when triggered
    type: 'send-email' | 'send-sms' | 'add-tag' | 'create-task' | 
          'update-field' | 'notify-agent' | 'add-to-sequence'
    config: Record<string, any>
  }[]
  
  execution_count: number
  last_executed?: timestamp
}
```

### 6.2 AI-Powered Features
- **Smart Lead Scoring** - Auto-score leads based on activity and demographics
- **Best Match Suggestions** - AI suggests listings for buyers based on preferences
- **Optimal Pricing** - AI analyzes comparable sales for pricing recommendations
- **Market Insights** - AI-generated market trends and statistics
- **Automated Follow-ups** - AI suggests when and how to follow up

---

## Phase 7: Integrations

### 7.1 Listing Portal Integrations
- **Property24** - Import listings, sync status
- **Private Property** - Two-way sync
- **Rightmove / Zoopla** - For international agents
- **Google Places** - Auto-fetch address details

### 7.2 Communication Integrations
- **WhatsApp Business** - Direct messaging
- **Twilio** - SMS capability
- **SendGrid** - Email marketing
- **Google Calendar** - Calendar sync

### 7.3 Document & E-Sign
- **DocuSign** - E-signatures
- **Dropbox / Google Drive** - Cloud storage

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Enhanced Contact Fields (budget, preferences) | High | Low | 🔴 P0 |
| Contact-Listing Matching | High | Medium | 🔴 P0 |
| Task Management | High | Low | 🔴 P0 |
| Showing Scheduling | High | Medium | 🔴 P0 |
| Pipeline View | High | Low | 🔴 P0 |
| Activity Logging | Medium | Low | 🟡 P1 |
| Communication Templates | Medium | Low | 🟡 P1 |
| Document Storage | Medium | Medium | 🟡 P1 |
| Agent Dashboard Metrics | Medium | Low | 🟡 P1 |
| Quick Actions (call/email/SMS) | High | Medium | 🟡 P1 |
| Automation Workflows | Medium | High | 🟢 P2 |
| AI-Powered Matching | High | High | 🟢 P2 |
| Portal Integrations | Medium | High | 🟢 P2 |
| E-Signatures | Low | Medium | 🟢 P2 |

---

## Quick Wins (Phase 0 - Immediate)

### Database Updates
```sql
-- Add new columns to contacts table
ALTER TABLE crm_contacts ADD COLUMN preferred_locations TEXT[];
ALTER TABLE crm_contacts ADD COLUMN budget_min DECIMAL(12,2);
ALTER TABLE crm_contacts ADD COLUMN budget_max DECIMAL(12,2);
ALTER TABLE crm_contacts ADD COLUMN rating INTEGER DEFAULT 3;
ALTER TABLE crm_contacts ADD COLUMN last_contacted_at TIMESTAMP;

-- Add new columns to listings table
ALTER TABLE crm_listings ADD COLUMN property_type VARCHAR(50);
ALTER TABLE crm_listings ADD COLUMN mandate_expiry DATE;
ALTER TABLE crm_listings ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE crm_listings ADD COLUMN inquiry_count INTEGER DEFAULT 0;

-- Create tasks table
CREATE TABLE crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES crm_contacts(id),
  listing_id UUID REFERENCES crm_listings(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create activities table
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES crm_contacts(id),
  listing_id UUID REFERENCES crm_listings(id),
  activity_type VARCHAR(50) NOT NULL,
  content TEXT,
  direction VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### UI Updates
1. **Enhanced Contact Form** - Add budget, preferences, rating fields
2. **Enhanced Listing Form** - Add property type, mandate expiry, view counts
3. **Task Widget** - Add to dashboard sidebar
4. **Quick Actions** - Call, Email, SMS buttons on contact cards
5. **Activity Timeline** - Show recent interactions on contact/listing pages

---

## Value Proposition for Agents

| Feature | Value Proposition |
|---------|-------------------|
| **Buyer-Seller Matching** | Save time by only showing relevant properties |
| **Task Management** | Never miss a follow-up again |
| **Pipeline View** | Visualize and forecast your revenue |
| **Activity Logging** | Build relationships through consistent communication |
| **Showing Scheduling** | Professional scheduling with confirmations |
| **Document Storage** | All documents in one place |
| **Automation** | Focus on selling, not admin work |
| **Analytics** | Make data-driven decisions |
| **Integrations** | Work with tools you already use |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users | Increase by 50% |
| Contacts Created per User | +3 per week |
| Tasks Completed Rate | 80%+ |
| Pipeline Deals | +5 per agent per month |
| Listings Synced | 100% (with portal integration) |
| Time Saved | 2+ hours per day on admin |

---

## Next Steps

1. **Review & Approve Plan** - Confirm priorities with stakeholders
2. **Database Migration** - Create SQL for Phase 0 changes
3. **UI Mockups** - Design enhanced contact/listing/task forms
4. **API Design** - Plan new endpoints for tasks, activities, pipeline
5. **Sprint Planning** - Break into 1-week sprints

---

*Document Version: 1.0*  
*Last Updated: 2024*

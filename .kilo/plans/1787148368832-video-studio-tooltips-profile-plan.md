# Video Make Studio: Tooltips + In-Studio Agent Profile Setup

## Validation Summary
Inspected `VideoMakeStudioWizard.tsx`, `api/agent-profile/route.ts`, `supabase.ts`, `lib/types.ts`, and existing modals (`AgentProfilePopup.tsx`, `TemplateSelectionModal.tsx`).

**Key findings:**
- `router.push('/templates')` exists at line 672 and must be removed to preserve wizard state.
- `Input` already supports `helper` prop for inline hints.
- `uploadImage(file, userId)` returns `{ data: { id: string; url: string } | null; error: Error | null }`.
- `POST /api/agent-profile` accepts `photo_url` / `logo_url` in body and returns `{ profile, message }`.
- `PREDEFINED_BRANDS` exists in `@/lib/types`.
- No drag-and-drop or ↑/↓ reorder exists on the review step (plan tooltip assumed it did).
- `AgentProfilePopup.tsx` already exists for templates but does not save to the API; a new studio-specific modal is appropriate.

## Implementation Plan

### Task 1: Add `InfoTip` component
Create `src/components/ui/InfoTip.tsx`:
- Props: `text: string`, optional `label?: string`.
- Render a small inline SVG "?" circle with `tabIndex={0}`.
- Show `text` in an absolutely-positioned popover on hover/focus.
- Style: white bg, slate border, `text-sm`, `rounded-lg`, `shadow-sm`, `z-50`.

### Task 2: Add tooltips to wizard steps
Attach `InfoTip` to step headers / controls:
- **format**: "Clips are generated and cropped to this size. Choose TikTok/Reels (9:16), Square, or Landscape — no black bars."
- **images**: "Upload 3–30 images. Order matters — the sequence you upload them becomes the clip order. Use clear, well-lit, consistent-style photos."
- **calling_card**: "A branded calling card appears at the bottom of the final video. Your agent profile personalizes it with your name, photo, and logo."
- **generate**: "Clips are generated one at a time. Keep this tab open; ~30s per clip."
- **review**: "Review your clips. Failed clips can be retried below." (Removed reorder reference since it doesn't exist yet.)
- **transition**: "A short fade is applied between every clip."
- **finish**: "Stitching runs in your browser. Keep the tab open; it may take a minute for many clips."
- Add `helper` prop to `Input` fields for Price, Bedrooms, Bathrooms, Headline, CTA with concise hints.

### Task 3: In-studio agent profile modal
Create `src/components/video/AgentProfileSetupModal.tsx`:
- Follow existing modal pattern: fixed inset-0 backdrop + centered white card.
- Fields: Full name, Email, Phone, Agency (`<select>` from `PREDEFINED_BRANDS`), Photo file input, Logo file input.
- Pre-fill from `agentProfile` when editing.
- Save flow:
  1. If photo file selected → `await uploadImage(photoFile, user.id)` → `photoUrl`.
  2. If logo file selected → `await uploadImage(logoFile, user.id)` → `logoUrl`.
  3. `fetch('/api/agent-profile', { method: 'POST', headers: { Authorization: \`Bearer ${session.access_token}\`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name_surname, email, phone, agency_brand, photo_url, logo_url }) })`.
  4. On success: `setAgentProfile(data.profile)`, `setAgentProfileMissing(false)`, update `headline` if name exists.
- Open triggers:
  - Replace `router.push('/templates')` button when `agentProfileMissing` with `setShowProfileModal(true)`.
  - Add persistent "Edit profile" button in calling-card step (visible even when profile exists).

### Task 4: Missing-profile awareness
- Calling-card step: keep amber notice but open the modal. Text: "Add your agent profile so your name, photo and logo appear on the video."
- Format step (landing): when `agentProfileMissing`, show small non-blocking slate notice: "Tip: set up your agent profile for branded videos."

### Task 5: State preservation
- Remove `router.push('/templates')` entirely from the wizard.
- All profile setup happens inside the modal; wizard state (images, format, selections) remains intact.

## Files to Change
| File | Action |
|------|--------|
| `src/components/ui/InfoTip.tsx` | Create |
| `src/components/video/AgentProfileSetupModal.tsx` | Create |
| `src/components/video/VideoMakeStudioWizard.tsx` | Edit: tooltips, modal integration, remove `router.push('/templates')`, add Edit button, add landing notice |

## Validation
- `bun typecheck` scoped to changed files.
- `bun lint` scoped to changed files.
- Manual check: open studio, verify tooltips appear, open profile modal, save profile, verify calling-card preview updates, verify wizard state preserved after modal close.

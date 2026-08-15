# Plan: Admin User Usage History

## Goal
Add a **History** tab to the admin dashboard showing a chronological feed of what each user did in the last 24 hours (and beyond), so admins can see which agent/feature was used, by whom, and when.

## Decisions
- **Placement**: New "History" tab in admin dashboard (`src/app/admin/page.tsx`)
- **Detail level**: Compact list — user name/email, agent name, timestamp, credits spent
- **Default time range**: Last 24 hours, with filters for 7 days, 30 days, all time, and custom range
- **Data source**: Existing `credit_transactions` table (type=`usage`), no schema migration required

## Implementation Tasks

### 1. Extend Admin Usage API
**File**: `src/app/api/admin/usage/route.ts`

- Accept a new query param `mode=history`
- When `mode=history`:
  - Fetch `credit_transactions` where `type = 'usage'`, paginated
  - Join each transaction with `users` to get `email` and `full_name`
  - Apply `startDate` / `endDate` filters (default last 24h when `mode=history`)
  - Derive `agent_name` from the `description` field by mapping the operation keyword to a friendly label:
    - `photo_edit` → `Photo Edit`
    - `image_to_video_*` → `Image to Video`
    - `video_editor_simple`, `video_full_edit`, `video_trim`, `video_concat`, `video_transition`, `video_text_overlay` → `Video Editor`
    - `template_generation`, `layout_generation`, `template_render`, `professional_template` → `Template Generation`
    - `description_generation` → `Description Generator`
    - `content_plan_generation` → `Content Plan`
    - `prompt_generation` → `Prompt Generation`
    - anything else → keep raw description or map to `Other`
  - Return array of entries sorted by `created_at DESC`:
    ```ts
    {
      userId, email, fullName, agentName, creditsSpent, timestamp: created_at
    }
    ```

### 2. Update Admin Dashboard UI
**File**: `src/app/admin/page.tsx`

- Add `'history'` to the `activeTab` state union type and tab buttons
- Add a new `historyEntries` state and a `historyLoading` state
- Add a `historyTimeFilter` state: `'24h' | '7d' | '30d' | 'all' | 'custom'`
- Add `historyCustomStart` and `historyCustomEnd` states
- Fetch history data when the History tab is active:
  - Call `/api/admin/usage?mode=history&startDate=X&endDate=Y`
  - Handle custom date inputs when filter is `'custom'`
- Render a table:
  - Columns: User, Agent, Credits, Time
  - Show relative time (e.g. "2 hours ago") or formatted date
  - Show a `-` or `loading` state when empty/loading

### 3. Filtering UX
- Time filter buttons: `24h`, `7d`, `30d`, `All`, `Custom`
- Custom range: two date inputs (start / end)
- Auto-refresh when filter changes
- Show count of total entries returned

## Out of Scope
- Per-user drill-down modal (can be added later)
- Export to CSV/PDF
- Real-time updates / websockets
- New database table or migration

## Validation
- Switch to History tab and confirm recent usage entries appear
- Change time filter and confirm data updates
- Verify agent names are mapped correctly for all known operations
- Verify custom date range filters correctly
- Confirm admin auth check still blocks non-admin access

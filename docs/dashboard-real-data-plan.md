# Dashboard Real Data Implementation Plan

## Problem
The dashboard currently displays hardcoded mock data instead of actual user data from the database.

## Current State
The dashboard at [`src/app/dashboard/page.tsx`](../src/app/dashboard/page.tsx) uses:
- **Hardcoded stats**: Photos Edited (47), Videos Created (23), Templates Used (15), Credits Used (156)
- **Hardcoded recent projects**: 3 mock projects
- **Hardcoded CRM stats**: Contacts (24), Listings (12), Media Files (156)

## Data Sources Available

### 1. Credit Transactions Table
```sql
credit_transactions
- user_id
- amount (negative for usage, positive for purchases/refunds)
- type: 'usage' | 'purchase' | 'subscription' | 'refund'
- description
- reference_id
- created_at
```

### 2. CRM Tables
```sql
crm_contacts - user's contacts
crm_listings - user's property listings
crm_tasks - user's tasks
crm_activities - user's activities
```

## Implementation Plan

### Step 1: Create Dashboard Stats API Endpoint
Create `/api/dashboard/stats/route.ts` to fetch real user statistics.

**Data to fetch:**
1. **Photos Edited** - Count credit transactions with description containing 'photo_edit'
2. **Videos Created** - Count credit transactions with description containing 'video'
3. **Templates Used** - Count credit transactions with description containing 'template'
4. **Credits Used** - Sum of negative credit transactions (type='usage')
5. **Recent Projects** - Last 10 credit transactions with type='usage'
6. **CRM Stats** - Count from crm_contacts, crm_listings tables

### Step 2: Update Dashboard Page
Modify the dashboard to:
1. Fetch data from the new API endpoint on mount
2. Display loading state while fetching
3. Show real data or fallback to empty/zero states

## API Response Structure

```typescript
interface DashboardStats {
  // User info
  credits: number
  subscriptionTier: string
  
  // Usage stats
  photosEdited: number
  videosCreated: number
  templatesUsed: number
  creditsUsedThisMonth: number
  creditsUsedTotal: number
  
  // Recent activity
  recentProjects: Array<{
    id: string
    name: string
    type: 'photo_edit' | 'video' | 'template' | 'description'
    status: 'completed' | 'processing' | 'failed'
    created_at: string
  }>
  
  // CRM stats
  crmStats: {
    contacts: number
    listings: number
    activeTasks: number
  }
}
```

## Files to Create/Modify

### Create
- `src/app/api/dashboard/stats/route.ts` - New API endpoint

### Modify
- `src/app/dashboard/page.tsx` - Fetch and display real data

## Database Queries

### Get Usage Counts by Type
```sql
SELECT 
  COUNT(CASE WHEN description LIKE '%photo%' THEN 1 END) as photos_edited,
  COUNT(CASE WHEN description LIKE '%video%' THEN 1 END) as videos_created,
  COUNT(CASE WHEN description LIKE '%template%' THEN 1 END) as templates_used,
  SUM(CASE WHEN type = 'usage' THEN ABS(amount) ELSE 0 END) as credits_used
FROM credit_transactions
WHERE user_id = ? 
  AND type = 'usage'
```

### Get Recent Projects
```sql
SELECT *
FROM credit_transactions
WHERE user_id = ?
  AND type = 'usage'
ORDER BY created_at DESC
LIMIT 10
```

### Get CRM Counts
```sql
SELECT 
  (SELECT COUNT(*) FROM crm_contacts WHERE user_id = ?) as contacts,
  (SELECT COUNT(*) FROM crm_listings WHERE user_id = ?) as listings,
  (SELECT COUNT(*) FROM crm_tasks WHERE user_id = ? AND status = 'pending') as active_tasks
```

## Error Handling
- Return zeros/empty arrays if user not found
- Handle database connection errors gracefully
- Include demo mode fallback for development

## Security
- Validate user session before returning data
- Use RLS-enabled queries (user_id filter)
- Rate limit API calls if needed

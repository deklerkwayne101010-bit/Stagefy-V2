# CRM Enhancement Plan

## Current Issues
1. Main CRM page uses hardcoded mock data (not fetching from database)
2. Contacts page uses demo data instead of real database
3. Missing API routes for contacts CRUD operations
4. Missing API routes for listings CRUD operations
5. No lead pipeline/kanban view
6. No contact activity timeline
7. Basic search and filtering

## Phase 1: API Routes (Priority: High)
- [ ] Create `/api/crm/contacts` - GET (list), POST (create)
- [ ] Create `/api/crm/contacts/[id]` - GET, PUT, DELETE
- [ ] Create `/api/crm/listings` - GET (list), POST (create)
- [ ] Create `/api/crm/listings/[id]` - GET, PUT, DELETE
- [ ] Ensure RLS policies are correct

## Phase 2: CRM Pages - Real Data (Priority: High)
- [ ] Update CRM main page to fetch real stats
- [ ] Update contacts page to use API
- [ ] Update listings page to use API
- [ ] Add contact detail view with full edit capability
- [ ] Add listing detail view with full edit capability

## Phase 3: Enhanced Features (Priority: Medium)
- [ ] Add lead pipeline/kanban view
- [ ] Add contact activity timeline
- [ ] Add property matching for buyers
- [ ] Add quick actions (call, email, schedule)
- [ ] Add bulk actions (delete, export)

## Phase 4: Advanced CRM Features (Priority: Low)
- [ ] Add lead source tracking
- [ ] Add referral tracking
- [ ] Add task automation
- [ ] Add email integration
- [ ] Add SMS reminders

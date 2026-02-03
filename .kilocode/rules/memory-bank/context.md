# Active Context: Stagefy SaaS Platform

## Current State

**Project Status**: 🚀 Stagefy MVP Complete

Stagefy is a comprehensive real estate media creation platform built with Next.js 16, Supabase, and React. The platform helps real estate agents edit listing photos, create videos, generate templates, and manage their CRM - all powered by AI.

## Recently Completed

### Core Features
- [x] Authentication system (Supabase Auth) with login/signup
- [x] Onboarding flow with brokerage and market selection
- [x] Main dashboard with credit balance and quick actions
- [x] AI Photo Editing page (Qwen Image Edit Plus)
- [x] Image to Video page (Replicate)
- [x] AI Template Builder page (Google Nano Banana Pro)
- [x] CRM with Contacts, Listings, and Media management
- [x] Billing & Credits page with subscription plans
- [x] Admin Dashboard for user and usage monitoring
- [x] Settings page with profile, notifications, security

### Technical Foundation
- [x] Supabase client configuration
- [x] Database types and interfaces
- [x] Auth context provider
- [x] Reusable UI components (Button, Card, Input, Badge)
- [x] Sidebar navigation with credit balance
- [x] Header with notifications dropdown
- [x] API routes for AI services (photo-edit, image-to-video, template)
- [x] Free usage tier system with 3 free AI actions
- [x] Watermark system for free tier outputs
- [x] Visual indicators for free tier usage limits

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/(landing)/` | Marketing landing page | ✅ Complete |
| `src/app/login/` | Login page | ✅ Complete |
| `src/app/signup/` | Signup page | ✅ Complete |
| `src/app/onboarding/` | Onboarding flow | ✅ Complete |
| `src/app/dashboard/` | Main dashboard | ✅ Complete |
| `src/app/photo-edit/` | AI photo editing | ✅ Complete |
| `src/app/image-to-video/` | Image to video | ✅ Complete |
| `src/app/templates/` | Template builder | ✅ Complete |
| `src/app/crm/` | CRM (contacts, listings, media) | ✅ Complete |
| `src/app/billing/` | Billing & credits | ✅ Complete |
| `src/app/admin/` | Admin dashboard | ✅ Complete |
| `src/app/settings/` | Account settings | ✅ Complete |
| `src/lib/` | Utilities & types | ✅ Complete |
| `src/components/ui/` | UI components | ✅ Complete |
| `src/components/layout/` | Layout components | ✅ Complete |

## Free Usage Tier

| Feature | Description |
|---------|-------------|
| Free Actions | 3 AI actions per new account |
| Watermark | Applied to all free tier outputs |
| Visual Indicator | Progress bar showing remaining free actions |
| Limit Warning | Alert when free limit is reached |

Users on the free tier (subscription_tier='free' with 0 credits) get 3 free AI actions. After that, they must upgrade or purchase credits.

| Operation | Credit Cost |
|-----------|-------------|
| Photo Edit | 1 credit |
| Image to Video (3s) | 5 credits |
| Image to Video (5s) | 8 credits |
| Image to Video (10s) | 15 credits |
| Template Generation | 3 credits |

## Credit Packages

| Package | Price | Credits |
|---------|-------|---------|
| 50 Credits | $15 | 50 |
| 100 Credits | $25 | 100 |
| 250 Credits | $55 | 250 |
| 500 Credits | $99 | 500 |

## Subscription Plans

| Plan | Price/Month | Credits |
|------|-------------|---------|
| Free | $0 | 50 one-time |
| Basic | $29 | 200/month |
| Pro | $79 | 500/month |
| Enterprise | $199 | 1,500/month |

## PayFast Integration

| Feature | Status |
|---------|--------|
| Payment processing | ✅ Complete |
| Subscription plans | ✅ Complete |
| Credit packages | ✅ Complete |
| Webhook handler | ✅ Complete |
| Failed payment handling | ✅ Complete |

## Template Builder Types

| Template Type | Description |
|---------------|-------------|
| Professional Template | Clean and professional design |
| Wacky Template | Creative and fun style |
| Infographic | Data-driven visual content |
| Marketing Material | Promotional content |
| Custom | Create your own |

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
REPLICATE_API_TOKEN=your-replicate-token
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase
PAYFAST_ENVIRONMENT=sandbox # or 'live'
```

## Next Steps

1. [ ] **Connect Supabase database tables** - Run schema from `supabase-schema.md`
2. [ ] Configure PayFast sandbox for testing
3. [ ] Deploy to production
4. [ ] Add email notifications
5. [ ] Implement real-time webhooks for AI services

| Date | Changes |
|------|---------|
| Initial | Base Next.js template created |
| Today | Built complete Stagefy SaaS platform |
| 2026-02-03 | Fixed TypeScript errors, added Badge className prop, installed @supabase/supabase-js, fixed unescaped entities, fixed auth-context hook |
| 2026-02-03 | Lazy load Supabase client for demo mode without env vars |
| 2026-02-03 | Added `supabase-schema.md` with complete database schema (11 tables, enums, RLS policies) |
| 2026-02-03 | Added PayFast payment integration (subscriptions, credit packages, webhook handler) |
| 2026-02-03 | Implemented free usage tier (3 free AI actions, watermark on outputs, visual indicators) |
| 2026-02-03 | Created premium marketing landing page with hero, before/after slider, features, and pricing |
| 2026-02-03 | Redesigned login and signup pages with clean, minimal design |
| 2026-02-03 | Fixed landing page routing - removed conflicting page.tsx so landing page displays at / |

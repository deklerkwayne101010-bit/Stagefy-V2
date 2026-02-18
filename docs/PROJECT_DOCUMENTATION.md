# Stagefy-V2 - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Security](#authentication--security)
5. [Credit System](#credit-system)
6. [Payment System (PayFast)](#payment-system-payfast)
7. [API Routes](#api-routes)
8. [Pages & Features](#pages--features)
9. [CRM Enhancements](#crm-enhancements)
10. [AI Features](#ai-features)
11. [User Relations & Access Control](#user-relations--access-control)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)

---

## Project Overview
**Stagefy-V2** is a comprehensive real estate marketing platform built with Next.js 14+ that helps real estate agents create professional marketing materials using AI-powered tools.

### Key Features
- AI-powered description generation
- Video and image generation for properties
- Template-based marketing materials
- CRM for managing contacts and listings
- Credit-based usage system
- PayFast payment integration

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Lucide icons
- **State Management:** React Context

### Backend
- **Runtime:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI Services:** Replicate API (for image/video generation)
- **Payments:** PayFast (South African payment processor)

### Infrastructure
- **Hosting:** Vercel (recommended)
- **Database:** Supabase
- **Storage:** Supabase Storage (for images/videos)

---

## Database Schema

### Core Tables

#### `users` (Supabase Auth)
```sql
id UUID PRIMARY KEY REFERENCES auth.users
email TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `user_profiles`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
full_name TEXT
phone TEXT
company TEXT
avatar_url TEXT
subscription_tier TEXT DEFAULT 'free'
credits INTEGER DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `agent_profiles`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
agent_name TEXT
agency_name TEXT
phone TEXT
email TEXT
website TEXT
social_media JSONB
logo_url TEXT
bio TEXT
include_in_templates BOOLEAN DEFAULT true
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `properties`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
title TEXT
description TEXT
address TEXT
city TEXT
province TEXT
postal_code TEXT
price DECIMAL
property_type TEXT
bedrooms INTEGER
bathrooms INTEGER
garages INTEGER
land_size DECIMAL
features JSONB
images JSONB
status TEXT DEFAULT 'active'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### CRM Tables

#### `crm_contacts`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
name TEXT
email TEXT
phone TEXT
contact_type TEXT -- buyer, seller, landlord, tenant, investor, developer
status TEXT DEFAULT 'active'
source TEXT -- property_portal, referral, website, etc.
rating INTEGER CHECK (rating BETWEEN 1 AND 5)

-- Enhanced fields
budget_min DECIMAL
budget_max DECIMAL
preferences JSONB -- property_types, locations, features, etc.
property_address TEXT
property_type TEXT
bedrooms INTEGER
asking_price DECIMAL
mandate_expiry DATE

notes TEXT
last_contacted_at TIMESTAMP
tags TEXT[]

created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `crm_listings`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
address TEXT
city TEXT
suburb TEXT
property_type TEXT
bedrooms INTEGER
bathrooms INTEGER
garages INTEGER
asking_price DECIMAL
listing_type TEXT -- sale, rent
status TEXT DEFAULT 'active'
features JSONB
description TEXT

-- Enhanced fields
inquiry_count INTEGER DEFAULT 0
view_count INTEGER DEFAULT 0
mandate_expiry DATE
agent_id UUID -- references crm_contacts.id

created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `crm_tasks`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
title TEXT
description TEXT
task_type TEXT -- follow-up, showing, call, meeting, admin, etc.
priority TEXT -- low, medium, high, urgent
status TEXT DEFAULT 'pending'
due_date TIMESTAMP
contact_id UUID REFERENCES crm_contacts.id
listing_id UUID REFERENCES crm_listings.id
reminder TIMESTAMP
completed_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

#### `crm_activities`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
activity_type TEXT -- call, email, sms, whatsapp, meeting, showing, note, task
subject TEXT
content TEXT
direction TEXT -- inbound, outbound, internal
duration INTEGER -- minutes
outcome TEXT
next_action TEXT
contact_id UUID REFERENCES crm_contacts.id
listing_id UUID REFERENCES crm_listings.id
created_at TIMESTAMP
```

### Credit System Tables

#### `credits`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
amount INTEGER
type TEXT -- purchase, usage, refund, bonus
description TEXT
reference_id UUID -- for tracking usage
expires_at TIMESTAMP
created_at TIMESTAMP
```

#### `credit_usage`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
operation_type TEXT -- description_generation, video_generation, etc.
credits_used INTEGER
metadata JSONB
created_at TIMESTAMP
```

### Payment Tables

#### `transactions`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
amount DECIMAL
currency TEXT DEFAULT 'ZAR'
status TEXT -- pending, completed, failed, refunded
payment_method TEXT
payfast_payment_id TEXT
credits_purchased INTEGER
metadata JSONB
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Authentication & Security

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. Session tokens managed by Supabase
3. Protected routes check for valid session

### Security Features

#### Row Level Security (RLS)
All tables have RLS enabled to ensure:
- Users can only access their own data
- No cross-user data access
- Secure by default

#### API Security
- **Rate Limiting:** Applied to AI endpoints
- **Credit Checks:** Required before expensive operations
- **Input Validation:** Zod schemas for request validation
- **Error Handling:** Generic error messages in production

### Protected Routes
```typescript
// Middleware-based protection
- /dashboard/*
- /properties/*
- /templates/*
- /account/*
- /admin/*
```

### Public Routes
- `/login`
- `/register`
- `/pricing`
- `/` (landing page)

---

## Credit System

### Credit Types
- **Standard Credits:** Used for most operations
- **Bonus Credits:** Sometimes given as promotions

### Credit Costs
| Operation | Credits |
|-----------|---------|
| Description Generation | 1 |
| Template Generation | 1-2 |
| Video Generation | 5 |
| Image Generation | 2 |
| AI Playground | 1 |

### Credit Management
```typescript
// Check and deduct credits atomically
const { data: user } = await supabase
  .from('user_profiles')
  .select('credits')
  .eq('id', userId)
  .single()

if (user.credits < cost) {
  return { error: 'Insufficient credits' }
}

// Deduct credits
await supabase
  .from('user_profiles')
  .update({ credits: user.credits - cost })
  .eq('id', userId)

// Log usage
await supabase.from('credit_usage').insert({
  user_id: userId,
  operation_type,
  credits_used: cost,
  metadata,
})
```

---

## Payment System (PayFast)

### PayFast Integration
- **ITN (Instant Transaction Notification):** Webhook for **Checkout API payment confirmation
-:** Initiates payment sessions
- **Credit Allocation:** Automatic credit addition on payment success

### Payment Flow
1. User selects credit package
2. System creates pending transaction
3. User redirected to PayFast checkout
4. PayFast processes payment
5. PayFast sends ITN webhook
6. System verifies and credits user

### PayFast Security
- Signature verification
- Amount validation
- Merchant ID check

### Supported Packages
| Package | Credits | Price (ZAR) |
|---------|---------|-------------|
| Starter | 50 | R199 |
| Professional | 150 | R499 |
| Enterprise | 500 | R1299 |

---

## API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property
- `GET /api/properties/[id]` - Get property
- `PATCH /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property
- `POST /api/properties/[id]/images` - Upload images

### AI Features
- `POST /api/ai/description-generator` - Generate property descriptions
- `POST /api/ai/template` - Generate marketing materials
- `POST /api/ai/video` - Generate property videos
- `POST /api/ai/image` - Generate AI images
- `POST /api/ai/playground` - AI playground

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `GET /api/templates/[id]` - Get template
- `PATCH /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template

### Credits
- `GET /api/credits` - Get credit balance
- `POST /api/credits/usage` - Log credit usage

### Payments
- `POST /api/payfast/checkout` - Initiate checkout
- `POST /api/payfast/itn` - Handle ITN webhook

### CRM
- `GET /api/crm/contacts` - List contacts
- `POST /api/crm/contacts` - Create contact
- `GET /api/crm/listings` - List CRM listings
- `GET /api/crm/tasks` - List tasks
- `POST /api/crm/tasks` - Create task
- `PATCH /api/crm/tasks` - Update task
- `DELETE /api/crm/tasks` - Delete task
- `GET /api/crm/activities` - List activities
- `POST /api/crm/activities` - Create activity

---

## Pages & Features

### Dashboard (`/dashboard`)
- Overview stats (properties, credits, recent activity)
- Quick actions
- Recent properties
- Credit balance

### Properties (`/properties`)
- Property listing with filters
- Property cards with images
- Add/edit property modal
- Property detail view

### Property Editor (`/property-editor/[id]`)
- Property details form
- Image upload/management
- Feature selection
- Generate marketing materials

### Templates (`/templates`)
- Template library
- Template preview
- Agent Profile tab
- Custom template option
- Generate materials

### Description Generator (`/description-generator`)
- AI-powered description generation
- Property details form
- Style selection
- Credit usage display

### AI Playground (`/ai-playground`)
- Experimental AI features
- Prompt-based image/video generation
- Usage tracking

### Marketing Materials (`/marketing-materials`)
- Generated materials gallery
- Download options
- Share functionality

### CRM Pages

#### Contacts (`/crm/contacts`)
- Contact list with filters
- Contact cards with rating
- Quick actions (call, email, task)
- Enhanced fields (budget, preferences)

#### Listings (`/crm/listings`)
- Listing management
- Inquiry tracking
- View count stats
- Enhanced fields (mandate, property type)

#### Tasks (`/crm/tasks`)
- Task list with priorities
- Due date tracking
- Contact/listing associations
- Completion tracking

#### Activities (`/crm/activities`)
- Activity timeline
- Activity type filters
- Contact/listing links

### Account (`/account`)
- Profile management
- Subscription status
- Credit balance
- Billing history

### Admin (`/admin`)
- User management
- System settings
- Marketing materials admin

---

## CRM Enhancements

### Enhanced Contact Fields
- **Rating:** 1-5 star rating
- **Budget:** Min/max price range
- **Preferences:** JSON object with:
  - Property types
  - Bedroom count
  - Locations
  - Features
  - Yield requirements (for investors)
- **Property Details:** For seller contacts
- **Mandate Expiry:** Date tracking
- **Tags:** For segmentation

### Enhanced Listing Fields
- **Inquiry Count:** Track interest
- **View Count:** Track views
- **Mandate Expiry:** Expiration tracking
- **Agent Link:** Connect to contact
- **Suburb:** Detailed location

### Task Management
- **Priority Levels:** Low, Medium, High, Urgent
- **Task Types:** Follow-up, Showing, Call, Meeting, Admin
- **Associations:** Link to contacts/listings
- **Reminders:** Set notification times
- **Completion Tracking:** Auto timestamp

### Activity Logging
- **Activity Types:** Call, Email, SMS, WhatsApp, Meeting, Showing, Note
- **Direction:** Inbound, Outbound, Internal
- **Duration:** Track time spent
- **Outcomes:** Record results
- **Next Actions:** Prompt follow-ups
- **Auto Updates:** Last contacted date

---

## AI Features

### Description Generator
- **Model:** Replicate `qwen/qwen3-235b-a22b-instruct-2507`
- **Inputs:** Property details, style preference
- **Output:** Professional property description
- **Cost:** 1 credit

### Template Generator (Professional)
- **Model:** Replicate `openai/gpt-4.1-nano`
- **Inputs:** Property details, photo frames, agent info
- **Output:** Creative marketing prompt for Nano Banana Pro
- **Cost:** 3 credits

### Template Generator
- **Styles:** Multiple template options
- **Custom Prompts:** User-defined descriptions
- **Agent Profile:** Include agent branding
- **Cost:** 1-2 credits

### Video Generation
- **Platform:** Replicate
- **Inputs:** Property images, style
- **Output:** Property video walkthrough
- **Cost:** 5 credits

### Image Generation
- **Platform:** Replicate
- **Inputs:** Property description, style
- **Output:** AI-enhanced property images
- **Cost:** 2 credits

---

## User Relations & Access Control

### User Roles
- **Free User:** Limited credits, basic features
- **Pro User:** More credits, all features
- **Admin:** System access, user management

### Data Access Rules
1. **Row Level Security (RLS):**
   - Users can only access their own data
   - Admin can access all data
   - No cross-user data access

2. **API-Level Checks:**
   - Verify session on every request
   - Check credit balance before operations
   - Validate input data

3. **Feature Access:**
   - Some features require subscription
   - Credit balance required for AI features
   - Admin features restricted

---

## Environment Variables

### Required Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate API Token (for GPT-4.1-nano, Qwen, Flux, etc.)
REPLICATE_API_TOKEN=your_replicate_token

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Stagefy

# PayFast (optional, for payments)
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
```

### Optional Variables
```env
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Add environment variables
3. Deploy

### Database Setup
1. Create Supabase project
2. Run migrations in `supabase/migrations/`
3. Set up RLS policies
4. Configure storage buckets

### Payment Setup
1. Create PayFast merchant account
2. Configure ITN URL
3. Set up payment packages

---

## File Structure

```
Stagefy-V2/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   ├── auth/
│   │   │   ├── credits/
│   │   │   ├── crm/
│   │   │   ├── payfast/
│   │   │   ├── properties/
│   │   │   └── templates/
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── templates/
│   │   ├── description-generator/
│   │   ├── ai-playground/
│   │   ├── marketing-materials/
│   │   ├── crm/
│   │   ├── account/
│   │   ├── admin/
│   │   └── login/
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   └── properties/
│   ├── contexts/
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── types.ts
│   │   └── demo-crm-data.ts
│   └── hooks/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── docs/
│   ├── PROJECT_DOCUMENTATION.md
│   └── crm-enhancement-plan.md
├── .env.local
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Common Operations

### Adding a New Credit-Based Feature
1. Define credit cost in `src/lib/credits.ts`
2. Create API route with credit check
3. Add frontend component
4. Update documentation

### Adding a New CRM Field
1. Add column to database migration
2. Update TypeScript types
3. Add to API routes (GET/PATCH)
4. Update UI components
5. Add to demo data

### Modifying Credit Costs
1. Update cost in API route
2. Update frontend display
3. Notify users of changes

---

## Support & Maintenance

### Monitoring
- Check Vercel logs for errors
- Monitor Supabase dashboard
- Track credit usage
- Monitor PayFast transactions

### Backup
- Supabase provides automatic backups
- Consider additional backups for critical data

### Updates
- Keep dependencies updated
- Review security patches
- Test AI model updates

---

*Last Updated: 2024-01-15*
*Version: 2.0.0*

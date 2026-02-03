# Stagefy MVP - Supabase Database Schema

## Overview

This schema defines all tables, relationships, and enums needed for the Stagefy real estate media platform MVP.

---

## Enums

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('agent', 'admin');

-- Subscription tiers
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');

-- Credit transaction types
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'subscription');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'paused', 'past_due');

-- Project/Job status
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Project types
CREATE TYPE project_type AS ENUM ('photo_edit', 'video', 'template');

-- AI service providers
CREATE TYPE ai_service AS ENUM ('replicate', 'qwen', 'nano_banana');

-- Contact types
CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'other');

-- Contact status
CREATE TYPE contact_status AS ENUM ('lead', 'active', 'closed');

-- Listing status
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'off_market');

-- Media types
CREATE TYPE media_type AS ENUM ('image', 'video', 'template');

-- Template types
CREATE TYPE template_type AS ENUM ('listing_promo', 'instagram_reel', 'open_house', 'custom');

-- Notification types
CREATE TYPE notification_type AS ENUM ('credit_low', 'job_completed', 'payment_success', 'payment_failed', 'subscription_renewal', 'system');

-- Use case preference
CREATE TYPE use_case AS ENUM ('photos', 'video', 'templates', 'all');
```

---

## Tables

### 1. users

Main user table extending Supabase Auth.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY REFERENCES auth.users(id) | User ID (links to Auth) |
| email | text | UNIQUE NOT NULL | User email address |
| full_name | text | NOT NULL | User's full name |
| brokerage | text | | brokerage name |
| market | text | | geographic market area |
| use_case | use_case | DEFAULT 'all' | Primary use case preference |
| role | user_role | DEFAULT 'agent' | User role |
| credits | integer | DEFAULT 50 | Available credit balance |
| subscription_tier | subscription_tier | DEFAULT 'free' | Current subscription plan |
| avatar_url | text | | URL to user avatar |
| phone | text | | Contact phone number |
| created_at | timestamptz | DEFAULT NOW() | Account creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_subscription_tier` on `subscription_tier`

---

### 2. subscriptions

User subscription plans (integrates with PayFast).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Subscription ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| plan_id | text | NOT NULL | Plan identifier (basic, pro, enterprise) |
| status | subscription_status | NOT NULL | Subscription status |
| payfast_subscription_id | text | UNIQUE | PayFast subscription ID |
| payfast_customer_id | text | | PayFast customer reference |
| current_period_start | timestamptz | | Start of billing period |
| current_period_end | timestamptz | | End of billing period |
| credits_remaining | integer | | Credits remaining in period |
| monthly_credits | integer | NOT NULL | Credits allocated per month |
| price_paid | numeric(10,2) | | Amount paid per month |
| created_at | timestamptz | DEFAULT NOW() | Subscription creation |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_subscriptions_user_id` on `user_id`
- `idx_subscriptions_status` on `status`
- `idx_subscriptions_payfast_id` on `payfast_subscription_id`

---

### 3. credit_transactions

Audit log of all credit additions and deductions.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Transaction ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| amount | integer | NOT NULL | Credit amount (+/-) |
| type | credit_transaction_type | NOT NULL | Transaction type |
| description | text | | Human-readable description |
| subscription_id | uuid | REFERENCES subscriptions(id) | Link to subscription if applicable |
| reference_id | text | | External reference (payment ID, etc.) |
| created_at | timestamptz | DEFAULT NOW() | Transaction timestamp |

**Indexes:**
- `idx_credit_transactions_user_id` on `user_id`
- `idx_credit_transactions_type` on `type`
- `idx_credit_transactions_created_at` on `created_at DESC`

---

### 4. projects

Tracks AI generation jobs (photo edits, videos, templates).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Project ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| name | text | NOT NULL | Project name |
| type | project_type | NOT NULL | Type of project |
| status | job_status | DEFAULT 'pending' | Processing status |
| credit_cost | integer | DEFAULT 0 | Credits spent |
| input_data | jsonb | DEFAULT '{}' | Input parameters/outputs |
| output_data | jsonb | DEFAULT '{}' | AI-generated outputs |
| error_message | text | | Error details if failed |
| created_at | timestamptz | DEFAULT NOW() | Project creation |
| completed_at | timestamptz | | Completion timestamp |

**Indexes:**
- `idx_projects_user_id` on `user_id`
- `idx_projects_status` on `status`
- `idx_projects_type` on `type`
- `idx_projects_created_at` on `created_at DESC`

---

### 5. ai_jobs

Tracks individual AI service API calls for monitoring and billing.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Job ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| project_id | uuid | REFERENCES projects(id) ON DELETE SET NULL | Related project |
| service | ai_service | NOT NULL | AI service provider |
| model | text | NOT NULL | Model identifier |
| input | jsonb | DEFAULT '{}' | Input parameters |
| status | job_status | DEFAULT 'queued' | Job status |
| output_url | text | | URL to generated output |
| error_message | text | | Error details |
| credit_cost | integer | DEFAULT 0 | Credits charged |
| api_cost | numeric(10,4) | | Cost from AI provider |
| latency_ms | integer | | Processing time in milliseconds |
| created_at | timestamptz | DEFAULT NOW() | Job creation |
| completed_at | timestamptz | | Completion timestamp |

**Indexes:**
- `idx_ai_jobs_user_id` on `user_id`
- `idx_ai_jobs_service` on `service`
- `idx_ai_jobs_status` on `status`
- `idx_ai_jobs_created_at` on `created_at DESC`

---

### 6. crm_contacts

Real estate contacts (buyers, sellers, etc.).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Contact ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| name | text | NOT NULL | Contact name |
| email | text | | Email address |
| phone | text | | Phone number |
| type | contact_type | DEFAULT 'other' | Contact type |
| status | contact_status | DEFAULT 'lead' | Relationship status |
| notes | text | | Additional notes |
| tags | text[] | DEFAULT '{}' | Tag labels |
| last_contacted_at | timestamptz | | Last contact timestamp |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_crm_contacts_user_id` on `user_id`
- `idx_crm_contacts_status` on `status`
- `idx_crm_contacts_type` on `type`
- `idx_crm_contacts_name` on `name`

---

### 7. crm_listings

Property listings managed by the user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Listing ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| contact_id | uuid | REFERENCES crm_contacts(id) | Related contact |
| address | text | NOT NULL | Property address |
| city | text | | City |
| state | text | | State/Province |
| zip_code | text | | Postal code |
| price | numeric(12,2) | | Listing price |
| bedrooms | integer | | Number of bedrooms |
| bathrooms | decimal(3,1) | | Number of bathrooms |
| sqft | integer | | Square footage |
| status | listing_status | DEFAULT 'active' | Listing status |
| notes | text | | Additional notes |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_crm_listings_user_id` on `user_id`
- `idx_crm_listings_status` on `status`
- `idx_crm_listings_contact_id` on `contact_id`

---

### 8. media_items

All generated media files (images, videos, templates).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Media ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| listing_id | uuid | REFERENCES crm_listings(id) | Related listing |
| contact_id | uuid | REFERENCES crm_contacts(id) | Related contact |
| project_id | uuid | REFERENCES projects(id) | Source project |
| type | media_type | NOT NULL | Media type |
| title | text | | Media title |
| description | text | | Description |
| url | text | NOT NULL | Storage URL |
| thumbnail_url | text | | Thumbnail URL |
| file_size | integer | | File size in bytes |
| credits_used | integer | DEFAULT 0 | Credits spent |
| tags | text[] | DEFAULT '{}' | Tag labels |
| is_favorite | boolean | DEFAULT false | User favorite flag |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_media_items_user_id` on `user_id`
- `idx_media_items_listing_id` on `listing_id`
- `idx_media_items_type` on `type`
- `idx_media_items_project_id` on `project_id`

---

### 9. templates

User-created or saved AI templates.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Template ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| name | text | NOT NULL | Template name |
| type | template_type | NOT NULL | Template category |
| description | text | | Description |
| thumbnail_url | text | | Preview thumbnail |
| output_url | text | | Last generated output |
| prompt_template | text | | AI prompt template |
| settings | jsonb | DEFAULT '{}' | Saved settings |
| credits_used | integer | DEFAULT 0 | Credits spent |
| usage_count | integer | DEFAULT 0 | Times used |
| is_public | boolean | DEFAULT false | Public template flag |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_templates_user_id` on `user_id`
- `idx_templates_type` on `type`
- `idx_templates_public` on `is_public`

---

### 10. notifications

User notifications and alerts.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Notification ID |
| user_id | uuid | REFERENCES users(id) ON DELETE CASCADE | User ID |
| type | notification_type | NOT NULL | Notification type |
| title | text | NOT NULL | Notification title |
| message | text | NOT NULL | Notification message |
| read | boolean | DEFAULT false | Read status |
| action_url | text | | Link to related content |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_notifications_user_id` on `user_id`
- `idx_notifications_read` on `read`
- `idx_notifications_created_at` on `created_at DESC`

---

### 11. admin_audit_log

Admin activity tracking (optional, for compliance).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Log ID |
| admin_user_id | uuid | REFERENCES users(id) | Admin who performed action |
| action | text | NOT NULL | Action description |
| resource_type | text | | Affected table/resource |
| resource_id | uuid | | Affected record ID |
| old_values | jsonb | | Previous state |
| new_values | jsonb | | New state |
| ip_address | inet | | Request IP |
| created_at | timestamptz | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_admin_audit_admin_user_id` on `admin_user_id`
- `idx_admin_audit_created_at` on `created_at DESC`

---

## Relationships Diagram

```
users (1) ──────┬────── (1) subscriptions
                │
                ├────── (1) credit_transactions
                │
                ├────── (1) projects
                │             │
                │             └────── (N) ai_jobs
                │
                ├────── (1) crm_contacts
                │             │
                │             └────── (N) crm_listings
                │
                ├────── (1) media_items
                │             │
                │             ├────── (N) crm_listings
                │             ├────── (N) crm_contacts
                │             └────── (N) projects
                │
                ├────── (1) templates
                │
                └────── (N) notifications
```

---

## Row Level Security (RLS) Policies

Enable RLS on all tables to ensure data isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Similar policies for all other tables
CREATE POLICY "Users can access own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own contacts" ON crm_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Admin role can access all data
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Setup SQL Script

Run this in Supabase SQL Editor to create the complete schema:

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('agent', 'admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'pro', 'enterprise');
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'usage', 'refund', 'subscription');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'paused', 'past_due');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE project_type AS ENUM ('photo_edit', 'video', 'template');
CREATE TYPE ai_service AS ENUM ('replicate', 'qwen', 'nano_banana');
CREATE TYPE contact_type AS ENUM ('buyer', 'seller', 'investor', 'other');
CREATE TYPE contact_status AS ENUM ('lead', 'active', 'closed');
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'sold', 'off_market');
CREATE TYPE media_type AS ENUM ('image', 'video', 'template');
CREATE TYPE template_type AS ENUM ('listing_promo', 'instagram_reel', 'open_house', 'custom');
CREATE TYPE notification_type AS ENUM ('credit_low', 'job_completed', 'payment_success', 'payment_failed', 'subscription_renewal', 'system');
CREATE TYPE use_case AS ENUM ('photos', 'video', 'templates', 'all');

-- Tables (include all CREATE TABLE statements from above)
-- ... (run all table definitions)

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
-- ... (create all indexes)

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (add all RLS policies)
```

---

## Notes

1. **Timestamps**: All tables use `timestamptz` for timezone-aware timestamps
2. **Soft Delete**: Consider adding `deleted_at` column if soft delete needed
3. **UUIDs**: Use `gen_random_uuid()` for new primary keys
4. **JSONB**: Use for flexible settings/data that may evolve
5. **Foreign Keys**: Add `ON DELETE CASCADE` where appropriate for cleanup
6. **Indexes**: Create based on query patterns (shown above are recommendations)

# HomeQR - Complete Application Overview & Architecture

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Complete User Flows](#complete-user-flows)
6. [API Endpoints](#api-endpoints)
7. [Stripe Integration](#stripe-integration)
8. [Chrome Extension Integration](#chrome-extension-integration)
9. [Analytics System](#analytics-system)
10. [Access Control & Subscription System](#access-control--subscription-system)
11. [File Structure](#file-structure)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)

---

## Application Overview

**HomeQR** is a SaaS platform that enables real estate agents to generate QR codes for property listings. When buyers scan these QR codes, they're directed to a branded microsite where they can view property details and submit their contact information as leads.

### Core Value Proposition
- **For Realtors**: Generate QR codes, capture leads, track analytics, and manage listings
- **For Buyers**: Scan QR codes to view property details and contact agents

### Key Features
- QR code generation for property listings
- Branded microsites for each listing
- Lead capture forms
- Analytics dashboard (scans, views, leads, conversion rates)
- Chrome extension for one-click QR generation from Zillow/Realtor.com
- Stripe subscription management with 14-day free trials
- Trial usage limits (5 QR codes, 5 listings, 50 photos)
- CSV export of leads
- PDF sticker generation

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React hooks (useState, useEffect)
- **Authentication**: Supabase Auth

### Backend
- **Runtime**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for user uploads)
- **Payment Processing**: Stripe
- **Analytics**: Vercel Analytics

### Browser Extension
- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript
- **Integration**: REST API calls to Next.js backend

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **Environment**: Node.js 18+

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   User Browser  │
│  (Next.js App)  │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│  Next.js API    │  │   Supabase   │
│     Routes      │  │   Database   │
└────────┬────────┘  └──────────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│     Stripe      │  │   Supabase   │
│   (Payments)    │  │   Storage    │
└─────────────────┘  └──────────────┘

┌─────────────────┐
│ Chrome Extension│
│  (Background)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Next.js API    │
│     Routes      │
└─────────────────┘
```

### Request Flow

1. **User Request** → Next.js App Router
2. **Server Component** → Fetches data from Supabase
3. **Client Component** → Handles interactivity
4. **API Route** → Processes business logic, updates database
5. **Response** → Returns JSON or redirects

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Supabase creates session cookie
3. Server components use `createClient()` from `@/lib/supabase/server` to get user
4. API routes verify user via `supabase.auth.getUser()`
5. Extension uses Bearer token from `/api/extension/token`

---

## Database Schema

### Core Tables

#### `users` (extends Supabase auth.users)
```sql
- id (uuid, PK, references auth.users)
- full_name (text)
- email (text)
- phone (text)
- brokerage (text)
- avatar_url (text)
- license_number (text)
- calendly_url (text)
- role (text, default: 'agent')
- onboarding_completed (boolean)
- is_beta_user (boolean)
- created_at, updated_at (timestamps)
```

#### `listings`
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- address (text, required)
- city, state, zip (text)
- price (numeric)
- description (text)
- image_url (text, can be JSON array)
- mls_id (text)
- bedrooms, bathrooms, square_feet (numeric)
- slug (text, unique, indexed)
- status (text, default: 'active')
- url (text, original listing URL)
- property_type, property_subtype (text)
- year_built, lot_size (text)
- features, interior_features, exterior_features (text)
- parking_spaces, garage_spaces, stories (integer)
- heating, cooling, flooring (text)
- fireplace_count, hoa_fee (numeric)
- tax_assessed_value, annual_tax_amount (numeric)
- price_per_sqft, zestimate (numeric)
- days_on_market (integer)
- listing_date (date)
- created_at, updated_at (timestamps)
```

#### `qrcodes`
```sql
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- qr_url (text, base64 data URL)
- scan_count (integer, default: 0)
- redirect_url (text)
- created_at, updated_at (timestamps)
```

#### `leads`
```sql
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- name (text, required)
- email (text)
- phone (text)
- message (text)
- source (text, default: 'qr_scan')
- scan_timestamp (timestamp)
- status (text, default: 'new')
- created_at (timestamp)
```

#### `analytics` (daily aggregation)
```sql
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- date (date, required)
- total_scans (integer, default: 0)
- total_leads (integer, default: 0)
- page_views (integer, default: 0)
- unique_visitors (integer, default: 0)
- UNIQUE(listing_id, date)
```

#### `subscriptions` (Stripe integration)
```sql
- id (uuid, PK)
- user_id (uuid, FK → users)
- stripe_customer_id (text)
- stripe_subscription_id (text)
- status (text, default: 'inactive')
  - Values: 'active', 'trialing', 'past_due', 'inactive', 'canceled'
- plan (text, default: 'free')
  - Values: 'starter', 'pro'
- current_period_start (timestamp)
- current_period_end (timestamp)
- trial_started_at (timestamp)
- cancel_at_period_end (boolean, default: false)
- created_at, updated_at (timestamps)
```

#### `scan_sessions` (tracking)
```sql
- id (uuid, PK)
- listing_id (uuid, FK → listings)
- session_id (text, from cookie)
- device_type (text: 'mobile', 'tablet', 'desktop')
- time_of_day (integer, 0-23)
- referrer (text)
- source (text: 'qr', 'direct', 'microsite')
- scan_count (integer, default: 1)
- first_scan_at (timestamp)
- last_scan_at (timestamp)
- UNIQUE(listing_id, session_id)
```

### Row-Level Security (RLS)

All tables have RLS enabled:
- **Users**: Can read/update own profile
- **Listings**: Agents can manage own listings; public can view active listings
- **QR Codes**: Agents can manage own QR codes; public can read
- **Leads**: Agents can manage own leads; public can insert
- **Analytics**: Agents can view own analytics; public can insert/update
- **Subscriptions**: Agents can view own subscriptions

---

## Complete User Flows

### Flow 1: New User Signup & Onboarding

```
1. User visits homepage (/)
   └─> Sees hero section, features, testimonials
   └─> Clicks "Get Started" button

2. User lands on /auth/signup
   └─> Fills form: email, password, full name, brokerage
   └─> Submits form
   └─> Supabase creates auth user
   └─> Creates record in public.users table
   └─> Redirects to /dashboard

3. User lands on /dashboard (first time)
   └─> DashboardClient component checks:
       - Is beta user? → Skip all modals
       - Has subscription? → Check status
       - Onboarding completed? → Check flag
   
   └─> If no subscription AND onboarding not completed:
       └─> Shows TrialOnboardingModal (2-step):
           Step 1: Upload headshot + Enter name
           Step 2: Choose plan (3 options):
             - Monthly Starter ($29/mo)
             - Monthly Pro ($49/mo) - Default
             - Annual Pro ($490/yr) - "Save 25%"
   
   └─> User completes onboarding
       └─> Clicks "Start Free Trial"
       └─> Redirects to Stripe Checkout
       └─> Enters payment info (card not charged during trial)
       └─> Stripe creates subscription with 14-day trial
       └─> Webhook receives checkout.session.completed
       └─> Updates subscriptions table (status: 'trialing')
       └─> Redirects to /dashboard?trial=activated

4. User sees Welcome Screen
   └─> Shows "Welcome!" message
   └─> CTAs: "Install Chrome Extension" and "Generate My First QR Code"
   └─> User dismisses → Marks onboarding_completed = true
   └─> Shows full dashboard
```

### Flow 2: Active Trial User Journey

```
1. User logs in → /dashboard
   └─> DashboardClient checks subscription status
   └─> Status: 'trialing'
   └─> Shows TrialBanner with days remaining
   └─> Shows UsageNudge if approaching limits (80%+)
   └─> Shows full dashboard access

2. User creates listing
   └─> Navigates to /dashboard/listings/new
   └─> OR uses Chrome Extension on Zillow/Realtor.com
   └─> API: POST /api/listings
       └─> checkUserAccess() → Returns { hasAccess: true, reason: 'trial' }
       └─> checkTrialLimit('listings') → Returns { allowed: true, current: 2, limit: 5 }
       └─> Creates listing
       └─> Auto-generates QR code
       └─> Returns listing data

3. User generates QR code
   └─> API: POST /api/qr
       └─> checkUserAccess() → Returns { hasAccess: true, reason: 'trial' }
       └─> checkTrialLimit('qr_codes') → Returns { allowed: true, current: 3, limit: 5 }
       └─> Generates QR code image (base64)
       └─> Creates/updates qrcodes record
       └─> Returns QR code data

4. User uploads photos
   └─> API: POST /api/upload
       └─> checkUserAccess() → Returns { hasAccess: true, reason: 'trial' }
       └─> checkTrialLimit('photos') → Returns { allowed: true, current: 25, limit: 50 }
       └─> Uploads to Supabase Storage
       └─> Updates listing.image_url

5. User hits trial limit
   └─> Tries to create 6th listing
   └─> API: POST /api/listings
       └─> checkTrialLimit('listings') → Returns { allowed: false, current: 5, limit: 5 }
       └─> Returns 403: "Trial limit reached. You've created 5/5 listings. Upgrade to create unlimited listings."
   └─> UsageNudge shows warning banner
   └─> User clicks "Upgrade Now" → Redirects to /dashboard/billing
```

### Flow 3: Trial Expiration & Conversion

```
1. Trial period ends (14 days)
   └─> Stripe webhook: customer.subscription.updated
       └─> Status changes from 'trialing' to 'active' (if payment succeeds)
       └─> OR Status changes to 'past_due' (if payment fails)
   
2. Payment succeeds
   └─> Webhook updates subscription status to 'active'
   └─> User continues with full access
   └─> TrialBanner disappears
   └─> UsageNudge disappears
   └─> All limits removed

3. Payment fails (trial expires)
   └─> Webhook updates subscription status to 'past_due'
   └─> User visits /dashboard
   └─> DashboardClient detects expired trial
   └─> Shows ExpiredTrialOverlay
       └─> Blurs dashboard content
       └─> Shows "Your Trial Has Ended" message
       └─> Shows "Upgrade to Continue" CTA
   └─> User clicks "Upgrade to Continue"
       └─> Opens TrialOnboardingModal
       └─> User selects plan → Stripe Checkout
       └─> Payment succeeds → Status: 'active'
       └─> Overlay disappears → Full access restored
```

### Flow 4: QR Code Scan & Lead Capture (Buyer Journey)

```
1. Buyer scans QR code
   └─> QR code contains: /api/scan/qr/[listing_id]
   └─> API: GET /api/scan/qr/[id]
       └─> Creates/updates scan_sessions record
       └─> Updates analytics (total_scans++)
       └─> Updates qrcodes.scan_count (backwards compatibility)
       └─> Sets session cookie (homeqr_session)
       └─> Redirects to: /[slug] or /listing/[id]

2. Buyer lands on listing microsite
   └─> Route: /[slug] (dynamic route)
   └─> Fetches listing by slug
   └─> Displays property details:
       - Address, price, description
       - Images (proxied through /api/image-proxy)
       - Property details (bedrooms, bathrooms, etc.)
       - Lead capture form
   
3. Buyer submits lead form
   └─> Form fields: name, email, phone, message
   └─> API: POST /api/leads
       └─> Creates lead record
       └─> Updates analytics (total_leads++)
       └─> Sends notification (non-blocking)
       └─> Returns success message

4. Realtor receives lead
   └─> Lead appears in /dashboard/leads
   └─> Can update status: new → contacted → qualified → converted
   └─> Can export to CSV
```

### Flow 5: Chrome Extension Workflow

```
1. Realtor installs extension
   └─> Loads extension from extension/ folder
   └─> Extension requests permissions for Zillow, Realtor.com, Sonder Group

2. Realtor visits Zillow listing page
   └─> Extension content script (content.js) runs
   └─> Detects listing page
   └─> Extracts property data:
       - Address, price, images
       - Property details (from Apollo cache or DOM)

3. Realtor clicks extension icon
   └─> Popup opens (popup.html)
   └─> Shows extracted property data
   └─> Shows "Generate QR Code" button

4. Realtor clicks "Generate QR Code"
   └─> Extension background script (background.js) handles:
       └─> Gets auth token from storage (or fetches from /api/extension/token)
       └─> Sends listing data to API: POST /api/listings
           └─> Includes all property details
           └─> Includes image_urls (JSON array)
       └─> API creates listing + auto-generates QR code
       └─> Returns QR code data
   └─> Extension displays QR code in popup
   └─> Realtor can download QR code image

5. Token management
   └─> Extension stores auth token in chrome.storage.sync
   └─> Token fetched from /api/extension/token (uses Supabase session)
   └─> Token included in Authorization header: Bearer [token]
   └─> API routes verify token via supabase.auth.getUser(token)
```

### Flow 6: Analytics & Reporting

```
1. User views dashboard
   └─> /dashboard page fetches:
       - Total scans (from analytics table)
       - Total leads (from analytics table)
       - Conversion rate (leads / scans)
       - This week's scans/leads
       - Top performing properties

2. User views listing analytics
   └─> /dashboard/listings/[id]
       └─> Fetches analytics data:
           - Daily scans, leads, page views
           - Time of day chart
           - Device type breakdown
           - Conversion funnel
       └─> Displays charts (using Recharts)

3. Data aggregation
   └─> Analytics table stores daily aggregates
   └─> scan_sessions table stores individual sessions
   └─> Conversion rate = (total_leads / total_scans) * 100
   └─> Analytics retention: 7 days for trial users
```

---

## API Endpoints

### Authentication
- `GET /api/extension/token` - Get auth token for extension
- `POST /auth/callback` - Supabase auth callback

### Listings
- `GET /api/listings` - Get user's listings (paginated)
- `POST /api/listings` - Create listing (requires access, checks trial limit)
- `PUT /api/listings` - Update listing (requires access)
- `DELETE /api/listings` - Delete listing (soft delete, requires access)

### QR Codes
- `POST /api/qr` - Generate QR code (requires access, checks trial limit)
- `GET /api/qr/[id]/pdf` - Generate PDF sticker

### Leads
- `POST /api/leads` - Create lead (public, no auth required)
- `PATCH /api/leads` - Update lead status (requires access)

### Analytics
- `GET /api/analytics` - Get analytics data
- `POST /api/analytics/track` - Track page view/scan

### Scanning & Tracking
- `GET /api/scan/qr/[id]` - Track QR scan and redirect
- `GET /api/scan/[id]` - Legacy scan endpoint

### Stripe
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/stripe/portal` - Create customer portal session

### Subscription
- `GET /api/subscription/usage` - Get trial usage stats
- `GET /api/payment/status` - Get payment/subscription status

### Upload
- `POST /api/upload` - Upload file (avatar/logo/photos, requires access, checks trial limit)

### Onboarding
- `POST /api/onboarding/complete` - Mark onboarding as completed

### Utilities
- `GET /api/image-proxy` - Proxy Zillow images (CORS bypass)

---

## Stripe Integration

### Subscription Plans

**Monthly Plans:**
- Starter: $29/mo
- Pro: $49/mo

**Annual Plans:**
- Starter: $290/yr (~$24.17/mo)
- Pro: $490/yr (~$40.83/mo, 25% savings)

### Checkout Flow

1. User selects plan in `TrialOnboardingModal`
2. Frontend calls `POST /api/stripe/checkout`
3. API creates Stripe Checkout Session:
   - `mode: 'subscription'`
   - `trial_period_days: 14`
   - `metadata: { userId, plan, billing }`
4. User redirected to Stripe Checkout
5. User enters payment info (card not charged during trial)
6. Stripe redirects to `success_url: /dashboard?trial=activated`
7. Webhook receives `checkout.session.completed`
8. API updates `subscriptions` table:
   - `status: 'trialing'`
   - `trial_started_at: [timestamp]`
   - `stripe_customer_id`, `stripe_subscription_id`

### Webhook Events Handled

1. **checkout.session.completed**
   - Creates/updates subscription record
   - Sets status to 'trialing' or 'active'

2. **customer.subscription.updated**
   - Updates subscription status
   - Handles trial → active transition
   - Handles payment failures (past_due)

3. **customer.subscription.deleted**
   - Sets status to 'inactive'

4. **customer.subscription.trial_will_end**
   - Calculates days remaining
   - Sends trial ending email (template ready, needs email service)

### Customer Portal

- `POST /api/stripe/portal` - Creates portal session
- Users can manage subscription, update payment method, view invoices
- Accessible from `/dashboard/billing`

---

## Chrome Extension Integration

### Extension Structure

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (handles API calls)
├── content.js            # Content script (extracts listing data)
├── dashboard-content.js  # Content script (runs on HomeQR pages)
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
└── icons/                # Extension icons
```

### Supported Sites

- Zillow (`*.zillow.com`)
- Realtor.com (`*.realtor.com`)
- Sonder Group (`*.sondergrouputah.com`)

### Data Extraction

**Zillow:**
- Extracts from Apollo GraphQL cache
- Falls back to DOM parsing
- Supports multiple Zillow page types

**Realtor.com:**
- DOM-based extraction
- Parses property details from page structure

### Authentication

1. Extension loads on HomeQR dashboard page
2. `dashboard-content.js` runs
3. Calls `/api/extension/token` (uses session cookie)
4. Receives `access_token` from Supabase
5. Stores token in `chrome.storage.sync`
6. Token included in API requests: `Authorization: Bearer [token]`
7. API routes verify token via `supabase.auth.getUser(token)`

### QR Generation Flow

1. User clicks extension icon on listing page
2. Extension extracts property data
3. User clicks "Generate QR Code"
4. Background script sends `POST /api/listings` with:
   - All property details
   - Image URLs (JSON array)
   - Original listing URL
5. API creates listing + auto-generates QR code
6. Extension displays QR code
7. User can download QR code image

---

## Analytics System

### Data Collection

**QR Scans:**
- Tracked via `/api/scan/qr/[id]`
- Creates/updates `scan_sessions` record
- Updates `analytics.total_scans`
- Updates `qrcodes.scan_count` (backwards compatibility)

**Page Views:**
- Tracked via `/api/analytics/track`
- Updates `analytics.page_views`
- Tracks unique visitors via session cookies

**Leads:**
- Tracked when lead form submitted
- Updates `analytics.total_leads`
- Links to `scan_timestamp` from session

### Analytics Aggregation

- **Daily aggregation** in `analytics` table
- **Unique visitors** calculated from `scan_sessions`
- **Conversion rate** = (total_leads / total_scans) * 100
- **Retention**: 7 days for trial users, unlimited for paid

### Analytics Dashboard

**Main Dashboard (`/dashboard`):**
- Conversion rate (all-time)
- QR scans (past 7 days)
- New leads (past 7 days)
- Active properties count
- Recent activity feed
- Top performing properties

**Listing Analytics (`/dashboard/listings/[id]`):**
- Daily scans, leads, page views
- Time of day chart
- Device type breakdown
- Conversion funnel
- Lead table with status management

---

## Access Control & Subscription System

### Access Control Logic

**File**: `src/lib/subscription/access.ts`

```typescript
checkUserAccess(userId) → {
  hasAccess: boolean,
  reason: 'beta' | 'active' | 'trial' | 'no-sub' | 'expired' | 'past_due',
  subscription?: Subscription
}
```

**Priority Order:**
1. Beta users (`is_beta_user = true`) → Always have access
2. Active subscription (`status = 'active'`) → Full access
3. Trialing subscription (`status = 'trialing'`) → Trial access with limits
4. Past due (`status = 'past_due'`) → No access
5. Expired (period ended) → No access
6. No subscription → No access

### Trial Limits

**File**: `src/lib/subscription/limits.ts`

**Limits:**
- QR codes: 5
- Listings: 5
- Photos: 50
- Analytics retention: 7 days

**Functions:**
- `checkTrialLimit(userId, feature)` → Returns `{ allowed, current, limit, remaining }`
- `getTrialUsage(userId, feature)` → Returns current usage count
- `getUsageStats(userId)` → Returns full usage breakdown

### API Route Gating

All feature endpoints check access before processing:

```typescript
// Example: POST /api/listings
const access = await checkUserAccess(user.id);
if (!access.hasAccess) {
  return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
}

if (access.reason === 'trial') {
  const limitCheck = await checkTrialLimit(user.id, 'listings');
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: 'Trial limit reached' }, { status: 403 });
  }
}
```

### UI Components

**TrialBanner** (`src/components/dashboard/TrialBanner.tsx`):
- Shows trial countdown for trialing users
- Shows "Start Free Trial" CTA for users without subscription
- Hidden for beta users and active subscribers

**UsageNudge** (`src/components/dashboard/UsageNudge.tsx`):
- Shows when approaching trial limits (80%+)
- Displays progress bar
- Shows upgrade CTA

**ExpiredTrialOverlay** (`src/components/dashboard/ExpiredTrialOverlay.tsx`):
- Blurs dashboard content
- Shows "Trial Expired" message
- Provides upgrade CTA

**TrialOnboardingModal** (`src/components/onboarding/TrialOnboardingModal.tsx`):
- 2-step modal:
  - Step 1: Upload headshot + Enter name
  - Step 2: Choose plan (3 options)
- Redirects to Stripe Checkout

---

## File Structure

```
homeqr/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API routes
│   │   │   ├── listings/
│   │   │   ├── qr/
│   │   │   ├── leads/
│   │   │   ├── stripe/
│   │   │   ├── subscription/
│   │   │   └── ...
│   │   ├── auth/                     # Auth pages
│   │   ├── dashboard/                # Dashboard pages
│   │   ├── listing/                  # Public listing pages
│   │   └── [slug]/                   # Dynamic slug routes
│   ├── components/
│   │   ├── auth/                     # Auth components
│   │   ├── dashboard/                # Dashboard components
│   │   ├── listings/                 # Listing components
│   │   ├── onboarding/               # Onboarding modals
│   │   ├── qr/                       # QR code components
│   │   ├── leads/                    # Lead management
│   │   ├── charts/                   # Analytics charts
│   │   └── ui/                       # UI components
│   ├── lib/
│   │   ├── supabase/                 # Supabase clients
│   │   ├── stripe/                   # Stripe integration
│   │   ├── subscription/              # Access control & limits
│   │   ├── email/                    # Email templates
│   │   └── utils/                    # Utility functions
│   ├── types/                        # TypeScript types
│   └── hooks/                        # React hooks
├── extension/                        # Chrome extension
├── supabase/
│   ├── migrations/                   # Database migrations
│   └── schema.sql                    # Database schema
├── public/                           # Static assets
└── package.json
```

---

## Environment Variables

### Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Stripe
STRIPE_SECRET_KEY=[secret-key]
STRIPE_PUBLISHABLE_KEY=[publishable-key]
STRIPE_WEBHOOK_SECRET=[webhook-secret]

# Stripe Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=[price-id]
STRIPE_STARTER_ANNUAL_PRICE_ID=[price-id]
STRIPE_PRO_MONTHLY_PRICE_ID=[price-id]
STRIPE_PRO_ANNUAL_PRICE_ID=[price-id]

# Application
NEXT_PUBLIC_SITE_URL=https://homeqr.app
```

### Optional

```env
# Email Service (for trial ending emails)
RESEND_API_KEY=[api-key]
# OR
SENDGRID_API_KEY=[api-key]
```

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase Setup

1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run migrations in order
4. Configure RLS policies
5. Create storage bucket: `user-uploads` (public)
6. Set up storage policies

### Stripe Setup

1. Create Stripe account
2. Create products and prices:
   - Starter Monthly ($29/mo)
   - Starter Annual ($290/yr)
   - Pro Monthly ($49/mo)
   - Pro Annual ($490/yr)
3. Configure webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `customer.subscription.trial_will_end`
4. Copy webhook signing secret
5. Add price IDs to environment variables

### Chrome Extension Distribution

1. Build extension: `npm run build:extension` (if script exists)
2. Zip `extension/` folder
3. Submit to Chrome Web Store
4. Or distribute manually for internal use

---

## Current Implementation Status

### ✅ Implemented

- Complete user authentication (Supabase Auth)
- Listing management (CRUD)
- QR code generation
- Lead capture system
- Analytics tracking
- Stripe subscription integration
- 14-day free trials
- Trial usage limits (5 QR, 5 listings, 50 photos)
- Access control system
- Chrome extension integration
- Dashboard with analytics
- CSV export
- PDF sticker generation
- Trial ending email template (ready for email service)
- Usage nudges
- Expired trial overlay
- Plan selection (3 options)

### 🔄 In Progress / TODO

- Email service integration (Resend/SendGrid) for trial ending emails
- Additional analytics features
- Mobile app (future)

---

## Key Design Decisions

1. **Trial-first approach**: Users can sign up and start trial immediately, payment required after 14 days
2. **Server-side gating**: All access checks happen server-side for security
3. **Beta user bypass**: `is_beta_user` flag allows unlimited access for testing
4. **Derived has_paid**: `has_paid` is derived from subscription status, not stored
5. **Daily analytics aggregation**: Reduces query load, enables fast dashboard loading
6. **Session-based tracking**: Uses cookies to track unique visitors
7. **Slug-based URLs**: SEO-friendly listing URLs (`/[slug]`)
8. **Image proxying**: Bypasses CORS for Zillow images

---

## Support & Maintenance

### Monitoring

- Access denial logs in API routes
- Stripe webhook event logs
- Analytics data in Supabase
- Vercel Analytics for page views

### Common Issues

1. **Stripe not configured**: Returns 503 with helpful message
2. **Trial limits reached**: Returns 403 with upgrade CTA
3. **Expired trial**: Shows overlay with reactivation option
4. **Extension auth**: Token automatically refreshed from dashboard

---

This document provides a complete overview of the HomeQR application. Use it as a reference for understanding the system architecture, user flows, and implementation details.


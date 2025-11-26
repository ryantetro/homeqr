# HomeQR - Complete Feature Guide & How It Works

## 📋 Table of Contents
1. [What Is HomeQR?](#what-is-homeqr)
2. [How It Works - The Big Picture](#how-it-works---the-big-picture)
3. [Complete Feature List](#complete-feature-list)
4. [Step-by-Step User Flows](#step-by-step-user-flows)
5. [Technical Architecture](#technical-architecture)
6. [Subscription & Pricing](#subscription--pricing)
7. [Chrome Extension](#chrome-extension)
8. [AI Features](#ai-features)
9. [Analytics & Reporting](#analytics--reporting)
10. [Lead Management](#lead-management)

---

## What Is HomeQR?

**HomeQR** is a SaaS (Software as a Service) platform designed specifically for real estate agents. It solves a critical problem: **capturing buyer leads from marketing materials that MLS links can't track**.

### The Problem It Solves

When real estate agents put up yard signs, flyers, or post on social media, they typically include a link to the property listing on Zillow or Realtor.com. However, these MLS links:
- **Don't capture buyer information** - You have no idea who viewed the property
- **Can't track marketing channels** - You don't know if the lead came from a yard sign, flyer, or TikTok post
- **Don't provide analytics** - No data on how many people viewed the listing
- **Miss unrepresented buyers** - Buyers who aren't working with an agent slip away

### The Solution

HomeQR generates **unique QR codes** for each property listing. When buyers scan the QR code:
1. They're taken to a **branded microsite** (not Zillow)
2. They can view all property details
3. They can **submit their contact information** (name, email, phone)
4. The agent **captures the lead** and can track exactly where it came from

---

## How It Works - The Big Picture

### For Real Estate Agents (The Users)

1. **Sign Up** → Create account, choose subscription plan, start 14-day free trial
2. **Create Listing** → Either manually enter property details OR use Chrome Extension to auto-extract from Zillow/Realtor.com
3. **Generate QR Code** → System automatically creates a unique QR code for the listing
4. **Print & Distribute** → Download QR code, print on yard signs, flyers, social media posts
5. **Capture Leads** → When buyers scan QR code, they submit contact info
6. **Track Performance** → View analytics dashboard showing scans, leads, conversion rates
7. **Manage Leads** → Export leads to CSV, update lead status, follow up

### For Buyers (The End Users)

1. **See QR Code** → On yard sign, flyer, or social media post
2. **Scan QR Code** → Using phone camera
3. **View Property** → See full property details, photos, agent info
4. **Submit Info** → Fill out form to request more information
5. **Get Contacted** → Agent receives lead and contacts them

### Behind the Scenes (Technical Flow)

```
Buyer Scans QR Code
    ↓
QR Code contains URL: /api/scan/qr/[listing_id]
    ↓
System tracks the scan (analytics)
    ↓
Redirects buyer to: /[property-slug] (branded microsite)
    ↓
Buyer views property details
    ↓
Buyer fills out lead form
    ↓
System saves lead to database
    ↓
Agent receives notification (optional)
    ↓
Lead appears in agent's dashboard
```

---

## Complete Feature List

### 🔐 Authentication & Account Management

#### User Registration & Login
- **Email/Password Signup** - Standard email and password registration
- **Email/Password Login** - Secure login with Supabase Auth
- **Password Reset** - Forgot password flow with email reset link
- **Session Management** - Automatic session handling with cookies
- **Profile Management** - Update name, phone, brokerage, license number

#### Onboarding System
- **2-Step Onboarding Modal** - Guides new users through setup
  - **Step 1**: Upload profile photo (headshot) + Enter full name
  - **Step 2**: Choose subscription plan (Starter or Pro, Monthly or Annual)
- **Welcome Screen** - Shown after trial activation with CTAs
- **Onboarding Completion Tracking** - Prevents showing modals repeatedly

#### Account Settings
- **Profile Settings Page** (`/dashboard/settings`)
  - Upload/change profile photo (headshot)
  - Upload/change brokerage logo
  - Update full name
  - Update phone number
  - Update brokerage name
  - Update license number
  - Add Calendly URL (for "Schedule a Showing" button)
- **Billing Section in Settings** - Quick access to subscription status and billing management
  - Shows current plan (Starter/Pro)
  - Shows subscription status (Active/Trial/Past Due)
  - Shows trial end date or renewal date
  - "Manage Billing" button linking to billing page

---

### 📋 Listing Management

#### Create Listings
- **Manual Listing Creation** (`/dashboard/listings/new`)
  - Enter property address
  - Add property details (bedrooms, bathrooms, square feet, etc.)
  - Upload photos
  - Add description
  - Set price
- **Chrome Extension Auto-Extraction** (see Chrome Extension section)
  - One-click extraction from Zillow
  - One-click extraction from Realtor.com
  - Automatically extracts all property data
  - Automatically extracts all photos
  - No manual data entry required

#### Listing Details Stored
- **Basic Info**: Address, city, state, zip, price
- **Property Specs**: Bedrooms, bathrooms, square feet, lot size, year built
- **Property Type**: Type and subtype (e.g., Single Family, Condo)
- **Features**: General features, interior features, exterior features (stored as JSON arrays)
- **Structure Details**: Parking spaces, garage spaces, stories, heating, cooling, flooring, fireplace count
- **Financial Info**: HOA fee, tax assessed value, annual tax amount, price per sqft, Zestimate
- **Market Data**: Days on market, listing date, MLS ID
- **Images**: Primary image URL or JSON array of all image URLs
- **Original Listing URL**: Link back to Zillow/Realtor.com listing
- **Slug**: SEO-friendly URL slug (e.g., `123-main-st-salt-lake-city-ut-84101`)

#### View & Edit Listings
- **Listings Dashboard** (`/dashboard/listings`)
  - View all properties in a grid/list
  - See QR scan count for each listing
  - See conversion rate for each listing
  - Filter by status (active, inactive, deleted)
  - Search listings
  - "Add Property" button
- **Listing Detail Page** (`/dashboard/listings/[id]`)
  - View full listing details
  - View QR code
  - View analytics (scans, leads, conversion rate)
  - View all leads from this listing
  - Edit listing details
  - Delete listing (soft delete)
  - Download QR code
  - Share listing microsite URL

#### Listing Status Management
- **Active** - Live and visible on public microsite
- **Inactive** - Hidden from public but kept in system
- **Deleted** - Soft deleted, can be restored

#### AI-Enhanced Listings (NEW)
- **Automatic AI Enhancement** - When a listing is created, AI automatically:
  - Rewrites property description (SEO-optimized, engaging)
  - Extracts 5-7 key features
  - Generates neighborhood/lifestyle summary
  - Creates social media caption (for agents to use)
  - Generates open house talking points
  - Identifies ideal buyer persona
- **Manual Re-enhancement** - Agents can click "Re-enhance with AI" button to regenerate content
- **AI Content Display** - AI-enhanced content shown on:
  - Public microsite (without "AI-Enhanced" labels for professional look)
  - Dashboard listing detail page (with "AI-Enhanced" labels for agents)

---

### 📱 QR Code Generation & Management

#### QR Code Creation
- **Automatic Generation** - QR code automatically created when listing is created
- **Manual Generation** - Can regenerate QR code from listing detail page
- **Unique QR Codes** - Each listing gets its own unique QR code
- **QR Code Format** - High-quality PNG image (base64 data URL)
- **QR Code URL Structure** - Points to `/api/scan/qr/[listing_id]` which tracks scan and redirects

#### QR Code Display
- **QR Code Preview** - View QR code in dashboard
- **Download QR Code** - Download as PNG image
- **QR Code Customization** (Future) - Customize colors, add logo
- **PDF Sticker Generation** - Generate printable PDF with QR code for yard signs

#### QR Code Tracking
- **Scan Count** - Tracks total number of scans per QR code
- **Scan Timestamp** - Records when each scan occurred
- **Session Tracking** - Tracks unique visitors via session cookies
- **Source Tracking** - Identifies if scan came from QR code, direct link, or other source

---

### 🌐 Public Microsites (Buyer-Facing Pages)

#### Microsite Features
- **SEO-Friendly URLs** - Each listing has a unique slug URL (e.g., `/123-main-st-salt-lake-city-ut-84101`)
- **Alternative ID-Based URLs** - Also accessible via `/listing/[id]` for direct access
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop
- **Fast Loading** - Optimized images and lazy loading

#### Property Display
- **Hero Section** - Large property image with address overlay
- **Key Stats** - Bedrooms, bathrooms, square feet prominently displayed
- **Image Gallery** - Multiple property photos with:
  - Swipe gestures on mobile
  - Full-screen lightbox view
  - Zoom functionality (double-tap or pinch)
  - Image counter
  - Keyboard navigation (arrows, Escape)
- **Property Description** - AI-enhanced description (if available) or original description
- **Property Highlights** - AI-extracted key features displayed as bullet points
- **Neighborhood & Lifestyle** - AI-generated lifestyle summary
- **Property Information** - Year built, lot size, property type, stories
- **Structure Details** - Parking, garage, heating, cooling, flooring, fireplaces
- **Features** - General, interior, and exterior features displayed as tags
- **Financial Information** - HOA fee, tax info, price per sqft, Zestimate
- **Google Maps Integration** - Embedded map showing property location
- **Original Listing Link** - Button to view on Zillow/Realtor.com

#### Agent Information Display
- **Agent Card** - Shows agent's:
  - Profile photo
  - Full name
  - Brokerage name and logo
  - Phone number (clickable to call)
  - Email (clickable to email)
  - License number
  - "Schedule a Showing" button (if Calendly URL is set)

#### Lead Capture Form
- **Form Fields**:
  - Name (required)
  - Email (required)
  - Phone (required)
  - Message (optional)
- **Form Features**:
  - Mobile-optimized input fields
  - Real-time validation
  - Success message after submission
  - Pre-filled agent name (if available)
- **Form Placement**:
  - Sticky on mobile (bottom of screen)
  - Sidebar on desktop
  - Top of content area for better visibility

#### Mobile Optimizations
- **Sticky Header** - Header stays at top when scrolling
- **Seamless Header** - No rounded corners or shadows on microsites
- **Compact Price Display** - Price shown in bottom-right of hero image on mobile
- **Touch-Friendly** - Large tap targets, swipe gestures
- **Mobile CTA Bar** - Sticky bar at bottom with "Request Info" and "Call Agent" buttons

---

### 📊 Analytics & Reporting

#### Dashboard Analytics (`/dashboard`)
- **Conversion Rate** - Overall conversion rate (leads / scans) across all properties
- **QR Scans** - Total scans in past 7 days
- **New Leads** - Total new leads in past 7 days
- **Active Properties** - Count of active listings
- **Recent Activity Feed** - Live feed of recent scans and leads
- **Top Performing Properties** - Properties ranked by traffic (scans + page views)

#### Listing-Specific Analytics (`/dashboard/listings/[id]`)
- **Overview Metrics**:
  - Total scans (all-time)
  - Total leads (all-time)
  - Total page views (all-time)
  - Conversion rate (leads / scans)
  - Unique visitors
- **Daily Analytics Chart** - Line chart showing scans, leads, and page views over time
- **Time of Day Chart** - Bar chart showing when scans occur (hour of day)
- **Device Type Breakdown** - Pie chart showing mobile vs. tablet vs. desktop
- **Conversion Funnel** - Visual funnel showing: Scans → Page Views → Leads
- **Lead Source Chart** - Breakdown of where leads came from (QR scan, direct, etc.)

#### Analytics Data Collection
- **QR Scan Tracking** - Every QR scan is tracked with timestamp
- **Page View Tracking** - Every microsite visit is tracked
- **Session Tracking** - Unique visitors tracked via session cookies
- **Lead Tracking** - Every lead form submission is tracked
- **Daily Aggregation** - Data aggregated daily for fast dashboard loading
- **Analytics Retention**:
  - Trial users: 7 days of analytics data
  - Paid users: Unlimited analytics retention

#### Analytics Export
- **CSV Export** - Export leads data to CSV file
- **Lead Table** - View all leads with filtering and sorting

---

### 👥 Lead Management

#### Lead Capture
- **Automatic Lead Creation** - When buyer submits form on microsite
- **Lead Data Stored**:
  - Name
  - Email
  - Phone
  - Message (optional)
  - Source (QR scan, direct, etc.)
  - Scan timestamp (when QR was scanned)
  - Listing ID (which property they're interested in)
  - Status (new, contacted, qualified, converted)

#### Lead Management Dashboard (`/dashboard/leads`)
- **Lead Table** - View all leads across all properties
- **Lead Details**:
  - Lead name, email, phone
  - Associated property
  - Submission date
  - Source (how they found the property)
  - Status
- **Lead Status Management**:
  - **New** - Just received, not contacted yet
  - **Contacted** - Agent has reached out
  - **Qualified** - Lead is interested and qualified
  - **Converted** - Lead became a client
- **Lead Filtering** - Filter by status, property, date range
- **Lead Search** - Search by name, email, phone
- **CSV Export** - Export all leads to CSV file for CRM import

#### Lead Notifications (Optional)
- **Email Notifications** - Agent can receive email when new lead comes in
- **Real-Time Updates** - Dashboard updates in real-time when new leads arrive

---

### 💳 Subscription & Billing

#### Subscription Plans

**Starter Plan:**
- Monthly: $29/month
- Annual: $290/year (~$24.17/month, save 17%)

**Pro Plan:**
- Monthly: $49/month
- Annual: $490/year (~$40.83/month, save 17%)

#### Free Trial
- **14-Day Free Trial** - All new users get 14-day free trial
- **No Credit Card Required** - Trial starts immediately after signup
- **Trial Limits**:
  - 5 QR codes
  - 5 listings
  - 50 photos
  - 7 days of analytics retention
- **Trial Features** - Full access to all features during trial
- **Trial Conversion** - After 14 days, payment method is charged automatically

#### Subscription Management
- **Billing Page** (`/dashboard/billing`)
  - View current subscription status
  - View current plan (Starter/Pro)
  - View billing period (monthly/annual)
  - View next billing date
  - "Manage Billing" button → Opens Stripe Customer Portal
- **Stripe Customer Portal** - Allows users to:
  - Update payment method
  - View invoices
  - Download receipts
  - Change subscription plan
  - Cancel subscription
  - Update billing information

#### Subscription Statuses
- **Trialing** - Free trial is active (14 days)
- **Active** - Paid subscription is active
- **Past Due** - Payment failed, subscription needs attention
- **Canceled** - Subscription was canceled
- **Inactive** - No active subscription

#### Access Control
- **Beta Users** - Special flag (`is_beta_user`) gives unlimited access without subscription
- **Trial Users** - Full access with usage limits
- **Paid Users** - Unlimited access to all features
- **Expired Users** - No access until subscription is reactivated

---

### 🧩 Chrome Extension

#### Installation
- **Manual Installation** - Load unpacked extension from `extension/` folder
- **Chrome Web Store** - (Future) One-click install from Chrome Web Store
- **Auto-Detection** - Extension automatically detects when user is on HomeQR dashboard and requests authentication token

#### Supported Websites
- **Zillow** (`*.zillow.com`) - Full support for all Zillow listing pages
- **Realtor.com** (`*.realtor.com`) - Full support for Realtor.com listing pages
- **Sonder Group** (`*.sondergrouputah.com`) - Custom MLS site support

#### Data Extraction
- **Automatic Extraction** - Extension automatically extracts:
  - Property address
  - Price
  - Bedrooms, bathrooms, square feet
  - Property description
  - All property photos (as array)
  - Property type and subtype
  - Year built, lot size
  - Features (general, interior, exterior)
  - Parking, garage, stories
  - Heating, cooling, flooring
  - HOA fee, tax info
  - Original listing URL
  - MLS ID
- **Zillow Extraction** - Uses Apollo GraphQL cache for fast, accurate extraction
- **Realtor.com Extraction** - DOM-based parsing for reliable extraction

#### Extension Features
- **One-Click QR Generation** - Click extension icon → Click "Generate QR Code" → Done
- **Property Preview** - See extracted property data before generating
- **Usage Stats Display** - Shows current trial usage (QR codes, listings, photos)
- **QR Code Display** - View generated QR code in extension popup
- **Download QR Code** - Download QR code image directly from extension
- **Error Handling** - Graceful fallback if extraction fails

#### Authentication
- **Token-Based Auth** - Extension uses Bearer token for API authentication
- **Auto-Token Refresh** - Token automatically fetched when user visits HomeQR dashboard
- **Secure Storage** - Token stored in Chrome's secure storage

---

### 🤖 AI Features (Google Gemini Integration)

#### Automatic AI Enhancement
- **Trigger** - Automatically runs when listing is created
- **Non-Blocking** - Runs in background, doesn't slow down listing creation
- **Error Handling** - If AI fails, listing still created successfully

#### AI-Generated Content
- **AI-Enhanced Description** - SEO-optimized, engaging property description (200-300 words)
- **Key Features** - 5-7 bullet points highlighting most important features
- **Lifestyle Summary** - 2-3 sentences about neighborhood and lifestyle
- **Social Media Caption** - Ready-to-use Instagram/Facebook caption with emojis and hashtags
- **Open House Talking Points** - 3-5 bullet points for agent to use during open houses
- **Buyer Persona** - 1-2 sentence description of ideal buyer

#### AI Content Display
- **Public Microsite** - AI content shown without "AI-Enhanced" labels (professional look)
- **Dashboard** - AI content shown with "AI-Enhanced" labels (for agents)
- **Social Caption Hidden** - Social media caption only shown to agents, not on public microsite

#### Manual Re-enhancement
- **Re-enhance Button** - Agents can click "Re-enhance with AI" to regenerate content
- **Status Tracking** - Tracks AI enhancement status (pending, completed, failed)
- **Timestamp** - Records when AI enhancement was last run

---

### 📤 File Uploads & Storage

#### Supported Uploads
- **Profile Photos** - Agent headshots (automatically compressed)
- **Brokerage Logos** - Company logos (automatically compressed)
- **Listing Photos** - Property photos (automatically compressed)

#### Upload Features
- **Client-Side Compression** - Images automatically compressed before upload
  - Max dimensions: 1920x1920px (or 1600x1600px if still too large)
  - JPEG quality: 85% (or 75% if still too large)
  - Prevents "file too large" errors
- **File Size Limits** - 5MB max (after compression)
- **Image Format Support** - JPEG, PNG, WebP, GIF
- **Native Photo Picker** - On mobile, opens native photo picker
- **Progress Indication** - Shows upload progress
- **Error Handling** - Clear error messages if upload fails

#### Storage
- **Supabase Storage** - All files stored in Supabase Storage bucket
- **Public URLs** - Files accessible via public URLs
- **Access Control** - Only authenticated users can upload

---

### 🔔 Notifications & Alerts

#### Usage Warnings
- **Usage Nudge** - Shows banner when approaching trial limits (80%+)
  - Shows current usage vs. limit
  - Progress bar visualization
  - "Upgrade Now" CTA
- **Trial Limit Reached** - Clear error message when limit is hit
  - Shows which limit was reached
  - Provides upgrade path

#### Trial Status
- **Trial Expired Overlay** - Full-screen overlay when trial expires
  - Blurs dashboard content
  - Shows "Trial Expired" message
  - Provides reactivation option
- **Welcome Screen** - Shown after trial activation
  - Congratulatory message
  - CTAs: "Install Chrome Extension" and "Generate My First QR Code"

---

### 🎨 User Interface & Design

#### Design System
- **Tailwind CSS** - Utility-first CSS framework
- **Custom Component Library** - Reusable UI components
- **Responsive Design** - Mobile-first approach
- **Modern UI** - Clean, professional design

#### Key UI Components
- **Cards** - Consistent card design throughout
- **Buttons** - Primary, secondary, outline variants
- **Modals** - For onboarding, confirmations, etc.
- **Forms** - Consistent form styling with validation
- **Tables** - For leads, listings, analytics
- **Charts** - Using Recharts library for analytics visualization

#### Navigation
- **Sidebar Navigation** - Persistent sidebar with:
  - Dashboard
  - Properties
  - Leads
  - Analytics
  - Settings
  - Sign Out
- **Breadcrumbs** - (Future) For deeper navigation
- **Mobile Menu** - (Future) Hamburger menu for mobile

---

## Step-by-Step User Flows

### Flow 1: New User Signup & First QR Code

1. **User visits homepage** (`/`)
   - Sees marketing content, features, testimonials
   - Clicks "Get Started" button

2. **User signs up** (`/auth/signup`)
   - Enters email, password, full name, brokerage
   - Submits form
   - Account created in Supabase
   - Redirected to `/dashboard`

3. **Onboarding modal appears**
   - **Step 1**: Upload profile photo + Enter name
   - **Step 2**: Choose subscription plan
     - Options: Starter Monthly ($29/mo), Pro Monthly ($49/mo), Pro Annual ($490/yr)
     - User selects plan
     - Clicks "Start Free Trial"

4. **Stripe Checkout**
   - Redirected to Stripe Checkout page
   - Enters payment information (card not charged during trial)
   - Completes checkout

5. **Trial activated**
   - Webhook receives `checkout.session.completed` event
   - Subscription created in database (status: 'trialing')
   - Redirected to `/dashboard?trial=activated`

6. **Welcome screen appears**
   - Shows "Your Free Trial is Active!" message
   - CTAs: "Install Chrome Extension" and "Generate My First QR Code"
   - User dismisses → Onboarding marked as complete

7. **User creates first listing**
   - Option A: Uses Chrome Extension on Zillow
     - Visits Zillow listing page
     - Clicks extension icon
     - Clicks "Generate QR Code"
     - Listing created automatically
   - Option B: Manual entry
     - Goes to `/dashboard/listings/new`
     - Fills out property details
     - Uploads photos
     - Clicks "Create Listing"

8. **QR code generated**
   - QR code automatically created
   - User can view QR code on listing detail page
   - User downloads QR code image

9. **User prints QR code**
   - Downloads QR code
   - Prints on yard sign, flyer, or posts on social media

### Flow 2: Buyer Scans QR Code & Submits Lead

1. **Buyer sees QR code**
   - On yard sign, flyer, or social media post

2. **Buyer scans QR code**
   - Uses phone camera to scan
   - QR code contains URL: `/api/scan/qr/[listing_id]`

3. **System tracks scan**
   - API endpoint receives scan request
   - Creates/updates `scan_sessions` record
   - Updates `analytics.total_scans`
   - Sets session cookie
   - Redirects to microsite: `/[property-slug]`

4. **Buyer views microsite**
   - Sees property details, photos, agent info
   - Scrolls through property information
   - Page view tracked in analytics

5. **Buyer submits lead form**
   - Fills out: Name, Email, Phone, Message (optional)
   - Clicks "Request Information" or "Submit"

6. **Lead created**
   - API receives lead submission
   - Creates `leads` record
   - Updates `analytics.total_leads`
   - Returns success message

7. **Agent receives lead**
   - Lead appears in `/dashboard/leads`
   - Agent can see lead details
   - Agent can update lead status
   - Agent can export to CSV

### Flow 3: Agent Views Analytics & Manages Leads

1. **Agent logs in** → `/dashboard`

2. **Views dashboard metrics**
   - Sees conversion rate, scans, leads, active properties
   - Sees recent activity feed
   - Sees top performing properties

3. **Views listing analytics**
   - Clicks on a property
   - Goes to `/dashboard/listings/[id]`
   - Sees detailed analytics:
     - Daily scans/leads/page views chart
     - Time of day chart
     - Device type breakdown
     - Conversion funnel
   - Sees all leads from this property

4. **Manages leads**
   - Goes to `/dashboard/leads`
   - Views all leads across all properties
   - Filters by status, property, date
   - Updates lead status (new → contacted → qualified → converted)
   - Exports leads to CSV

### Flow 4: Trial Expires & User Upgrades

1. **Trial period ends** (14 days)
   - Stripe webhook: `customer.subscription.updated`
   - Status changes from 'trialing' to 'active' (if payment succeeds)
   - OR Status changes to 'past_due' (if payment fails)

2. **Payment succeeds**
   - Subscription status: 'active'
   - User continues with full access
   - All trial limits removed
   - Unlimited QR codes, listings, photos

3. **Payment fails**
   - Subscription status: 'past_due'
   - User visits `/dashboard`
   - Expired trial overlay appears
   - Dashboard content blurred
   - "Trial Expired" message shown
   - "Upgrade to Continue" button

4. **User reactivates**
   - Clicks "Upgrade to Continue"
   - Onboarding modal appears
   - User selects plan
   - Redirected to Stripe Checkout
   - Payment succeeds
   - Subscription reactivated
   - Full access restored

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (useState, useEffect)
- **Charts**: Recharts library
- **QR Code Generation**: qrcode library

### Backend
- **Runtime**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payment Processing**: Stripe
- **AI**: Google Gemini API (Gemini 2.0 Flash)

### Database Tables
- `users` - User profiles and settings
- `listings` - Property listings
- `qrcodes` - QR code records
- `leads` - Captured buyer leads
- `analytics` - Daily aggregated analytics data
- `subscriptions` - Stripe subscription tracking
- `scan_sessions` - Individual scan/visit tracking

### Security
- **Row-Level Security (RLS)** - Database-level access control
- **Server-Side Validation** - All access checks happen server-side
- **Bearer Token Auth** - For Chrome extension API calls
- **Session Cookie Auth** - For web application
- **CORS Protection** - API routes protected from unauthorized access

---

## Subscription & Pricing

### Plans Comparison

| Feature | Starter | Pro |
|---------|---------|-----|
| **Monthly Price** | $29/mo | $49/mo |
| **Annual Price** | $290/yr | $490/yr |
| **QR Codes** | Unlimited | Unlimited |
| **Listings** | Unlimited | Unlimited |
| **Photos** | Unlimited | Unlimited |
| **Analytics Retention** | Unlimited | Unlimited |
| **Lead Management** | ✅ | ✅ |
| **CSV Export** | ✅ | ✅ |
| **Chrome Extension** | ✅ | ✅ |
| **AI Enhancements** | ✅ | ✅ |
| **Public Microsites** | ✅ | ✅ |

*Note: Currently both plans have the same features. Pricing difference allows for future feature differentiation.*

### Trial Limits (14-Day Free Trial)

- **5 QR codes** - Can generate up to 5 QR codes
- **5 listings** - Can create up to 5 property listings
- **50 photos** - Can upload up to 50 photos total
- **7 days analytics** - Analytics data retained for 7 days

### Billing Management

- **Stripe Customer Portal** - Full self-service billing management
- **Update Payment Method** - Change credit card anytime
- **View Invoices** - Download receipts and invoices
- **Change Plan** - Upgrade or downgrade between Starter and Pro
- **Cancel Subscription** - Cancel anytime (access continues until period ends)
- **Billing History** - View all past invoices and payments

---

## Chrome Extension

### Installation Methods

1. **Manual Installation** (Development)
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/` folder

2. **Chrome Web Store** (Future)
   - One-click install from Chrome Web Store
   - Automatic updates
   - Verified by Google

### How It Works

1. **Extension detects listing page**
   - Content script runs on Zillow/Realtor.com pages
   - Identifies listing page structure
   - Extracts property data from page

2. **User clicks extension icon**
   - Popup opens showing extracted data
   - Shows "Generate QR Code" button
   - Shows usage stats (if on trial)

3. **User clicks "Generate QR Code"**
   - Extension sends data to `/api/listings`
   - API creates listing + generates QR code
   - Extension displays QR code in popup

4. **User downloads QR code**
   - Clicks download button
   - QR code image saved to device

### Authentication Flow

1. User visits HomeQR dashboard
2. Extension content script runs on dashboard page
3. Calls `/api/extension/token` (uses session cookie)
4. Receives Supabase access token
5. Stores token in `chrome.storage.sync`
6. Token included in all API requests: `Authorization: Bearer [token]`

---

## AI Features

### Google Gemini Integration

- **Model**: Gemini 2.0 Flash
- **API**: Google Generative AI API
- **Automatic Processing**: Runs in background when listing is created
- **Error Handling**: If AI fails, listing still created successfully

### AI-Generated Content Types

1. **AI-Enhanced Description**
   - SEO-optimized property description
   - 200-300 words
   - Highlights unique selling points
   - Engaging and professional tone

2. **Key Features**
   - 5-7 bullet points
   - Most important features extracted
   - Formatted as JSON array

3. **Lifestyle Summary**
   - 2-3 sentences
   - Describes neighborhood and lifestyle
   - Appeals to buyer emotions

4. **Social Media Caption**
   - Ready-to-use Instagram/Facebook caption
   - Includes emojis and hashtags
   - 2-3 sentences
   - Only visible to agents (not on public microsite)

5. **Open House Talking Points**
   - 3-5 bullet points
   - For agent to use during open houses
   - Highlights property strengths

6. **Buyer Persona**
   - 1-2 sentence description
   - Identifies ideal buyer type
   - Helps with marketing targeting

### AI Content Display

- **Public Microsite**: AI content shown without "AI-Enhanced" labels (professional look)
- **Dashboard**: AI content shown with "AI-Enhanced" labels (for agents)
- **Fallback**: If AI content not available, original description shown

---

## Analytics & Reporting

### Metrics Tracked

1. **QR Scans** - Every time someone scans a QR code
2. **Page Views** - Every time someone visits a microsite
3. **Unique Visitors** - Tracked via session cookies
4. **Leads** - Every lead form submission
5. **Conversion Rate** - Leads / Scans * 100
6. **Time of Day** - When scans occur (hour of day)
7. **Device Type** - Mobile, tablet, or desktop
8. **Lead Source** - QR scan, direct link, etc.

### Analytics Dashboard Features

- **Real-Time Updates** - Data updates in real-time
- **Daily Aggregation** - Fast dashboard loading
- **Historical Data** - View trends over time
- **Property Comparison** - Compare performance across properties
- **Export Capabilities** - Export leads to CSV

### Analytics Retention

- **Trial Users**: 7 days of analytics data
- **Paid Users**: Unlimited analytics retention

---

## Lead Management

### Lead Lifecycle

1. **New** - Lead just submitted, not contacted yet
2. **Contacted** - Agent has reached out to lead
3. **Qualified** - Lead is interested and qualified
4. **Converted** - Lead became a client

### Lead Management Features

- **Lead Table** - View all leads in one place
- **Lead Filtering** - Filter by status, property, date range
- **Lead Search** - Search by name, email, phone
- **Lead Details** - View full lead information
- **Status Updates** - Update lead status as you work with them
- **CSV Export** - Export leads to CSV for CRM import
- **Lead Source Tracking** - Know where each lead came from

---

## Summary

HomeQR is a complete lead generation and management platform for real estate agents. It combines:

- **QR Code Generation** - Create unique QR codes for each property
- **Branded Microsites** - Professional property showcase pages
- **Lead Capture** - Automatic lead collection from QR scans
- **Analytics** - Track performance and conversion rates
- **Chrome Extension** - One-click QR generation from Zillow/Realtor.com
- **AI Enhancement** - Automatic property description optimization
- **Subscription Management** - Stripe-powered billing with 14-day free trials
- **Lead Management** - Complete CRM for managing buyer leads

The platform is designed to help real estate agents capture leads from marketing materials (yard signs, flyers, social media) that traditional MLS links can't track, providing valuable data and a pipeline of unrepresented buyers.


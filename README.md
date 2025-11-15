# HomeQR — Smart QR Codes for Real Estate

A professional Next.js application that helps real estate agents generate QR codes for property listings, capture buyer leads, and track engagement analytics.

## 🚀 Features

- ⚡ **Next.js 16** - Latest version with App Router
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 📘 **TypeScript** - Full type safety
- 🗄️ **Supabase** - PostgreSQL database with authentication
- 🔐 **Authentication** - Email/password auth with Supabase
- 📱 **QR Code Generation** - Generate QR codes for listings
- 📊 **Analytics Dashboard** - Track scans and leads
- 💳 **Stripe Integration** - Subscription management (ready for setup)
- 🧩 **Chrome Extension** - Generate QR codes from listing pages
- 📈 **Lead Management** - Capture and export buyer leads
- 🌙 **Dark Mode** - Built-in dark mode support

## 📁 Project Structure

```
homeqr/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── qr/           # QR code generation
│   │   │   ├── scan/         # Scan tracking
│   │   │   ├── leads/        # Lead capture
│   │   │   ├── listings/     # Listings CRUD
│   │   │   └── stripe/       # Stripe integration
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── listing/          # Public listing pages
│   │   └── page.tsx          # Marketing homepage
│   ├── components/
│   │   ├── auth/            # Auth components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── qr/              # QR code components
│   │   ├── leads/           # Lead components
│   │   ├── charts/          # Chart components
│   │   └── ui/              # UI components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   ├── stripe/          # Stripe clients
│   │   └── utils/           # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
├── extension/               # Chrome extension
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   └── content.js
├── supabase/
│   └── schema.sql          # Database schema
└── .env.local.example      # Environment variables template
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `NEXT_PUBLIC_SITE_URL` - Your site URL
  - **Development**: `http://localhost:3000` (or your local IP like `http://192.168.1.44:3000`)
  - **Production**: Your actual domain (e.g., `https://homeqr.app`)
  - **Important**: This is used as a fallback when generating QR codes. The app will automatically use the request host when available to ensure cookies work correctly across different domains.
- `NEXT_PUBLIC_CHROME_WEB_STORE_URL` - (Optional) Chrome Web Store URL for the extension
  - **Production**: Your Chrome Web Store listing URL (e.g., `https://chrome.google.com/webstore/detail/homeqr/...`)
  - **Development**: Leave unset to show manual installation instructions
  - When set, users will see a one-click install button from the Chrome Web Store
- `GEMINI_API_KEY` - Google Gemini API key for AI enhancements
  - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Used to automatically enhance listings with AI-generated descriptions, features, and social media captions

3. **Set up Supabase database:**

Run the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor.

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Chrome Extension Setup

1. **Load the extension:**

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension/` folder

2. **Configure the extension:**

- The extension will detect listing pages on Zillow, Realtor.com, and Sonder Group sites
- Click the extension icon to generate QR codes

## 🔧 API Endpoints

- `POST /api/qr` - Generate QR code for a listing
- `GET /api/scan/[id]` - Track QR code scan and redirect
- `POST /api/leads` - Capture lead form submission
- `GET /api/listings` - Fetch user's listings
- `POST /api/listings` - Create new listing
- `PUT /api/listings` - Update listing
- `DELETE /api/listings` - Delete listing
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

## 📝 Database Schema

The database includes tables for:
- `users` - User profiles
- `listings` - Property listings
- `qrcodes` - QR code records
- `leads` - Captured buyer leads
- `analytics` - Daily aggregated data
- `subscriptions` - Stripe subscription tracking

See `supabase/schema.sql` for the complete schema with RLS policies.

## 🎯 Key Features

### For Realtors

- Create listings with property details
- Generate QR codes for each listing
- Track QR code scans and engagement
- Capture buyer leads from QR scans
- View analytics and performance metrics
- Export leads to CSV
- Manage profile and subscription

### For Buyers

- Scan QR codes to view property details
- Submit contact information
- Request property information

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform.

**Critical for Production:**
- `NEXT_PUBLIC_SITE_URL` must be set to your actual production domain (e.g., `https://homeqr.app`)
- Do NOT use IP addresses in production - use your actual domain name
- This ensures QR codes point to the correct domain and cookies work properly

## 📄 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please contact the development team.

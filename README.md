# HomeQR — Smart QR Codes for Real Estate

A professional Next.js application that helps real estate agents generate QR codes for property listings, capture buyer leads, and track engagement analytics.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase and Stripe credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Load the Chrome extension:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension/` folder

## Documentation

All documentation is organized in the [`docs/`](./docs/) folder:

- **[Setup Guides](./docs/setup/)** - Initial setup and configuration
- **[Stripe Integration](./docs/stripe/)** - Payment and subscription setup
- **[Chrome Web Store](./docs/chrome-web-store/)** - Extension publishing guides
- **[Features](./docs/features/)** - Complete feature documentation
- **[Troubleshooting](./docs/troubleshooting/)** - Common issues and solutions
- **[Extension Docs](./docs/extension/)** - Extension-specific documentation

## Key Features

- ⚡ **Next.js 16** - Latest version with App Router
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework
- 📘 **TypeScript** - Full type safety
- 🗄️ **Supabase** - PostgreSQL database with authentication
- 🔐 **Authentication** - Email/password auth with Supabase
- 📱 **QR Code Generation** - Generate QR codes for listings
- 📊 **Analytics Dashboard** - Track scans and leads
- 💳 **Stripe Integration** - Subscription management
- 🧩 **Chrome Extension** - Generate QR codes from listing pages
- 📈 **Lead Management** - Capture and export buyer leads

## Project Structure

```
homeqr/
├── src/              # Next.js application
├── extension/        # Chrome extension
├── docs/             # All documentation
├── supabase/         # Database schema and migrations
├── scripts/          # Utility scripts
├── sql/              # SQL scripts and utilities
└── tests/            # Test scripts
```

## Support

For detailed documentation, see the [`docs/`](./docs/) folder.

For issues or questions, please contact the development team.


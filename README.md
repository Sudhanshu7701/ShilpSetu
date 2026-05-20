<div align="center">

# 🧵 LoomLive

### India's Live Handcraft Marketplace Platform

*Watch it made. Buy it real.*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

· [Report a Bug](https://github.com/Sudhanshu7701/Loom-Live/issues) · [Request a Feature](https://github.com/Sudhanshu7701/Loom-Live/issues)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Supabase Setup](#supabase-setup)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [User Roles](#-user-roles)
- [Database Schema](#-database-schema)
- [API Overview](#-api-overview)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎨 About the Project

**LoomLive** is a full-stack web marketplace that connects buyers directly with verified Indian artisans across 18 states — through live craft demonstrations, authentic handmade product listings, and cultural storytelling.

> Traditional craft fairs are seasonal and local. Generic e-commerce platforms bury artisans under mass-manufactured products. LoomLive solves both problems at once.

**What makes it different:**

- 🎥 **Live Weaving Sessions** — Artisans stream their craft in real time. Buyers watch a product being made before they buy it, making authenticity undeniable.
- ✅ **Verified Artisan Profiles** — Every artisan is manually verified with a badge, regional identity, and a personal story page.
- 🛍️ **Direct Commerce** — No middlemen. Artisans set their own prices, manage their own inventory, and keep a larger share of every sale.
- 🏺 **18 States, One Platform** — Handloom sarees from Varanasi, Madhubani paintings from Bihar, Blue Pottery from Jaipur, Pashmina shawls from Kashmir — all in one marketplace.

---

## ✨ Features

| Module | Features |
|---|---|
| **Authentication** | Email/password sign-up, JWT sessions, email verification, password reset, role-based access |
| **Product Catalogue** | Full-text search, multi-filter (state, category, price, material, rating), infinite scroll, sort |
| **Live Sessions** | Artisan broadcast scheduling, viewer participation, live chat, session recording & replay |
| **Shopping** | Persistent cart (cross-device), wishlist, coupon codes, checkout flow |
| **Orders** | Order placement, status tracking (7-stage pipeline), returns & refund requests |
| **Artisan Portal** | Product CRUD, inventory management, order notifications, earnings dashboard with charts |
| **Admin Dashboard** | User management, artisan verification, product moderation, analytics, coupon management |
| **Notifications** | Real-time in-app alerts (Supabase Realtime), transactional emails (Edge Functions) |
| **Reviews** | Verified-purchase star ratings, written reviews, photo uploads, aggregate breakdown |
| **Content** | Craft stories & editorial articles, craft terminology glossary |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5 (strict) | Type-safe JavaScript |
| [Vite](https://vitejs.dev) | 5 | Build tool & dev server |
| [React Router DOM](https://reactrouter.com) | 6 | Client-side routing |
| [TanStack Query](https://tanstack.com/query/v5) | 5 | Server state, caching, data fetching |
| [shadcn/ui](https://ui.shadcn.com) | Latest | Accessible UI component library (Radix UI) |
| [Tailwind CSS](https://tailwindcss.com) | 3 | Utility-first styling |
| [Framer Motion](https://www.framer.com/motion/) | 12 | Animations & page transitions |
| [Recharts](https://recharts.org) | 2 | Earnings & analytics charts |
| [React Hook Form](https://react-hook-form.com) | 7 | Form state management |
| [Zod](https://zod.dev) | 3 | Schema validation |

### Backend (Supabase BaaS)
| Service | Purpose |
|---|---|
| **PostgreSQL 15** | Primary relational database |
| **Supabase Auth** | Email/password authentication, JWT sessions |
| **Supabase Storage** | Product images & artisan media |
| **Supabase Realtime** | WebSocket subscriptions for live notifications |
| **Supabase Edge Functions** | Deno serverless functions for emails & payment webhooks |
| **Row Level Security (RLS)** | Fine-grained data access control at the DB layer |

---

## 📁 Project Structure

```
Loom-Live/
├── public/                     # Static assets (favicon, OG image)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # Header, Footer, Nav
│   │   ├── product/            # ProductCard, ProductGrid, Filters
│   │   ├── artisan/            # ArtisanCard, ArtisanProfile
│   │   ├── cart/               # CartDrawer, CartItem
│   │   ├── live/               # LiveSessionCard, StreamPlayer
│   │   └── admin/              # Admin-specific components
│   ├── pages/                  # Top-level route components
│   │   ├── Index.tsx           # Home / Landing page
│   │   ├── Shop.tsx            # Product catalogue
│   │   ├── ProductDetail.tsx   # Single product page
│   │   ├── ArtisanProfile.tsx  # Public artisan page
│   │   ├── Live.tsx            # Live sessions browser
│   │   ├── Cart.tsx            # Shopping cart
│   │   ├── Checkout.tsx        # Checkout flow
│   │   ├── Account.tsx         # Buyer dashboard
│   │   ├── ArtisanPortal.tsx   # Artisan management portal
│   │   ├── Admin.tsx           # Admin dashboard
│   │   ├── Stories.tsx         # Craft stories
│   │   └── auth/               # Login & Register pages
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Auth state & helpers
│   │   ├── useCart.ts          # Cart operations
│   │   ├── useProducts.ts      # Product queries
│   │   └── useOrders.ts        # Order queries
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client initialisation
│   │   ├── utils.ts            # General utility functions
│   │   └── schemas.ts          # Zod validation schemas
│   ├── types/                  # TypeScript type definitions
│   │   └── database.ts         # Generated from Supabase schema
│   └── main.tsx                # App entry point
├── supabase/
│   └── migrations/             # PLpgSQL database migration files
├── .env.example                # Environment variable template
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v20 LTS or higher — [Download](https://nodejs.org)
- **Bun** v1.x (recommended) — [Install](https://bun.sh) — or use `npm` if preferred
- **Git** — [Download](https://git-scm.com)
- A **Supabase** account (free tier works) — [Sign up](https://supabase.com)

Verify your setup:
```bash
node --version    # Should be v20+
bun --version     # Should be 1.x
git --version
```

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Sudhanshu7701/Loom-Live.git
cd Loom-Live
```

**2. Install dependencies**
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

---

### Supabase Setup

LoomLive uses Supabase as its entire backend. You need to create a project and apply the database migrations.

**Step 1 — Create a Supabase project**

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project** and fill in the project name, database password, and region
3. Wait for the project to provision (~2 minutes)

**Step 2 — Install the Supabase CLI**
```bash
# Using npm
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

**Step 3 — Link your project**
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```
> Find your Project Ref in **Supabase Dashboard → Settings → General → Reference ID**

**Step 4 — Apply database migrations**
```bash
supabase db push
```
This runs all migration files in `/supabase/migrations/` against your Supabase PostgreSQL database, creating all tables, RLS policies, and seed data.

**Step 5 — Enable Email Auth**

In your Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. Under **Authentication → Email Templates**, customise the confirmation and password reset emails if desired

**Step 6 — Create Storage Bucket**

In your Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket** → name it `product-images`
3. Set it to **Public**
4. Add a policy allowing authenticated users to upload and all users to read

---

### Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
# ─── Supabase ────────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

> **Where to find these:**
> - Supabase Dashboard → **Settings → API**
> - Copy the **Project URL** and the **anon / public** key
> - ⚠️ Never use the `service_role` key on the client — it bypasses all security

---

### Running the App

**Development server** (with hot module reload)
```bash
# Using Bun
bun run dev

# Using npm
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Build for production**
```bash
bun run build
# or
npm run build
```

**Preview the production build locally**
```bash
bun run preview
# or
npm run preview
```

**Run tests**
```bash
bun run test
# or
npm run test
```

**Lint the codebase**
```bash
bun run lint
# or
npm run lint
```

---

## 👥 User Roles

LoomLive has four user roles enforced at both the frontend (route guards) and backend (Supabase RLS) levels:

| Role | Description | How to Access |
|---|---|---|
| **Guest** | Browse products, view artisan profiles, see live session schedules | Visit the site without signing in |
| **Buyer** | Full shopping experience — cart, checkout, orders, reviews, live sessions | Register with role = Buyer |
| **Artisan** | List products, manage inventory, host live sessions, track earnings | Register with role = Artisan; await admin approval |
| **Admin** | Full platform management — users, products, orders, analytics | Set `is_admin = true` in the `profiles` table via Supabase Dashboard |

**To create your first admin account:**
1. Register a normal account through the app
2. Go to **Supabase Dashboard → Table Editor → profiles**
3. Find your user row and set `role = 'admin'`

---

## 🗄 Database Schema

LoomLive's database is fully managed through versioned Supabase migrations. Core tables:

```
profiles          → User accounts (buyers, artisans, admins)
products          → Handcraft product listings
live_sessions     → Artisan broadcast sessions
orders            → Buyer orders
order_items       → Individual line items per order
cart_items        → Persistent shopping cart
reviews           → Product ratings and reviews
coupons           → Promotional discount codes
```

All tables have **Row Level Security (RLS)** enabled. Users can only read and write data within their permitted scope. For example:

- Buyers can only read their own `orders` and `cart_items`
- Artisans can only update `products` they own
- Only admins can approve artisans (`is_verified = true`) or moderate products (`is_approved = true`)

To inspect or modify the schema:
```bash
# View current schema
supabase db diff

# Create a new migration
supabase migration new my_migration_name

# Push schema changes to remote
supabase db push
```

---

## 🔌 API Overview

LoomLive uses Supabase's auto-generated REST API (PostgREST). All requests require a valid JWT in the `Authorization` header; RLS policies automatically enforce data scope.

**Authentication** (Supabase Auth)
```
POST /auth/v1/signup           → Register new user
POST /auth/v1/token            → Login (returns JWT)
POST /auth/v1/logout           → Logout
POST /auth/v1/recover          → Send password reset email
```

**Products**
```
GET    /rest/v1/products                   → List products (supports ?select, ?filter, ?order)
POST   /rest/v1/products                   → Create product listing (artisan only)
PATCH  /rest/v1/products?id=eq.{id}        → Update listing
DELETE /rest/v1/products?id=eq.{id}        → Delete listing
```

**Orders**
```
GET    /rest/v1/orders                     → Fetch user's orders (RLS scoped)
POST   /rest/v1/orders                     → Place new order
PATCH  /rest/v1/orders?id=eq.{id}          → Update order status
```

**Live Sessions**
```
GET    /rest/v1/live_sessions              → List upcoming / active sessions
POST   /rest/v1/live_sessions              → Schedule new session (artisan only)
```

**Edge Functions** (custom serverless logic)
```
POST   /functions/v1/send-order-email     → Trigger order confirmation email
```

---

## 🗺 Roadmap

### v1.0 — Current
- [x] User authentication (email/password, role-based)
- [x] Product catalogue with search and filtering
- [x] Artisan profiles and verification
- [x] Shopping cart and wishlist (cross-device persistent)
- [x] Checkout flow with order management
- [x] Artisan portal (product CRUD, inventory, earnings)
- [x] Admin dashboard (moderation, analytics)
- [x] Real-time in-app notifications
- [x] Reviews and ratings system

### v1.1 — Near Term
- [ ] Full Razorpay payment integration (UPI, Net Banking, Cards)
- [ ] Web Push Notifications for live session alerts
- [ ] Multi-language support (Hindi + regional languages)
- [ ] Artisan Digital KYC (DigiLocker integration)
- [ ] SMS notifications for order updates (MSG91)

### v2.x — Medium Term
- [ ] Native mobile app (React Native — iOS & Android)
- [ ] AI product recommendations (collaborative filtering)
- [ ] Live auction feature during sessions
- [ ] Wholesale / B2B portal for bulk buyers
- [ ] Integrated shipping logistics (Shiprocket / Delhivery)

### v3.x — Long Term
- [ ] AI craft assistant chatbot
- [ ] Artisan micro-finance (working capital loans)
- [ ] Blockchain provenance certificates for premium items
- [ ] Global export portal for international buyers
- [ ] AR try-on for sarees and textiles

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** your changes following the existing code style
4. **Run** tests and linting before committing
   ```bash
   bun run lint
   bun run test
   ```
5. **Commit** with a descriptive message
   ```bash
   git commit -m "feat: add SMS notification for order updates"
   ```
6. **Push** to your branch and open a **Pull Request**

**Commit message convention:**
```
feat:     New feature
fix:      Bug fix
docs:     Documentation change
style:    Formatting (no logic change)
refactor: Code refactor
test:     Adding or updating tests
chore:    Build process or dependency updates
```

Please open an issue first for major changes so we can discuss the approach before you invest time building it.

---

## ⚠️ Common Issues

**Port 5173 already in use**
```bash
# Kill the process using the port
npx kill-port 5173
bun run dev
```

**Supabase connection errors**
- Double-check your `.env` values — the URL and anon key must match your Supabase project exactly
- Ensure your IP is not blocked (Supabase Dashboard → Settings → Database → Network Restrictions)

**Migration errors on `supabase db push`**
```bash
# Reset local database and re-run all migrations
supabase db reset
```

**TypeScript errors after pulling new changes**
```bash
# Regenerate Supabase types
supabase gen types typescript --linked > src/types/database.ts
```

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 📬 Contact

**Sudhanshu** — [@Sudhanshu7701](https://github.com/Sudhanshu7701)

Project Link: [https://github.com/Sudhanshu7701/Loom-Live](https://github.com/Sudhanshu7701/Loom-Live)

---

<div align="center">

Made with ❤️ for India's artisan community

*LoomLive — Preserving craft heritage, one live session at a time.*

</div>

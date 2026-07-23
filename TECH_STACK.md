# Technology Stack & Architecture Report: GGMS Wholesale App

## Executive Summary
**GGMS Wholesale App** (`ggms-wholesale`) is a full-stack, hybrid mobile & web application built using **Next.js 16 (App Router)** with **React 19** and **TypeScript**. It is designed for dual deployment: as a Progressive Web App (PWA) hosted on **Vercel** and as a native **Android APK** compiled via **Capacitor 8**.

The backend relies on **Supabase** for PostgreSQL database management and user authentication, paired with **Firebase Admin SDK** for Cloud Push Notifications (FCM).

---

## 1. Key Technology Stack Breakdown

| Category | Technology / Library | Version / Details |
| :--- | :--- | :--- |
| **Core Framework** | **Next.js** | `16.2.9` (App Router structure) |
| **UI Library / Engine** | **React** | `19.2.4` |
| **Language** | **TypeScript** | `5.x` |
| **Mobile Integration** | **Capacitor** | `8.4.2` (`@capacitor/android`, `@capacitor/core`, `@capacitor/push-notifications`, etc.) |
| **PWA Capability** | **Progressive Web App** | Web App Manifest (`public/manifest.json`), Service Worker (`public/sw.js`), Web Push VAPID |
| **Database & Auth** | **Supabase** | `2.108.2` (`@supabase/supabase-js` - PostgreSQL DB + Auth) |
| **Notification Engine** | **Firebase Admin SDK** + **Web Push** | `firebase-admin` (`14.2.0`) & `web-push` (`3.6.7`) |
| **Package Manager** | **npm** | Standard `package-lock.json` |
| **Styling & CSS** | **Tailwind CSS v4** | `@tailwindcss/postcss` (`4.x`) |
| **Icons** | **Lucide React** | `lucide-react` (`1.21.0`) |
| **Routing System** | **Next.js App Router** | File-based routing inside `src/app/` |
| **State Management** | **React Context API** | `cart-context.tsx`, `shop-auth.tsx`, `admin-auth.tsx` |
| **Document / PDF Gen** | **jsPDF** & **html2canvas** | `jspdf` (`4.2.1`), `html2canvas` (`1.4.1`) for invoice/receipt generation |
| **Image & QR Utilities** | **Sharp** & **qrcode.react** | `sharp` (`0.35.2`), `qrcode.react` (`4.2.0`) |

---

## 2. Project Overview & Components

### Framework & Target Platform
- **Framework:** Next.js 16 App Router on React 19 + TypeScript.
- **Deployment:** Web/PWA hosted on Vercel (`https://ggms-wholesale-app.vercel.app`) + Android Native APK via Capacitor v8 (`com.ggms.wholesale`).

### Backend Services
1. **Supabase (`@supabase/supabase-js`):** Database queries (PostgreSQL), products, orders, ledgers, and authentication (`src/lib/supabase.ts`).
2. **Firebase Admin SDK (`firebase-admin`):** FCM Push Notifications dispatch engine via API routes (`src/app/api/`).

### Project Architecture & Folder Structure

```
ggms-wholesale-app/
├── android/                   # Capacitor Native Android Project (Gradle / Java)
├── public/                    # Static assets, manifests, icons, SW script, GGMS-Wholesale.apk
├── src/
│   ├── app/                   # Next.js App Router (Pages, API Routes, Layouts)
│   │   ├── (store)/           # Shopkeeper storefront routes
│   │   ├── admin/             # Store management & admin dashboard routes
│   │   ├── api/               # Serverless API routes (Push notifications, FCM)
│   │   ├── ledger/            # Customer financial statement / billing records
│   │   ├── orders/            # Order placement & tracking
│   │   ├── login/ & signup/   # Auth routes
│   │   ├── globals.css        # Tailwind CSS imports & global styles
│   │   └── layout.tsx         # App wrapper, providers, PWA meta tags
│   ├── components/            # UI components (AdminSidebar, BottomNav, Header, Modals)
│   └── lib/                   # Supabase client, Auth context, Cart context, PDF generator
│       ├── supabase.ts
│       ├── cart-context.tsx
│       ├── shop-auth.tsx
│       ├── admin-auth.tsx
│       └── receipt.ts
├── capacitor.config.ts        # Capacitor App & Server settings
├── next.config.ts             # Next.js server configuration
├── TECH_STACK.md              # Project Technology Stack Documentation
└── package.json               # Dependencies & scripts
```

---

## 3. Recommended Prompt Context for AI Coding Assistants

When asking AI tools (ChatGPT, Claude, Gemini, Antigravity) to work on this repository:

```markdown
Project Stack Context:
- Framework: Next.js 16 (App Router) + React 19 + TypeScript
- Styling: Tailwind CSS v4 + Lucide React Icons
- Mobile Target: Capacitor 8 (Android Native hybrid) + PWA
- Backend / DB: Supabase (@supabase/supabase-js) for Postgres DB & Auth
- Notification: Firebase Admin SDK (firebase-admin) for FCM
- State Management: React Context API (cart-context, shop-auth, admin-auth)
- Routing: Next.js App Router (src/app)

Rules for AI:
1. Always follow Next.js App Router conventions (use 'use client' where React hooks/state are required).
2. Ensure changes are compatible with both Web/PWA and Capacitor Android WebView.
3. If changing native Capacitor features/configs, note if a new Android APK build is required.
```

# Delivero — Last-Mile Delivery Tracker

A delivery management platform where customers and admins create orders with auto-calculated charges, delivery agents are assigned automatically based on proximity, and customers are notified at every step of the delivery journey — from pickup to doorstep.

🔗 **Live app:** https://lastmiledelivery-b0bdd.web.app/
🛠️ **Admin dashboard:** https://lastmiledelivery-b0bdd.web.app/admin/dashboard
📦 **Repository:** https://github.com/deepak-158/Last_mile_delivery

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Rate Calculation Engine](#rate-calculation-engine)
- [Zone Detection](#zone-detection)
- [Auto-Assignment Logic](#auto-assignment-logic)
- [Order Status Lifecycle & Immutable History](#order-status-lifecycle--immutable-history)
- [Failed Delivery & Reschedule](#failed-delivery--reschedule)
- [Notifications](#notifications)
- [Firestore Data Model](#firestore-data-model)
- [Setup Guide](#setup-guide)
- [Service Layer Reference](#service-layer-reference)
- [Project Structure](#project-structure)
- [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Backend / Database | Firebase (Firestore, Authentication, Cloud Messaging) — Spark (free) tier |
| Hosting | Firebase Hosting |
| Maps / Routing | Leaflet, OSRM (Open Source Routing Machine) with Haversine fallback |
| Pincode → Zone lookup | Custom pincode lookup utility (`src/utils/pincodeLookup.ts`) |

This project runs as a **serverless SPA**: instead of a separate Node/Express API, all business logic (rate calculation, zone detection, auto-assignment, notifications) lives in typed service modules under `frontend/src/services/` and talks directly to Firestore via the Firebase Web SDK. This keeps the whole stack on Firebase's free tier with no server to host or scale.

---

## Architecture

```
┌────────────────────────┐         ┌──────────────────────────────┐
│   React + TypeScript    │         │           Firebase             │
│         (Vite SPA)      │         │                                 │
│                          │         │  ┌───────────────────────────┐ │
│  Customer / Agent /      │  Auth   │  │  Authentication            │ │
│  Admin role-based        │◄───────►│  │  (Email/Password, Google)  │ │
│  routes & layouts        │         │  └───────────────────────────┘ │
│                          │         │  ┌───────────────────────────┐ │
│  services/ ─────────────┼────────►│  │  Firestore                  │ │
│   orderService            │  reads/ │  │  orders · agents · zones    │ │
│   rateCardService          │  writes │  │  rate_cards · users · etc.  │ │
│   zoneService              │        │  └───────────────────────────┘ │
│   agentService              │        │  ┌───────────────────────────┐ │
│   notificationService        │      │  │  Cloud Messaging (FCM)      │ │
│                          │         │  │  push notifications         │ │
│  utils/calculations.ts   │         │  └───────────────────────────┘ │
│   (rate, zone, ETA math) │         └──────────────────────────────┘
└────────────────────────┘                        ▲
             │                                     │
             ▼                                     │
     OSRM Routing API  ──────── road distance ─────┘
     (public, free) with Haversine fallback
```

There is intentionally no custom backend server: Firestore's security rules act as the authorization boundary, and the service layer under `frontend/src/services/` plays the role a REST API would normally play — each service exports typed functions (`preview`, `create`, `updateStatus`, …) that the pages call directly. This is what makes 100%-free-tier hosting possible while still keeping business logic centralized and out of the UI components.

---

## Features

- **Role-based auth** — Customer, Delivery Agent, and Admin roles via Firebase Authentication (email/password and Google Sign-In, with an admin email whitelist).
- **Order creation with live price preview** — customer or admin enters pickup/drop pincode, package dimensions, weight, order type (B2B/B2C), and payment type (Prepaid/COD); the app shows the full fare breakdown before the order is confirmed.
- **Zone & rate card management (Admin)** — create zones, map areas/pincodes to zones, and configure intra-zone / inter-zone rate cards separately for B2B and B2C, plus COD surcharge per order type. Nothing is hardcoded — all rates are read from Firestore at calculation time.
- **Automatic nearest-agent assignment** — on order creation the system scans available, verified agents and assigns the nearest one using the Haversine distance formula; admins can also assign or reassign manually.
- **Full order status lifecycle** — Pending → Accepted → Picked Up → In Transit → Out for Delivery → Delivered / Failed, with every transition written to an immutable `statusHistory` subcollection (timestamp + actor).
- **Failed delivery & reschedule flow** — a failed attempt notifies the customer, lets them pick a new delivery date, and the order is re-queued for agent (re)assignment.
- **Notifications** — in-app/push notifications (Firebase Cloud Messaging) fired on order placement, agent dispatch, and every status change; notification records are also persisted to Firestore.
- **Live tracking timeline** — customers can view real-time order status and the complete history of an order.
- **Admin console** — view/filter all orders by status, zone, or agent, and override any order's status.
- **Wallet** — prepaid orders deduct from an in-app customer wallet at booking time.

---

## Rate Calculation Engine

Implemented in `frontend/src/utils/calculations.ts` and `frontend/src/services/orderService.ts` (`orderService.preview`).

1. **Zone detection** — the pickup and drop pincodes are resolved to a zone each via `pincodeLookup`. If both pincodes fall in the same zone, the order is `INTRA_ZONE`; otherwise `INTER_ZONE`.
2. **Volumetric weight** — `(Length × Breadth × Height in cm) ÷ 5000`.
3. **Billable weight** — the higher of actual weight and volumetric weight.
4. **Rate card lookup** — the matching rate card is fetched from Firestore by `(orderType, rateType)` — i.e. B2B/B2C × Intra/Inter — giving a `baseCharge` and `perKgCharge`. If no admin-configured card exists yet, sensible defaults are used so the app still functions on a fresh database.
5. **Distance charge** — road distance is fetched from OSRM (falls back to a Haversine estimate with a road-winding factor if OSRM is unreachable). Intra-zone orders are charged for distance beyond 5 km; inter-zone orders beyond 50 km.
6. **Charge = base tariff + (billable weight × per-kg rate) + distance charge**, plus a **COD surcharge** (admin-configurable per order type) if the payment type is COD.
7. The full breakdown (base tariff, weight charge, distance charge, COD surcharge, total) is returned to the UI and shown to the customer **before** they confirm the order — nothing is charged silently at booking time.

Example, a 30×20×15 cm, 2 kg B2C parcel going inter-zone with COD:
```
volumetricWeight = (30 × 20 × 15) / 5000        = 1.8 kg
billableWeight   = max(actualWeight, volWeight)  = max(2, 1.8) = 2 kg
baseTariff (B2C, INTER_ZONE)                      = ₹100
weightCharge      = 2 × ₹35/kg                     = ₹70
distanceCharge     = max(0, distanceKm − 50) × ₹3/km
subtotal           = baseTariff + weightCharge + distanceCharge
codSurcharge (B2C)                                 = ₹30
totalCharge         = subtotal + codSurcharge
```
All of the rate inputs above (`baseTariff`, `perKgCharge`, free-distance threshold behaviour, `codSurcharge`) are read live from `rate_cards` / `cod_surcharge_configs` — an admin changing a rate card in the dashboard takes effect on the very next price preview, with no redeploy.

## Zone Detection

Each pickup/drop **pincode** is resolved through `pincodeLookup.ts`, which maps the pincode's state to one of four zones (North / South / East / West) and to an approximate lat/long centroid (falling back to city-level coordinates where available). If the resolved pickup zone and drop zone are the same, the order is classified `INTRA_ZONE`; otherwise `INTER_ZONE`. This classification feeds directly into both the rate-card lookup and the SLA/ETA calculation. Admins can also refine this by editing `zone_area_mappings` to attach specific pincodes/areas to a zone rather than relying purely on the state-level default.

## Auto-Assignment Logic

On order creation, the system:
1. Fetches all delivery agents and filters to those marked `isAvailable` and verified (falling back to "any verified agent," then "any agent," if none are currently free — so an order is never stuck unassigned when agents exist).
2. Computes the **Haversine great-circle distance** from each candidate agent's last known location to the pickup coordinates.
3. Assigns the nearest candidate and moves the order straight to `ACCEPTED`, logging the dispatch in `statusHistory` and pushing a notification to that agent.

If no agent is available at all, the order stays `PENDING` for manual admin assignment from the dashboard. Admins can also reassign any order to a different agent at any time, which is the same mechanism used during a reschedule after a failed delivery.

## Order Status Lifecycle & Immutable History

```
PENDING → ACCEPTED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                        │
                                                        └──► FAILED → RESCHEDULED → (re-enters flow)
```

Every order has a top-level `status` field **and** a `statusHistory` subcollection at `orders/{orderId}/statusHistory`. Every transition — automatic (auto-dispatch) or manual (agent update, admin override, reschedule) — is written as a new document with `status`, `timestamp`, `actorId`, and `notes`. Nothing in this subcollection is ever edited or deleted, so it functions as an append-only audit log rather than a single mutable field, which is what lets the tracking timeline reconstruct the full journey of a parcel after the fact.

## Failed Delivery & Reschedule

1. An agent marks an attempt `FAILED` (with an optional reason in `notes`) via `orderService.updateStatus`.
2. The customer is notified immediately through `notificationService`.
3. The customer submits a new delivery date via `orderService.reschedule`, which sets `status: RESCHEDULED`, stores the chosen `rescheduleDate` on the order, and logs the transition in `statusHistory`.
4. The order re-enters the assignment flow so it can be picked up (or explicitly reassigned by an admin) for the new attempt.

## Notifications

`notificationService` writes a `notifications` document and, where permission has been granted, delivers a browser push notification via Firebase Cloud Messaging on:
- Order placement (to the customer)
- Agent dispatch (to the assigned agent only)
- Every subsequent status change (to the customer)

Each notification record stores `userId`, `orderId`, `type`, `subject`, and `body`, so the in-app notifications page can render a full history per user even if the push itself was missed.

---

## Firestore Data Model

| Collection | Purpose |
|---|---|
| `users` | Customer / agent / admin profiles, role, wallet balance |
| `agents` | Delivery agent records — availability, verification status, current location/zone |
| `orders` | Order documents (addresses, dimensions, weights, charges, status, assigned agent) |
| `orders/{orderId}/statusHistory` | Immutable, timestamped status transition log per order |
| `zones` | Delivery zones (e.g. North/South/East/West) |
| `zone_area_mappings` | Pincode/area → zone mappings |
| `rate_cards` | B2B/B2C × Intra/Inter rate cards (base charge, per-kg charge) |
| `cod_surcharge_configs` | COD surcharge per order type |
| `saved_addresses` | Customer address book |
| `wallet_transactions` | Wallet debit/credit ledger |
| `notifications` | In-app/push notification log |

> **Note on Firestore security rules:** the current `firestore.rules` allows open read/write on all collections so the app is fully functional out of the box on the Spark plan. Before using this in production, tighten these rules to check `request.auth.uid` and role claims per collection.

**Composite indexes** (`firestore.indexes.json`) are pre-defined for the queries the app actually runs, so `firebase deploy --only firestore:rules,firestore:indexes` (or `npm run deploy:rules`) provisions them automatically instead of you having to click through the Firestore console error links:
- `orders` by `customerId` + `createdAt` (a customer's own order history)
- `orders` by `assignedAgentId` + `createdAt` (an agent's assigned deliveries)
- `saved_addresses` by `userId` + `createdAt`
- `wallet_transactions` by `userId` + `createdAt`

---

## Setup Guide

### Prerequisites
- Node.js 18+
- A Firebase project (Spark/free tier is sufficient) with **Firestore**, **Authentication** (Email/Password + Google), and **Cloud Messaging** enabled

### 1. Clone and install
```bash
git clone https://github.com/deepak-158/Last_mile_delivery.git
cd Last_mile_delivery
npm install                # installs root + triggers workspace scripts
cd frontend
npm install
```

### 2. Configure environment variables
Copy the example file and fill in your Firebase Web app config (Firebase Console → Project Settings → General → Your apps → Web app):

```bash
cd frontend
cp .env.example .env
```

`.env.example`:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 3. Run locally
```bash
npm run dev          # from repo root — starts the Vite dev server for /frontend
```
The app will be available at `http://localhost:5173`.

### 4. Seed default data (optional)
On first run against an empty Firestore project, the app automatically falls back to sensible defaults for zones, rate cards, and COD surcharges (see `zoneService`, `rateCardService`, `codConfigService`) so the order flow works immediately. A `seedService.ts` is also included for explicitly writing this starter data to Firestore.

### 5. Build & deploy
```bash
npm run build             # builds the frontend to frontend/dist
firebase login
firebase use --add        # select your Firebase project
npm run deploy             # builds + deploys hosting and Firestore rules
```
Or deploy hosting only: `npm run deploy:hosting`. Deploy just the security rules/indexes: `npm run deploy:rules`.

### Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Blank screen / "Firebase: Error (auth/invalid-api-key)" | `.env` wasn't created or a `VITE_FIREBASE_*` key is wrong — restart `npm run dev` after editing `.env` since Vite only reads env vars at startup. |
| "Missing or insufficient permissions" on read/write | Firestore rules haven't been deployed (`npm run deploy:rules`), or you're testing against a project where rules were tightened without matching auth claims. |
| Firestore query fails with a console link to "create an index" | Deploy the pre-defined indexes with `npm run deploy:rules`, or click the provided console link to create the specific missing index. |
| New order never gets auto-assigned | No agent in `agents` has `isAvailable: true` — mark one available (or register an agent account) and re-create the order. |
| OSRM distance/ETA looks off or times out | The public OSRM demo server is rate-limited; the app automatically falls back to a Haversine estimate with a road-winding factor, so pricing still works, just slightly less precisely. |

---

## Service Layer Reference

Since there's no separate REST backend, the "API" is the set of typed service modules the frontend calls directly:

| Service | Responsibility |
|---|---|
| `authService` | Sign up/in (email + Google), role assignment, admin whitelist check |
| `orderService` | `preview()` (fare calc), `create()`, `getById()`, `updateStatus()`, `reschedule()` |
| `zoneService` | CRUD for zones and area mappings |
| `rateCardService` | CRUD for B2B/B2C intra/inter rate cards |
| `codConfigService` | CRUD for COD surcharge configuration |
| `agentService` | Agent listing, availability, nearest-agent lookup, dispatch |
| `notificationService` | Persist + push in-app/FCM notifications |
| `walletService` | Wallet debit/credit for prepaid orders |
| `addressService` | Customer saved-address book |

---

## Project Structure

```
Last_mile_delivery/
├── firebase.json              # Hosting + Firestore config
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Composite index definitions
├── package.json                # Root scripts (dev/build/deploy)
└── frontend/
    ├── src/
    │   ├── api/                # Firebase/API client setup
    │   ├── components/         # Shared UI components
    │   ├── config/              # Firebase config
    │   ├── contexts/            # Auth context/provider
    │   ├── layouts/             # Role-based layouts
    │   ├── pages/
    │   │   ├── admin/           # Admin dashboard, zones, rate cards, orders
    │   │   ├── agent/           # Agent deliveries, earnings, wallet
    │   │   ├── auth/            # Login/register (customer, agent, admin)
    │   │   ├── customer/        # Order creation, tracking, wallet, addresses
    │   │   └── shared/          # Notifications
    │   ├── services/            # Business logic / Firestore access layer
    │   └── utils/                # Rate/weight/distance/ETA calculations
    └── .env.example
```

---

---

## Twilio SMS Gateway Integration

The platform includes full omnichannel messaging powered by **Twilio REST API** (`frontend/src/services/smsService.ts`):

### Automated SMS Triggers:
1. **Order Confirmed SMS** — Sent to the customer immediately upon parcel booking with consignment tracking link.
2. **Courier Dispatch Alert SMS** — Dispatched to the nearest assigned courier agent with pickup/drop PIN codes and payout amount.
3. **Out for Delivery SMS** — Sent to the customer with live delivery security OTP and rider name.
4. **Delivered SMS** — Instant delivery confirmation message.
5. **Admin Omnichannel Messenger** — Admin can choose between `Push (FCM)`, `SMS (Twilio)`, or `Omnichannel (Both)` from the Admin Notifications console.

### Configuration (`.env`):
```env
# Twilio REST API Credentials (twilio.com/console)
VITE_TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=+15005550006
```

> **Simulated Gateway Mode**: If live Twilio credentials are not set, the platform automatically runs in smart simulated mode, logging color-coded SMS delivery receipts to the browser console.

---

## Known Limitations & Next Steps

- **Open Firestore rules** — currently permissive (`allow read, write: if true`) for ease of setup on the free tier. Should be locked down to per-role, per-owner access (`request.auth.uid` + role claims) before any real-world use.
- **Zone/coordinate resolution is approximate** — pincode → zone mapping relies on state-level centroids where a precise area mapping hasn't been configured; admins can improve accuracy over time via `zone_area_mappings`.
- **OSRM is a public, best-effort routing service** — fine for a project/demo, but a production deployment would want a paid routing provider or a self-hosted OSRM instance with an SLA.
- **Agent location is last-known, not live-tracked** — auto-assignment uses the agent's stored `latitude`/`longitude`; a production version would update this continuously (e.g. via the browser geolocation API) while an agent is on duty.
- **System design write-up** — a standalone `SYSTEM_DESIGN.md` covering the rate engine, zone detection, auto-assignment, and failed-delivery handling in prose form is a good complement to this README for submission purposes.


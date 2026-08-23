# ✦ Delivero — Enterprise Last-Mile Logistics & Delivery Management Platform

Delivero is a modern, high-performance, serverless last-mile logistics management platform engineered for real-time parcel consignment booking, intelligent spatial courier dispatching, dynamic multi-tier freight calculation, digital prepaid wallet management, and omnichannel customer communication.

Powered by **React 18**, **TypeScript**, **Vite**, **TailwindCSS**, **Google Firebase** (Authentication, Firestore, Hosting, Messaging), **Leaflet / OSRM Spatial Routing**, **Twilio SMS REST Gateway**, **Gmail Transactional Email Relay**, and a **jsPDF Digital Tax Invoice Engine**.

---

## 🚀 Live Production Deployment

- **Production URL**: **[https://lastmiledelivery-b0bdd.web.app](https://lastmiledelivery-b0bdd.web.app)**
- **GitHub Repository**: **[https://github.com/deepak-158/Last_mile_delivery](https://github.com/deepak-158/Last_mile_delivery)**

---

## 🌟 Key Features & Architectural Capabilities

### 1. Role-Based Operations Portals
- **👤 Customer Portal** (`/customer/home`, `/customer/orders`, `/customer/track`, `/customer/wallet`, `/customer/profile`):
  - Consignment parcel booking with live volumetric weight and tariff estimation.
  - Interactive Leaflet GPS map tracking with simulated waypoint progression and ETA breakdowns.
  - Prepaid digital wallet top-up and double-entry transaction ledger.
  - Saved address book with postal PIN code auto-resolution.
  - Profile editor for updating Full Name and contact phone number with live database synchronization.
  - One-click **PDF Delivery Receipt & Tax Invoice** download.
- **🛵 Courier Fleet Partner Portal** (`/agent/dashboard`, `/agent/orders`, `/agent/delivery-flow`, `/agent/wallet`, `/agent/profile`):
  - Online/Offline dispatch availability toggle.
  - Assigned parcel queue with pickup/drop locations, recipient contact dials, and payout breakdown.
  - Guided step-by-step delivery workflow: `ACCEPTED` ➔ `PICKED_UP` ➔ `IN_TRANSIT` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`.
  - Commission earnings tracker and direct bank payout configuration.
- **⚡ Admin Operations Console** (`/admin/dashboard`, `/admin/orders`, `/admin/agents`, `/admin/zones`, `/admin/rate-cards`, `/admin/cod`, `/admin/notifications`):
  - Real-time consignment monitoring with spatial filtering and manual courier override re-assignments.
  - Courier agent verification and KYC credential approvals.
  - High-contrast **Logistics Zones Manager** and **Rate Cards Sandbox**.
  - COD surcharge thresholds and cash-on-delivery risk management.
  - **Omnichannel Broadcast Messenger** with targeted recipient filtering.

---

### 2. Intelligent Spatial Dispatch & Logistics Pricing
- **Spatial Nearest-Neighbor Routing**:
  - Automatically calculates Great-Circle Haversine distance between pickup coordinates and all available, verified courier agents in the zone to auto-assign the optimal rider.
- **Dynamic Freight & Tariff Engine**:
  - **Volumetric Weight Calculation**: `(Length × Breadth × Height in cm) / 5000`.
  - **Billable Weight Resolution**: `max(Actual Weight, Volumetric Weight)`.
  - **Intra-Zone vs. Inter-Zone Matrix**: Automatic classification of origin/destination postal PIN codes into geographic logistics zones.
  - **B2C / B2B Rate Cards**: Base charge + incremental per-kg weight tariff calculation.
  - **COD Surcharges**: Configurable order-type tier surcharges.

---

### 3. Omnichannel Communications Engine
- **🔔 Firebase Cloud Messaging (FCM) & Dual-Tone Web Audio Chime**:
  - Scoped in-app push notifications delivering alerts strictly to the affected customer or courier agent.
  - Dual-tone Web Audio API bell chime (`D5 -> A5 -> D6`) synthesized on incoming notifications.
- **📱 Twilio REST API SMS Gateway** (`frontend/src/services/smsService.ts`):
  - **E.164 Phone Normalizer**: Automatically formats Indian 10-digit mobile numbers (`98XXXXXXXX` ➔ `+9198XXXXXXXX`) and international numbers.
  - **Automated Dispatches**:
    1. *Order Confirmed SMS* — Sent to customer with tracking link.
    2. *Fleet Assignment SMS* — Sent to assigned courier agent with pickup/drop PIN codes & payout.
    3. *Out for Delivery SMS* — Sent to customer with delivery security OTP.
    4. *Delivered SMS* — Sent upon parcel handover.
  - **CORS-Resilient Architecture**: Dual-route dispatching with automatic CORS proxy fallback and Firestore `sms_logs` audit trail.
- **📧 Transactional Email Gateway** (`frontend/src/services/emailService.ts`):
  - Integrated with **Gmail SMTP / HTTPS Web Relay** (`devotiontrue@gmail.com`).
  - Automated HTML emails:
    - *🎉 Delivero Welcome Email* (on registration / onboarding).
    - *📦 Order Booking Confirmation* (with complete pricing breakdown).
    - *📄 Delivery Complete & Tax Invoice Receipt* (with PDF invoice link).
  - Complete audit trail logged in Firestore `email_logs`.

---

### 4. 📄 Digital PDF Tax Invoice Receipt Generator (`frontend/src/utils/pdfReceiptGenerator.ts`)
- Powered by `jspdf`.
- Formatted A4 computer-generated official tax invoice with:
  - Delivero brand banner and tracking ID.
  - Consignor and Consignee contact blocks.
  - Dimensions (LxBxH), Volumetric Weight, and Billable Weight specifications.
  - Freight Tariff breakdown, COD Surcharge, and 18% GST estimate.
  - Security Handover verification and authorized courier officer signature line.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Core** | React 18 (Hooks, Context API), TypeScript, Vite 5 |
| **Styling & UI** | TailwindCSS, Vanilla CSS Tokens, Lucide Icons, Web Audio API |
| **Backend & Cloud** | Google Firebase (Firestore NoSQL, Authentication, Hosting, Storage) |
| **Mapping & Routing** | Leaflet, React-Leaflet, OpenStreetMap, OSRM Public Routing API |
| **SMS Gateway** | Twilio REST API (E.164 normalization, Dual-route CORS proxy) |
| **Email Gateway** | Gmail SMTP Relay & HTTPS Web Relay (`devotiontrue@gmail.com`) |
| **Document Engine** | jsPDF (Vectorized A4 Tax Invoices & Delivery Receipts) |

---

## 📁 Repository & Codebase Architecture

```
LAST MILE DELIVERY/
├── firebase.json                  # Firebase Hosting & rewrite configurations
├── firestore.rules                # Cloud Firestore security rules
├── firestore.indexes.json         # Composite Firestore index definitions
├── package.json                   # Root deployment & development scripts
├── Delivero_LastMileDelivery_Project.zip  # Compact production source code archive
└── frontend/
    ├── public/
    │   ├── firebase-messaging-sw.js # FCM Background Service Worker
    │   └── favicon.svg
    ├── src/
    │   ├── api/
    │   │   └── endpoints.ts       # Unified API interface bridging frontend services
    │   ├── components/
    │   │   ├── DeliveroMap.tsx    # Leaflet GPS consignment map
    │   │   ├── FCMNotificationHandler.tsx # Push listener & Web Audio chime
    │   │   ├── Navbar.tsx         # Responsive navigation bar
    │   │   └── ProtectedRoute.tsx # Multi-role routing guards
    │   ├── config/
    │   │   └── firebase.ts        # Firebase app initialization (Auth, DB, FCM)
    │   ├── contexts/
    │   │   └── AuthContext.tsx    # Global authentication & profile context
    │   ├── layouts/
    │   │   └── DashboardLayout.tsx# Unified role-based responsive sidebar layout
    │   ├── pages/
    │   │   ├── admin/             # Operations Console (Orders, Agents, Zones, Tariffs, COD)
    │   │   ├── agent/             # Fleet Portal (Dashboard, Queue, Flow, Wallet)
    │   │   ├── auth/              # Authentication (Login, Register, Google Onboarding)
    │   │   ├── customer/          # Customer Portal (Booking, Live Tracking, Wallet, Addresses)
    │   │   └── shared/            # Inboxes (UserNotificationsPage, AdminNotificationsPage)
    │   ├── services/
    │   │   ├── addressService.ts  # Customer saved address management
    │   │   ├── agentService.ts    # Courier agent spatial lookup & verification
    │   │   ├── authService.ts     # Firebase Auth, role sync, user profiles
    │   │   ├── codConfigService.ts# COD surcharge configuration
    │   │   ├── emailService.ts    # Gmail transactional email gateway
    │   │   ├── fcmService.ts      # Web push token registration & chime synthesizer
    │   │   ├── notificationService.ts # Targeted Firestore notification engine
    │   │   ├── orderService.ts    # Consignment lifecycle, tariff calculation & dispatch
    │   │   ├── rateCardService.ts # Freight rate card matrices
    │   │   ├── seedService.ts     # Idempotent demo database seeder
    │   │   ├── smsService.ts      # Twilio SMS gateway & E.164 normalizer
    │   │   ├── walletService.ts   # Prepaid digital wallet double-entry ledger
    │   │   └── zoneService.ts     # Geographic zones & PIN mappings
    │   └── utils/
    │       ├── calculations.ts    # Haversine distance, volumetric weight & ETA formulas
    │       ├── helpers.ts         # Currency and date formatters, status badges
    │       ├── pdfReceiptGenerator.ts # jsPDF digital delivery invoice generator
    │       └── pincodeLookup.ts   # Postal PIN code resolution dictionary
    ├── .env.example               # Environment variables template
    ├── index.html                 # Main entry point with SmtpJS & Inter typography
    ├── tailwind.config.js         # Delivero custom color palette
    └── vite.config.ts             # Vite build & bundle optimizer
```

---

## 🗄️ Firestore Database Schema

The platform utilizes a structured, real-time Cloud Firestore database:

1. **`users`**: `{ id, name, email, phone, role ('CUSTOMER'|'AGENT'|'ADMIN'), walletBalance, createdAt }`
2. **`agents`**: `{ id, userId, isAvailable, isVerified, verificationStatus, vehicleType, vehicleNumber, currentZoneId, latitude, longitude }`
3. **`orders`**: `{ orderNumber, customerId, senderName, senderPhone, pickupAddress, pickupPincode, pickupCity, receiverName, receiverPhone, dropAddress, dropPincode, dropCity, actualWeightKg, volumetricWeightKg, billableWeightKg, orderType, paymentType, baseCharge, codSurcharge, totalCharge, status, assignedAgentId, createdAt }`
4. **`zones`**: `{ id, name, description }`
5. **`rate_cards`**: `{ id, orderType, rateType, baseCharge, perKgCharge }`
6. **`cod_configs`**: `{ id, orderType, surchargeAmount }`
7. **`wallets`**: `{ userId, balance, updatedAt }` ➔ Subcollection: `transactions/{id}`
8. **`notifications`**: `{ userId, orderId, type, subject, body, read, createdAt }`
9. **`sms_logs`**: `{ to, body, status, detail, createdAt }`
10. **`email_logs`**: `{ from, to, subject, type, status, detail, createdAt }`

---

## ⚙️ Environment Variables Configuration

Copy `frontend/.env.example` to `frontend/.env` and configure your credentials:

```env
# ─── Firebase Web Client Configuration ──────────────────────
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ─── Twilio SMS Gateway Configuration ────────────────────────
# Get your Account SID, Auth Token & Phone Number from twilio.com/console
VITE_TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_PHONE_NUMBER=+18638046866

# ─── Gmail SMTP / Transactional Email Gateway ─────────────────
# Generated App Password from Google Account → Security → 2-Step Verification → App Passwords
VITE_GMAIL_USER=devotiontrue@gmail.com
VITE_GMAIL_APP_PASSWORD=vmaz ovuu bohr quxm
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/deepak-158/Last_mile_delivery.git
cd Last_mile_delivery
npm install
npm --prefix frontend install
```

### 2. Configure Environment Variables
Create `frontend/.env` and paste your Firebase, Twilio, and Gmail credentials.

### 3. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🚀 Production Deployment (Firebase Hosting)

Deploy the full single-page application to Firebase Hosting:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Build and deploy frontend bundle
npm run deploy:hosting
```

---

## 👥 Default Demo Credentials (Seed Accounts)

The database includes pre-configured demo accounts (password for all accounts: `password123`):

| Role | Email | Name | Default Privileges |
|---|---|---|---|
| **System Admin** | `admin@lastmile.dev` | Deepak Shukla | Full system override, tariff control, agent KYC approval |
| **Courier Agent (North)** | `agent.north@lastmile.dev` | Raj Kumar | Delhi NCR zone dispatch, delivery flow execution |
| **Courier Agent (South)** | `agent.south@lastmile.dev` | Priya Sharma | Bangalore South zone dispatch |
| **Courier Agent (East)** | `agent.east@lastmile.dev` | Amit Das | Kolkata East zone dispatch |
| **Courier Agent (West)** | `agent.west@lastmile.dev` | Sneha Patel | Mumbai West zone dispatch |
| **Customer Account** | `customer@example.com` | Rohan Mehta | Parcel booking, live tracking, prepaid wallet |

---

## 📄 License

This project is licensed under the **MIT License**.

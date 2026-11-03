# Tap to Pay (Tap & Go) Architecture & Diagnostics Guide

This document captures the complete architecture, findings, error taxonomy, verified production milestones, and debugging workflows for the **Tap to Pay on Android** and **Card Payment** implementations in SE PAY.

---

## 1. Overview & Verified Production Status

| Payment Method | Status | Live Verification Details |
| :--- | :--- | :--- |
| **Manual Card Entry** | ✅ **100% Working (Production Live)** | Tokenized client-side (`pm_1UXIujLhXHmPsJKRBPfdKnQd`), created backend intent, charged **$1.00 AUD**, and confirmed (`pi_3UXIukLhXHmPsJKR3vqsJNf6`). |
| **Tap to Pay (NFC / Contactless COTS)** | ✅ **100% Working (Production Live)** | Successfully verified end-to-end on certified Android hardware! Customer tapped card/phone on the back of the device, charged **$1.00 AUD**, debited on bank statement (`SE PAY Clayton South AU -$1.00`), and confirmed `succeeded` on Stripe (`pi_3UXfVsLhXHmPsJKR3206dm9v`). |

---

## 2. Stripe Terminal Tap to Pay Lifecycle

```
[Merchant Initiates Payment]
         │
         ▼
[Check Android Permissions] ───► Requires: ACCESS_FINE_LOCATION, BLUETOOTH_SCAN, BLUETOOTH_CONNECT
         │
         ▼
[supportsReadersOfType({ deviceType: 'tapToPay' })] ───► Hardware TEE & Keystore Check
         │
         ├─── If unsupported ───► Fails fast with TAP_TO_PAY_UNSUPPORTED_DEVICE
         │                         Offers "Pay with Card Instead" button
         ▼
[initialize()] ───► Calls backend POST /api/connection_token for secret
         │
         ▼
[discoverReaders({ discoveryMethod: 'tapToPay' })] ───► Uses phone's internal NFC antenna
         │
         ▼
[connectReader()] ───► Connects using Stripe Location ID (e.g. tml_GrG7VQ6FCriCUw)
         │
         ▼
[Backend: POST /api/payment/create-intent] ───► Step 1: Creates PaymentIntent for 'tap'
         │                                      (Initial status: "requires_payment_method")
         ▼
[retrievePaymentIntent(clientSecret)]
         │
         ▼
[collectPaymentMethod()] ───► Step 2: Prompts customer to tap card against phone back
         │                    Phone NFC reads EMV chip / Apple Pay / Google Pay cryptogram
         ▼
[confirmPaymentIntent()] ───► Step 3: Authorizes with card issuer & Stripe directly
         │                    (Stripe status transitions: "requires_payment_method" -> "succeeded")
         │                    (Bank statement debited immediately)
         ▼
[Payment Success Screen] ───► Refreshes Dashboard metrics via paymentSession
```

---

## 3. Stripe Terminal Lifecycle & Backend Webhook Clarification

### The Two-Phase Payment Mechanism
A common confusion arises when the backend logs the initial response of `POST /api/payment/create-intent`:

1. **Phase 1: Backend Creates Intent (`PaymentIntent::create`)**
   - The backend asks Stripe to prepare a payment slot.
   - At this precise moment, **no card has been tapped yet**.
   - Stripe returns:
     ```json
     {
       "id": "pi_3UXfVsLhXHmPsJKR3206dm9v",
       "status": "requires_payment_method",
       "amount_received": 0,
       "client_secret": "pi_3UXfVs..._secret_..."
     }
     ```
   - **This is 100% normal and expected.**

2. **Phase 2: Mobile App Terminal SDK Captures & Confirms (`confirmPaymentIntent`)**
   - The mobile device uses the `client_secret` to read the customer's contactless card over NFC.
   - The device sends the encrypted card cryptogram directly to Stripe's payment gateways.
   - Stripe authorizes the charge with the card-issuing bank (e.g. Commonwealth Bank, ANZ, NAB), debits the customer's account, and transitions the PaymentIntent status on Stripe to **`"succeeded"`**.

3. **How Backend Must Track Final Status**
   - The backend should **not** rely on the creation response as the final payment receipt.
   - To update database records upon successful tap:
     - **Option A (Recommended)**: Listen to the Stripe Webhook `payment_intent.succeeded`.
     - **Option B (Poll / Sync API)**: Query `\Stripe\PaymentIntent::retrieve($intentId)` (exposed on backend as `GET /api/payment_intent/:id`).

---

## 4. Production Case Study: 3 November 2026 Incident & Fix

### Background
During client testing on a new device with user `setaxibrokers@gmail.com` (`user_id: 31`, `other_business_employee` under `"SIDHU FOOD TRUCK"`), the tap payment failed before the customer could tap.

### Diagnostic Analysis
1. **Hardware Verification**:
   - `requestNeededAndroidPermissions`: Granted without errors.
   - `supportsReadersOfType({ deviceType: 'tapToPay' })`: Returned `readerSupportResult: true`.
   - Internal NFC reader connected: `serialNumber: "276d6ecd-c074-4842-be1f-029f8180e446"`.
   - Reader status: `connected` and `ready`.
2. **Failure Point**:
   - `POST https://sepay.stageserv.in/api/payment/create-intent` returned `HTTP 400 Bad Request`:
     ```json
     {
       "status": false,
       "error": "pickup_id is required.",
       "message": "pickup_id is required."
     }
     ```
3. **Root Cause**:
   - `StripeCardController::createPaymentIntent` required `pickup_id` (a taxi-dispatch parameter).
   - Retail / Food Truck employees (`other_business_employee`) do not have a taxi `pickup_id`.
4. **Resolution**:
   - Backend team removed the mandatory `pickup_id` validation.
   - Subsequent test with a real contactless card immediately succeeded:
     - PaymentIntent ID: `pi_3UXfVsLhXHmPsJKR3206dm9v`
     - Bank Statement debited: **`-$1.00 AUD`** to **`SE PAY Clayton South AU`**.
     - Stripe Terminal Status: **`succeeded`**.

---

## 5. Hardware Compatibility Taxonomy (`TAP_TO_PAY_UNSUPPORTED_DEVICE`)

When testing on different devices, Stripe Terminal Tap to Pay on Android adheres to **PCI CPoC** (Contactless Payments on Commercial off-the-shelf devices) standards:

1. **Hardware Security Module**: The phone must have a dedicated hardware enclave (**Trusted Execution Environment / TEE / StrongBox**) with **Keymaster 3.0+ / Keystore 100+** to store and encrypt payment credentials and PIN data in silicon.
2. **Incompatible Devices**: Many budget devices, certain regional models (some Xiaomi, Redmi, Realme, Oppo, Vivo), devices with unlocked bootloaders, or custom ROMs lack hardware-backed key attestation.
3. **Compatible Devices**: Devices with certified hardware security modules:
   - **Samsung Galaxy** phones with **Samsung Knox** hardware vault.
   - **Google Pixel** phones with **Titan M / M2** security chips.
   - Enterprise Android POS terminals with EMV / PCI certification.

### Location & Permission Requirements
- **Location Services (GPS)**: Must be toggled **ON** in Android Quick Settings. Android OS blocks hardware antenna scans if Location is disabled.
- **Precise Location**: Android permission `ACCESS_FINE_LOCATION` must be granted ("Precise", not "Approximate").

---

## 6. Diagnostics & In-App Log System

To ensure all future debugging can be done directly from physical APKs without a development server:

1. **Persistent Log File (`src/services/appLogger.ts`)**:
   - Automatically writes all API requests, responses, status codes, query params, payloads, and Stripe events to `${documentDirectory}sepay_debug_logs.txt`.
   - In-memory circular buffer of 300 entries connected via `useSyncExternalStore`.
2. **Payment Failure Screen (`src/app/(tabs)/processing.tsx`)**:
   - Shows the exact error message and code instead of generic text.
   - **"Pay with Card Instead"**: Instantly redirects to card entry so the merchant can collect payment immediately.
   - **"Share Error & Debug Logs"**: Opens the native Android share sheet (WhatsApp, Gmail, Drive).
   - **"View In-App Logs"**: Opens `DiagnosticLogsModal.tsx` to read timestamped events on-screen.
3. **Profile Screen**:
   - **"Diagnostics & App Logs"** button accessible in both Owner and Employee profiles.

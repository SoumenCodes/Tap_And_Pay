# Tap to Pay (Tap & Go) Architecture & Diagnostics Guide

This document captures the complete architecture, findings, error taxonomy, and debugging workflows for the **Tap to Pay on Android** and **Card Payment** implementations in SE PAY.

---

## 1. Overview & Verified Production Status

| Payment Method | Status | Live Verification Details |
| :--- | :--- | :--- |
| **Manual Card Entry** | ✅ **100% Working (Production Live)** | Successfully tokenized client-side (`pm_1UXIujLhXHmPsJKRBPfdKnQd`), created backend intent, charged **$1.00 AUD**, and confirmed (`pi_3UXIukLhXHmPsJKR3vqsJNf6`). |
| **Tap to Pay (NFC / Software COTS)** | ⚠️ **Hardware Dependent** | Integrated end-to-end via `@stripe/stripe-terminal-react-native`. Fails with `TAP_TO_PAY_UNSUPPORTED_DEVICE` on phones lacking hardware-level TEE key attestation. Supported on certified hardware (Samsung Galaxy, Google Pixel). |

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
[Backend: POST /api/payment/create-intent] ───► Creates PaymentIntent for 'tap'
         │
         ▼
[retrievePaymentIntent(clientSecret)]
         │
         ▼
[collectPaymentMethod()] ───► Prompts customer to tap card against phone back
         │
         ▼
[confirmPaymentIntent()] ───► Authorizes with card issuer & Stripe
         │
         ▼
[Payment Success Screen] ───► Refreshes Dashboard metrics via paymentSession
```

---

## 3. Critical Root Cause: `TAP_TO_PAY_UNSUPPORTED_DEVICE`

### The Error
```
[ERROR] [TERMINAL] Discovery Error: Device does not use Trusted Execution Environment, 
or does not support hardware-backed key attestation. (Code: TAP_TO_PAY_UNSUPPORTED_DEVICE)
readerSupportResult: false
```

### Why It Happens
Stripe Terminal Tap to Pay on Android adheres to **PCI CPoC** (Contactless Payments on Commercial off-the-shelf devices) standards:
1. **Hardware Security Module**: The phone must have a dedicated hardware enclave (**Trusted Execution Environment / TEE / StrongBox**) with **Keymaster 3.0+ / Keystore 100+** to store and encrypt payment credentials and PIN data in silicon.
2. **Incompatible Devices**: Many budget devices, certain regional models (some Xiaomi, Redmi, Realme, Oppo, Vivo), devices with unlocked bootloaders, or custom ROMs lack hardware-backed key attestation.
3. **Compatible Devices**: Devices with certified hardware security modules:
   - **Samsung Galaxy** phones with **Samsung Knox** hardware vault.
   - **Google Pixel** phones with **Titan M / M2** security chips.
   - Enterprise POS devices and modern flagship models.

### Location & Permission Requirements
- **Location Services (GPS)**: Must be toggled **ON** in Android Quick Settings. Android OS blocks hardware antenna scans if Location is disabled.
- **Precise Location**: Android permission `ACCESS_FINE_LOCATION` must be granted ("Precise", not "Approximate").

---

## 4. Diagnostics & In-App Log System

To ensure all future debugging can be done directly from physical APKs without a development server:

1. **Persistent Log File (`src/services/appLogger.ts`)**:
   - Automatically writes all API requests, responses, status codes, query params, payloads, and Stripe events to `${documentDirectory}sepay_debug_logs.txt`.
   - In-memory circular buffer of 300 entries connected via `useSyncExternalStore`.
2. **Payment Failure Screen (`src/app/(tabs)/processing.tsx`)**:
   - Shows the exact error message and code instead of generic text.
   - **"Pay with Card Instead"**: Instantly redirects to card entry so the merchant can collect payment immediately.
   - **"Share Error & Debug Logs"**: Opens the native Android share sheet (WhatsApp, Gmail, Drive).
   - **"View In-App Logs"**: Opens [`DiagnosticLogsModal.tsx`](../src/components/common/DiagnosticLogsModal.tsx) to read timestamped events on-screen.
3. **Profile Screen**:
   - **"Diagnostics & App Logs"** button accessible in both Owner and Employee profiles.

---

## 5. Next Steps When Testing on Another Device

When testing with a compatible device (e.g. Samsung Galaxy or Google Pixel):
1. Install the APK build.
2. In Android Settings:
   - Turn **NFC** ON.
   - Turn **Location (GPS)** ON.
3. When prompted in the app:
   - Allow **Precise Location** ("While using the app").
   - Allow **Nearby Devices / Bluetooth**.
4. Test Tap to Pay with a contactless bank card or Apple Pay / Google Pay phone.
5. If any issue arises, tap **"Share Error & Debug Logs"** on screen to inspect the full trace.

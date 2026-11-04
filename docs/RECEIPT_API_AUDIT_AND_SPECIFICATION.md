# Receipt API Audit & Technical Specification

**Target Endpoint:** `GET /api/receipt/:id`  
**Related Endpoints:** `POST /api/payment/cash`, Stripe PaymentIntent Webhook  
**Audited Date:** 4 November 2026  
**Audience:** Mobile App Team, Backend API Developers, QA Engineers  

---

## 1. Executive Summary

The receipt feature in SE PAY allows passengers/customers and operators to review, print, and share official digital receipts across all business types (`taxi_business`, `taxi_owner`, `taxi_business_driver`, `other_business`, `other_business_employee`).

The mobile app has already completed the dynamic integration with zero mock fallbacks. However, an audit of the backend responses on staging (`https://sepay.stageserv.in`) revealed **1 critical staging defect** and **several compliance/business data gaps** that require backend review.

| Component | Status | Details |
| :--- | :---: | :--- |
| **Mobile Integration** | ✅ **Complete** | Integrated in `payment-success.tsx`, `receipt-details.tsx`, and `OtherBusinessReceiptScreen.tsx`. |
| **Server Base URLs** | 🚨 **Critical Bug** | Taxi response returns `http://localhost/...` instead of staging/production domain. |
| **ATO Tax Compliance** | ⚠️ **Action Needed** | Missing GST, subtotal, and tax invoice breakdown (required for AU transactions > \$82.50 AUD). |
| **Taxi Fleet Data** | ⚠️ **Action Needed** | Missing driver name, authority ID, and business address in taxi payloads. |
| **Data Primitives** | 💡 **Recommendation** | Missing discrete `card_last4`, `currency`, and timezone offset in `date_time`. |

---

## 2. Audited Backend Responses

### 2.1 Taxi Response (`taxi_business` / `taxi_owner` / `taxi_business_driver`)
**Request:** `GET /api/receipt/pi_3UXdYVLhXHmPsJKR2bivePb5`

```json
{
  "status": true,
  "message": "Receipt retrieved successfully.",
  "data": {
    "business_name": "Indian Sathi",
    "business_logo": "http://localhost/SEPAY_WEB/public/logo/1793429931_d50379776433d12c608b.png",
    "abn": "12345678900",
    "phone_no": "7604010028",
    "taxi_number": "321456",
    "dc_number": "",
    "amount": 250,
    "amount_formatted": "$ 250.00",
    "payment_status": "PAID",
    "pickup_location": "AARONS PASS",
    "drop_location": "ABBA RIVER",
    "date_time": "2026-11-03 19:58:59",
    "payment_type": "Card",
    "payment_method": "Visa •••• 4242",
    "card_brand": "VISA",
    "payment_id": "pi_3UXdYVLhXHmPsJKR2bivePb5",
    "ad_banner": false,
    "banner_image_url": null
  }
}
```

### 2.2 Other Business Response (`other_business` / `other_business_employee`)
**Request:** `GET /api/receipt/pi_3UY2TeLhXHmPsJKR1TOPOXAN`

```json
{
  "status": true,
  "message": "Receipt retrieved successfully.",
  "data": {
    "business_name": "Computer Company",
    "business_logo": "https://sepay.stageserv.in/public/logo/1791363697_7f4208bb44aede86a450.jpg",
    "abn": "12345678901",
    "phone_no": "9874769651",
    "address": "Kolkata, Baguiati, Kolkata, NSW 6541",
    "employee_id": "EMP394366",
    "amount": 4242,
    "amount_formatted": "$ 4,242.00",
    "payment_status": "PAID",
    "date_time": "2026-11-04 22:35:39",
    "payment_method": "Visa •••• 4242",
    "payment_type": "Card",
    "card_brand": "VISA",
    "payment_id": "pi_3UY2TeLhXHmPsJKR1TOPOXAN",
    "ad_banner": true,
    "banner_image_url": "https://sepay.stageserv.in/public/advertisements/1793787641_d773a69e4106cd1265a7.jpg"
  }
}
```

---

## 3. Findings & Defect Analysis

### 3.1 [HIGH / CRITICAL] Localhost Image Domain Leak
* **Defect:** In the Taxi response, `business_logo` returns:
  `http://localhost/SEPAY_WEB/public/logo/1793429931_d50379776433d12c608b.png`
* **Root Cause:** The backend URL builder is resolving against the local web server host (`localhost`) instead of reading `APP_URL` or `base_url()` from environment config (`https://sepay.stageserv.in`).
* **Consequence:** Mobile devices running on physical Android/iOS hardware outside the development machine cannot load the logo (returns connection refused or 404).
* **Fix Required:** Ensure all uploaded asset URLs (`business_logo`, `banner_image_url`) dynamically prepend the configured environment domain.

### 3.2 [MEDIUM / COMPLIANCE] ATO Tax Invoice Requirements (GST & Breakdown)
* **Defect:** Neither response provides a GST breakdown.
* **Australian Regulatory Rule:** Under Australian Tax Office (ATO) legislation, any Tax Invoice exceeding \$82.50 AUD must clearly state the GST amount or specify that GST is included.
* **Missing Parameters:**
  * `subtotal`: Raw pre-tax amount (e.g. `227.27`)
  * `gst_amount`: Calculated 10% GST (e.g. `22.73`)
  * `gst_inclusive`: Boolean flag (`true`)
  * `surcharge_amount`: Any card processing or booking levy fees applied (`0.00` if none)
* **Consequence:** Business passengers claiming taxi or merchant expenses on tax returns cannot verify GST claims without an explicit tax breakdown.

### 3.3 [MEDIUM / FUNCTIONAL] Missing Driver Identification in Taxi Fleet Responses
* **Defect:**
  * `dc_number` is returned as empty string `""`.
  * There is no `driver_name` or `driver_code` field.
* **Why It Matters:** In a taxi business, multiple drivers operate the same vehicle across shifts. When a customer receives a receipt, they need driver identification for lost property inquiries or passenger transport compliance. In comparison, Other Business already returns `"employee_id": "EMP394366"`.
* **Fix Required:** Add `driver_name`, `driver_code` / `employee_id`, and ensure `dc_number` is populated from the driver/shift profile.

### 3.4 [LOW / CONSISTENCY] Missing Business Address for Taxi
* **Defect:** `address` is returned for Other Business, but omitted in Taxi responses.
* **Fix Required:** Provide `"address"` consistently across both user types using the business's registered address.

### 3.5 [LOW / ARCHITECTURAL] UI Strings vs Clean Primitives
* **Defect:** `payment_method` is returned as a formatted string (`"Visa •••• 4242"`).
* **Recommendation:** Per mobile architectural rules, return raw primitives alongside UI strings:
  * `"card_last4": "4242"` (discrete primitive)
  * `"currency": "AUD"` (currency code)
  * `"date_time": "2026-11-03T19:58:59+11:00"` (ISO 8601 with timezone offset to prevent device timezone skew)

### 3.6 Cash Payment Contract Verification
* **Check Required:** When querying `/api/receipt/:id` for a transaction created via `POST /api/payment/cash`, verify that the backend responds with:
  * `"payment_type": "Cash"`
  * `"payment_method": "Cash"`
  * `"card_brand": "Cash"` (or `null`)
  * `"approval_code": "<approval_code>"`

---

## 4. Frontend Safeguards Implemented

To ensure the mobile app remains fully functional while backend fixes are deployed, the frontend has implemented the following safeguards:

1. **`src/utils/assetUtils.ts` (`normalizeImageUrl`)**:
   * Automatically replaces `http://localhost/SEPAY_WEB/` with `https://sepay.stageserv.in/`.
   * Injects `/public/` if the server omits the public folder segment.
2. **`src/utils/dateUtils.ts` (`formatSydneyToUserDateTime`)**:
   * Assumes server timestamps are Sydney local time and formats them gracefully for the user's active device locale.
3. **`src/services/receiptService.ts`**:
   * In-memory cache ensures zero duplicate network fetches between `payment-success.tsx` and `receipt-details.tsx`.
   * Graceful fallback states (`'--'`) without mock or fake names.

---

## 5. Recommended Backend Contract (Ideal JSON Specification)

### 5.1 Taxi Receipt Payload
```json
{
  "status": true,
  "message": "Receipt retrieved successfully.",
  "data": {
    "business_name": "Indian Sathi",
    "business_logo": "https://sepay.stageserv.in/public/logo/1793429931_d50379776433d12c608b.png",
    "abn": "12345678900",
    "phone_no": "7604010028",
    "address": "Victoria Morrice, 456 Seaview Rd, Henley Beach, SA 5022",
    "currency": "AUD",
    "amount": 250.00,
    "amount_formatted": "$ 250.00",
    "subtotal": 227.27,
    "gst_amount": 22.73,
    "gst_inclusive": true,
    "surcharge_amount": 0.00,
    "payment_status": "PAID",
    "date_time": "2026-11-03T19:58:59+11:00",
    "payment_type": "Card",
    "payment_method": "Visa •••• 4242",
    "card_brand": "VISA",
    "card_last4": "4242",
    "payment_id": "pi_3UXdYVLhXHmPsJKR2bivePb5",
    
    "taxi_number": "321456",
    "dc_number": "DC750001",
    "driver_name": "Leo Bourne",
    "driver_code": "140517",
    "pickup_location": "AARONS PASS",
    "drop_location": "ABBA RIVER",
    
    "ad_banner": false,
    "banner_image_url": null
  }
}
```

### 5.2 Other Business Receipt Payload
```json
{
  "status": true,
  "message": "Receipt retrieved successfully.",
  "data": {
    "business_name": "Computer Company",
    "business_logo": "https://sepay.stageserv.in/public/logo/1791363697_7f4208bb44aede86a450.jpg",
    "abn": "12345678901",
    "phone_no": "9874769651",
    "address": "Kolkata, Baguiati, Kolkata, NSW 6541",
    "employee_id": "EMP394366",
    "employee_name": "Dilip Mondal",
    "currency": "AUD",
    "amount": 4242.00,
    "amount_formatted": "$ 4,242.00",
    "subtotal": 3856.36,
    "gst_amount": 385.64,
    "gst_inclusive": true,
    "surcharge_amount": 0.00,
    "payment_status": "PAID",
    "date_time": "2026-11-04T22:35:39+11:00",
    "payment_type": "Card",
    "payment_method": "Visa •••• 4242",
    "card_brand": "VISA",
    "card_last4": "4242",
    "payment_id": "pi_3UY2TeLhXHmPsJKR1TOPOXAN",
    
    "ad_banner": true,
    "banner_image_url": "https://sepay.stageserv.in/public/advertisements/1793787641_d773a69e4106cd1265a7.jpg"
  }
}
```

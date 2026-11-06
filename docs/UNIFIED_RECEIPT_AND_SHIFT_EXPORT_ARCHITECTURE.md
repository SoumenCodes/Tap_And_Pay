# SE PAY - Unified Receipt & Shift Export Architecture Knowledge Base

This document serves as the comprehensive technical knowledge base and adaptation guide for the unified digital receipt, PDF generation, animated GIF creation, image capture, native printing, and shift tally report architecture in SE PAY.

---

## 1. Executive Summary & Design Rationale

### The Problem
Previously, digital receipt rendering and export logic were duplicated across three separate screens:
1. `src/app/(tabs)/receipt-details.tsx` (Taxi receipt screen)
2. `src/components/other-business/owner/OtherBusinessReceiptScreen.tsx` (Non-taxi business receipt screen)
3. `src/components/other-business/owner/OtherBusinessShiftDetailsScreen.tsx` (Shift history details screen for all 5 roles)

Each screen contained ~700–900 lines of duplicate HTML strings, duplicate image capture refs (`captureRef`), redundant GIF creation routines, duplicate bottom-sheet share modals, and ~600 lines of identical CSS/StyleSheet declarations. Maintaining consistency or adding new fields (such as `payment_break_down` or partner ad banners) required tedious, error-prone edits across multiple files.

### The Solution: Unified Architecture
A single, modular, and extensible architecture was engineered:
- **`src/services/receiptExportService.ts`**: Pure export engine responsible for HTML invoice generation, PDF conversion, shift slips, and native printing.
- **`src/components/common/ReceiptShareModal.tsx`**: Reusable UI modal managing off-screen high-resolution capture and format selection (Lossless Image PNG, Animated GIF 4s+4s, and PDF Tax Invoice).
- Consuming screens now only map their local state to the standard `UnifiedReceiptInput` interface and invoke the common components/services, reducing codebase complexity by over **3,000 lines of code** with **zero regressions**.

---

## 2. Supported Roles & Scope

The unified architecture automatically adapts to all 5 user types in the application:

| User Type Key | Role Name | Vertical | Specific Metadata Handled |
| :--- | :--- | :--- | :--- |
| `taxi_business` | Taxi Fleet Operator | Taxi | Taxi Number, DC Number, Pickup → Dropoff Route |
| `taxi_owner` | Taxi Owner Driver | Taxi | Taxi Number, DC Number, Pickup → Dropoff Route |
| `taxi_business_driver` | Taxi Driver | Taxi | Taxi Number, DC Number, Pickup → Dropoff Route |
| `other_business` | Business Owner / Merchant | General Commerce | Business Address, Staff Name, Employee ID |
| `other_business_employee` | Business Employee | General Commerce | Business Address, Staff Name, Employee ID |

---

## 3. Architecture & Data Flow Diagram

```
                        ┌────────────────────────────────────────┐
                        │      Server API Endpoints              │
                        │  • GET  /api/receipt/:id               │
                        │  • GET  /api/shift/history/details/:id │
                        │  • POST /api/payment/fees              │
                        └───────────────────┬────────────────────┘
                                            │
                                            ▼
                        ┌────────────────────────────────────────┐
                        │         Consuming Screens              │
                        │  • (tabs)/receipt-details.tsx          │
                        │  • OtherBusinessReceiptScreen.tsx      │
                        │  • OtherBusinessShiftDetailsScreen.tsx │
                        └───────────────────┬────────────────────┘
                                            │
                         Maps data to UnifiedReceiptInput
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   ▼                                                 ▼
     ┌───────────────────────────┐                     ┌───────────────────────────┐
     │   receiptExportService    │                     │    ReceiptShareModal      │
     │ • generateReceiptHtml()   │                     │ • PNG Capture (100% HD)   │
     │ • printReceipt()          │◄────────────────────┤ • Animated GIF (4s+4s)    │
     │ • generateShiftSlipHtml() │ (Uses HTML for PDF) │ • PDF Share via native    │
     │ • printShiftSlip()        │                     └───────────────────────────┘
     │ • shareShiftSlip()        │
     └─────────────┬─────────────┘
                   │
                   ▼
     ┌───────────────────────────┐
     │   Native Mobile Drivers   │
     │ • expo-print              │
     │ • expo-sharing            │
     │ • react-native-view-shot  │
     └───────────────────────────┘
```

---

## 4. Core TypeScript Interfaces

Defined in [`src/services/receiptExportService.ts`](file:///d:/syscentric/TapToPay/src/services/receiptExportService.ts):

### `UnifiedReceiptInput`
```typescript
export interface UnifiedReceiptInput {
  // Common Business & Transaction Fields
  businessName?: string;
  businessLogo?: string | null;
  abn?: string | null;
  phone?: string | null;
  amount: number | string;
  amountFormatted?: string;
  isPaid?: boolean;
  paidDate?: string | null;
  dateTime?: string;
  paymentMethod?: string;
  paymentType?: string | null;
  cardBrand?: string;
  paymentId?: string;

  // Taxi-Specific Discriminators & Fields
  isTaxi?: boolean;
  taxiNumber?: string | null;
  dcNumber?: string | null;
  pickup?: string | null;
  dropoff?: string | null;

  // Other Business-Specific Fields
  address?: string | null;
  staffName?: string | null;
  staffEmpId?: string | null;

  // Ad Banner & Fee Breakdown
  hasAdBanner?: boolean;
  bannerImageUrl?: string | null;
  breakdown?: PaymentBreakDown | null;
}
```

### `PaymentBreakDown` (from `receiptService.ts`)
```typescript
export interface PaymentBreakDown {
  payable_amount?: number | string;
  base_amount?: number | string;
  service_fee?: number | string;
}
```

### `ShiftSlipInput`
```typescript
export interface ShiftSlipInput {
  businessName?: string;
  staffName?: string;
  staffEmpId?: string;
  displayShiftCode?: string;
  isPaid?: boolean;
  paidDate?: string | null;
  shiftDateText?: string;
  shiftTimeRangeText?: string;
  totalAmount?: string;
  cardAmount?: string;
  cardCount?: number;
  tapAmount?: string;
  tapCount?: number;
  transactions?: ShiftSlipTransactionItem[];
}
```

---

## 5. API Response Contracts & Dynamic Behavior

### A. Payment Fee Breakdown (`POST /api/payment/fees` & `GET /api/receipt/:id`)
When the server returns:
```json
{
  "payment_break_down": {
    "payable_amount": 275,
    "base_amount": 265,
    "service_fee": 10
  }
}
```
* **HTML & Modal Rendering**: A structured box is displayed:
  * **Base Amount**: `$265.00`
  * **Service Fee**: `$10.00`
  * **Total (INC GST)**: `$275.00`
* If `base_amount` is omitted but `payable_amount` and `service_fee` are provided, the engine safely infers `base_amount = payable_amount - service_fee`.
* If `payment_break_down` is `null` or missing, the breakdown section cleanly collapses without leaving blank space or placeholder text.

### B. Partner Advertisement Banner (`ad_banner: true`)
When the server returns:
```json
{
  "ad_banner": true,
  "banner_image_url": "https://sepay.stageserv.in/public/advertisements/..."
}
```
1. **Single-Page PDF (`generateReceiptHtml`)**:
   * Uses a flexbox `@page` layout with `height: 100vh; max-height: 278mm;`.
   * **Top 70%**: The full Tax Invoice receipt card.
   * **Bottom 30%**: The sponsored advertisement banner box with `SPONSORED ADVERTISEMENT` and `SE PAY SPECIAL OFFER` tags.
   * Guaranteed zero multi-page overflow on standard A4 portrait printers.
2. **Animated Card (GIF)**:
   * Enabled as a selectable option in `ReceiptShareModal`.
   * Captures off-screen rendered cards via `captureRef`.
   * Pre-fetches the remote banner image.
   * Cycles **4.0s on the Receipt Card** followed by **4.0s on the Ad Banner Card** in an infinite loop.
3. When `ad_banner` is `false` or `banner_image_url` is missing, the PDF renders as a centered standalone card, and the GIF option is hidden in the share modal.

---

## 6. Role-Specific Variations Matrix

| Feature | Taxi Roles (`isTaxi: true`) | Other Business Roles (`isTaxi: false`) |
| :--- | :--- | :--- |
| **Default Badge** | Yellow Taxi Badge (`assets/taxi-logo.png`) | Briefcase icon (`Feather.briefcase`) or generic badge |
| **Identifiers** | `TAXI NO.: {taxiNumber}   DC: {dcNumber}` | `EMP ID: {staffEmpId}` and `{address}` |
| **Route Row** | Displayed: `PICKUP {pickup} → DROP OFF {dropoff}` | Hidden (collapses completely) |
| **Footer Text** | `"THANK YOU FOR CHOOSING TAXI {taxiNumber}"` | `"THANK YOU FOR CHOOSING {businessName.toUpperCase()}"` |
| **Fee Calculation** | Dynamically fetched from `/api/payment/fees` | Standard merchant sale amount |

---

## 7. How to Adapt for Future Changes

### Scenario 1: Adding a New Field to the Receipt (e.g., Tip Amount or GST Number)
1. **Update Interface**:
   In [`src/services/receiptExportService.ts`](file:///d:/syscentric/TapToPay/src/services/receiptExportService.ts):
   ```typescript
   export interface UnifiedReceiptInput {
     // ... existing fields
     tipAmount?: number | string;
     gstNumber?: string;
   }
   ```
2. **Update HTML Template**:
   In `generateReceiptHtml`:
   ```typescript
   ${input.tipAmount ? `
     <div class="meta-row">
       <span class="meta-label">Tip</span>
       <span class="meta-value">$${Number(input.tipAmount).toFixed(2)}</span>
     </div>
   ` : ''}
   ```
3. **Update Share Modal Off-Screen Card**:
   In [`src/components/common/ReceiptShareModal.tsx`](file:///d:/syscentric/TapToPay/src/components/common/ReceiptShareModal.tsx):
   Add the JSX snippet inside `styles.shareReceiptCard` so it gets captured in the PNG and GIF exports.
4. **Pass Field in Consuming Screens**:
   In `(tabs)/receipt-details.tsx` and `OtherBusinessReceiptScreen.tsx`, map `tipAmount: receiptData?.tip_amount` into `receiptInput`.

### Scenario 2: Changing the Animated GIF Timings
To alter the display duration of the receipt or advertisement banner:
Open [`src/components/common/ReceiptShareModal.tsx`](file:///d:/syscentric/TapToPay/src/components/common/ReceiptShareModal.tsx) around line 189:
```typescript
await animatedGifService.createAndSaveAnimatedGif(targetUri, {
  receiptBase64Png: receiptBase64,
  adBannerBase64Png: adBase64,
  receiptDelaySec: 3.5, // Change receipt display seconds
  adDelaySec: 4.5,      // Change ad banner display seconds
});
```

### Scenario 3: Adding a New Export Format (e.g., Raw Thermal ESC/POS Print or CSV)
1. Add the generator function to [`src/services/receiptExportService.ts`](file:///d:/syscentric/TapToPay/src/services/receiptExportService.ts) (e.g., `exportReceiptEscPos(input: UnifiedReceiptInput)`).
2. Add a new option button to `ReceiptShareModal.tsx` in the bottom sheet with appropriate icon and handler.

### Scenario 4: Adding a New Industry Vertical (e.g., Courier, Hospitality, Retail)
1. Add vertical-specific fields to `UnifiedReceiptInput` (e.g., `tableNumber`, `trackingNumber`, `parcelWeight`).
2. Add a conditional check in `generateReceiptHtml` and `ReceiptShareModal.tsx`.
3. In the new vertical's screen, pass `receiptInput` directly to `<ReceiptShareModal receiptInput={...} />`.

---

## 8. Quality & Performance Rules Checklist

When modifying or extending this architecture, always verify:
- [ ] **Documentation First**: Read this guide and update [`docs/API_SCREEN_MAPPING.md`](file:///d:/syscentric/TapToPay/docs/API_SCREEN_MAPPING.md) if endpoints change.
- [ ] **Zero Synthetic Fallbacks**: Never fall back to fake driver names, hardcoded bank numbers, or dummy routes. Always initialize empty states (`''`, `null`, `0`, `[]`) and display `--` gracefully.
- [ ] **Type Safety**: `npx tsc --noEmit` must pass with **0 errors**.
- [ ] **Linter Cleanliness**: `npx expo lint` must pass with **0 errors**.
- [ ] **Mobile Permissions & Paths**: Use `FileSystem.documentDirectory || FileSystem.cacheDirectory`. Never hardcode native Android/iOS file paths.
- [ ] **Print A4 Strictness**: The CSS in `generateReceiptHtml` must use `box-sizing: border-box; page-break-inside: avoid;` to prevent unwanted 2nd page printing.

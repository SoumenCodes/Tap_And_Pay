# SE PAY - Animated Digital Receipt & Advertisement Sharing Architecture

Comprehensive technical documentation covering the design, implementation, mobile decoder optimization, and troubleshooting for digital receipts with dynamic partner advertisements.

---

## 1. Overview & Business Requirements

When a transaction is completed and the official receipt API (`/api/receipt/:id`) returns an advertisement banner:
```json
{
  "status": true,
  "message": "Receipt retrieved successfully.",
  "data": {
    "business_name": "Computer Company",
    "business_logo": "https://sepay.stageserv.in/public/logo/...",
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

The app provides three distinct, high-fidelity export and sharing options:

1. 📸 **Lossless High-Resolution Image (PNG)**:
   - **Quality**: 100% lossless TrueColor (16.7 million colors, 24-bit RGB + 8-bit Alpha).
   - **Purpose**: Provides merchant and customer with an immaculate, pixel-perfect image for records, accounting, or formal proof of payment.
2. 🎬 **Animated Digital Card (GIF)**:
   - **Timing**: Cycles **4.0 seconds on the Digital Receipt Card**, followed by **4.0 seconds on the Partner Advertisement Banner**, in an infinite loop (`loop: 0`).
   - **Purpose**: Engaging mobile-friendly animated asset for social apps (WhatsApp, Messages, AirDrop, Email).
3. 📄 **Single-Page PDF Document**:
   - **Layout**: Strict single-page A4 print format (**70% Receipt Card** at top, **30% Advertisement Banner** at bottom). Guaranteed zero page spillover.
   - **Purpose**: Formal printable receipt document with full breakdown.

---

## 2. Supported Roles & Scope

The digital receipt sharing architecture operates uniformly across all 5 user types:
- `taxi_business`: Taxi Fleet Company
- `taxi_owner`: Taxi Owner Driver
- `taxi_business_driver`: Normal Taxi Driver
- `other_business`: Non-taxi Merchant / Owner (Retail, Services, Salons)
- `other_business_employee`: Employee under Other Business

---

## 3. Core Technical Architecture

```
[ Receipt API (/api/receipt/:id) ]
                │
                ├──> ad_banner: true, banner_image_url
                │
┌───────────────┴──────────────────────────────────────────────────────┐
│ Share Modal Options                                                  │
├───────────────────────┬────────────────────────┬─────────────────────┤
│ 1. Crisp PNG (100% HD)│ 2. Animated GIF (4s+4s)│ 3. PDF Split (70/30)│
└───────────┬───────────┴───────────┬────────────┴──────────┬──────────┘
            │                       │                       │
      `captureRef`          `captureRef` x2            `expo-print`
     (Lossless PNG)    (Receipt & Hidden Ad Card)   (A4 Fixed Viewport)
            │                       │                       │
     `Sharing.shareAsync`  `animatedGifService`     `Sharing.shareAsync`
                            ├── Alpha Flattening
                            ├── Bilinear Fit
                            ├── UPNG Median Cut
                            └── 1.0s Multi-Chunk Pacing
```

### Component & Service Inventory

| File Path | Description |
| :--- | :--- |
| [`src/services/animatedGifService.ts`](../src/services/animatedGifService.ts) | Pure JS 2-frame/8-chunk animated GIF generator using `UPNG.js` and `omggif`. |
| [`src/app/(tabs)/receipt-details.tsx`](../src/app/(tabs)/receipt-details.tsx) | Receipt screen for Taxi roles with hidden capture container, 3-option share modal, and PDF generation. |
| [`src/components/other-business/owner/OtherBusinessReceiptScreen.tsx`](../src/components/other-business/owner/OtherBusinessReceiptScreen.tsx) | Receipt screen for Business roles with hidden capture container, 3-option share modal, and PDF generation. |
| [`src/utils/dateTimeUtils.ts`](../src/utils/dateTimeUtils.ts) | Converts server timestamps (Sydney timezone) to user's local timezone. |

---

## 4. Mobile Phone Flickering Bug & Deep Technical Resolution

### Problem Diagnosis
On desktop computers (browser preview, desktop WhatsApp, macOS preview), the 2-frame animated GIF played smoothly: 4 seconds on receipt, 4 seconds on advertisement.
However, on **mobile phones (Android Gallery, iOS Photos, WhatsApp Mobile)**:
- The receipt displayed for 4 seconds.
- When transitioning to the advertisement, the AD **did not hold for 4 seconds** — it flashed/flickered for ~16ms and snapped instantly back to the receipt.

### Root Causes
1. **Missing Frame Disposal (`disposal: 0`)**:
   - `omggif` defaulted `disposal` to `0` ("no disposal specified").
   - Desktop decoders retain the active buffer, but mobile decoders (iOS `ImageIO`, Android `Movie`/`Glide`) treat `disposal: 0` on the final frame as an incomplete transition and immediately reset the playback state.
2. **The "Single-Frame Long Delay" Truncation Bug in Mobile Decoders**:
   - When a GIF contains only 2 frames where Frame 2 has a massive delay (`delay: 400` = 4.0 seconds), mobile rendering pipelines process Frame 1 (4s), decode Frame 2, and upon hitting the GIF trailer byte (`0x3B`), trigger an immediate loop boundary reset without yielding the 400cs sleep on the final frame.

### The Solution: Multi-Chunk Pacing & `disposal: 2`
In [`src/services/animatedGifService.ts`](../src/services/animatedGifService.ts):

1. **Explicit Disposal (`disposal: 2`)**:
   Every frame explicitly specifies `disposal: 2` (**Restore to background**). This forces mobile decoders to respect each frame as a complete, independent graphic that must not be cleared or skipped until its delay completes.
2. **Paced 1.0-Second Hold Frames**:
   Instead of 1 single frame with a 400cs delay, the 4-second hold is divided into **4 sequential 1.0-second sub-frames (`delay: 100cs`)**:

```typescript
const addPacedFrames = (
  pixels: Uint8Array,
  palette: number[],
  totalSeconds: number
) => {
  const chunks = Math.max(1, Math.round(totalSeconds)); // 4 chunks
  const chunkDelay = Math.round((totalSeconds / chunks) * 100); // 100 cs = 1.0s

  for (let c = 0; c < chunks; c++) {
    writer.addFrame(0, 0, width, height, pixels as unknown as number[], {
      palette,
      delay: chunkDelay, // 100cs = 1.0s
      disposal: 2,       // Restore to background (prevents mobile phone flicker!)
    });
  }
};

// Sequence 1: Digital Receipt — 4 chunks of 1.0s = 4.0 seconds total
addPacedFrames(f1.indexedPixels, f1.palette, receiptDelaySec);

// Sequence 2: Advertisement Banner — 4 chunks of 1.0s = 4.0 seconds total
addPacedFrames(f2.indexedPixels, f2.palette, adDelaySec);
```

**Outcome**:
- Android Gallery, iOS Photos, and WhatsApp Mobile now step through all 4 chunks (`1s ➔ 2s ➔ 3s ➔ 4s`), holding the advertisement rock-solid for the entire 4 seconds without any flickering.
- LZW encoding compresses repeating identical frames efficiently (~2 KB total size increase).

---

## 5. Image Quality & Color Optimization

### 1. Alpha Pre-Flattening (`flattenRgbaAgainstBg`)
`react-native-view-shot` outputs PNG with transparent rounded corners and shadow alpha. In standard GIF conversion, transparent pixels become black or muddy fringes around text.
- **Frame 1 (Receipt)**: Pre-blended against pure opaque white `#FFFFFF`.
- **Frame 2 (Ad Banner)**: Pre-blended against solid dark navy `#0F172A`.
- **Result**: Zero black corner blotches; crisp anti-aliased font edges.

### 2. Bilinear Scaling (`bilinearFitRgba`)
Replaces nearest-neighbor point sampling with bilinear interpolation when Frame 2 dimensions differ from Frame 1. Eliminates jagged edges and letterbox distortion.

### 3. Median-Cut Vector Quantization (`UPNG.quantize`)
Uses UPNG's KD-tree median-cut algorithm with `roundAlpha: true` to generate an optimal 256-color local palette per frame.

---

## 6. Single-Page PDF Layout (70% Receipt / 30% Advertisement)

To prevent the advertisement banner from spilling onto a second page:
1. **Print Viewport Constraint**:
   ```css
   @page {
     size: A4 portrait;
     margin: 6mm 10mm;
   }
   .page-container {
     max-height: 276mm;
     page-break-inside: avoid;
     overflow: hidden;
   }
   ```
2. **Dynamic Height Allocation**:
   - Receipt Card (`.receipt-card-70`): Bound to `max-height: 68%` with condensed padding.
   - Ad Banner (`.ad-banner-30`): Bound to `max-height: 28%` with `object-fit: contain`.
3. **Timezone Conversion**: Server `date_time` (Sydney) is converted into the recipient's local timezone via `dateTimeUtils`.

---

## 7. App UI Separation

The on-screen "Sponsored Offer" section was completely removed from the scrollable receipt screens. The in-app screen displays **only** the official receipt card and the Print/Share buttons. The advertisement is rendered exclusively within:
1. The shared 70/30 single-page PDF.
2. The shared 4s/4s animated GIF.
3. The companion off-screen capture view (positioned with `zIndex: -1` and `opacity: 1` behind the solid `#FFFFFF` foreground, so it is fully laid out and painted for `captureRef` without being visible on-screen).

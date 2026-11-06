import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform, Share } from 'react-native';
import { getAssetDataUri, normalizeImageUrl } from '../utils/assetUtils';
import type { PaymentBreakDown } from './receiptService';

export interface UnifiedReceiptInput {
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
  // Taxi specific
  isTaxi?: boolean;
  taxiNumber?: string | null;
  dcNumber?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  // Other business specific
  address?: string | null;
  staffName?: string | null;
  staffEmpId?: string | null;
  // Ad banner & breakdown
  hasAdBanner?: boolean;
  bannerImageUrl?: string | null;
  breakdown?: PaymentBreakDown | null;
}

export interface ShiftSlipTransactionItem {
  transaction_id: string;
  date: string;
  payment_method: string;
  amount_formatted: string;
}

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

export function getExportFilename(prefix: string, bizName: string, ext: string): string {
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${sanitize(bizName || 'SE_PAY')}_${Date.now()}.${ext}`;
}

export function formatReceiptAmount(amount: number | string): {
  numeric: number;
  whole: string;
  cents: string;
  formatted: string;
} {
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const whole = Math.floor(numeric).toLocaleString('en-US');
  const cents = ((numeric % 1) * 100).toFixed(0).padStart(2, '0');
  const formatted = `$${whole}.${cents}`;
  return { numeric, whole, cents, formatted };
}

/**
 * Generates official high-fidelity HTML for TAX INVOICE receipts.
 * Supports both standalone single-page card and 70%/30% sponsored ad banner split.
 */
export async function generateReceiptHtml(input: UnifiedReceiptInput): Promise<string> {
  let taxiLogoUri: string | null = null;
  let sePayLogoUri: string | null = null;

  try {
    taxiLogoUri = await getAssetDataUri(
      require('../../assets/taxi-logo.png'),
      'image/png'
    );
  } catch {
    // fallback
  }

  try {
    sePayLogoUri = await getAssetDataUri(
      require('../../assets/SE-pay-logo-gif.gif'),
      'image/gif'
    );
  } catch {
    // fallback
  }

  const biz = input.businessName || 'Business';
  const logoUrl = normalizeImageUrl(input.businessLogo);
  const abnVal = input.abn || '19113303849';
  const phoneVal = input.phone || '9113303849';
  const isTaxi = Boolean(input.isTaxi || input.taxiNumber);
  const taxiNo = input.taxiNumber || '';
  const dcNo = input.dcNumber || '';
  const staff = input.staffName || 'Staff Member';
  const staffCode = input.staffEmpId || '';
  const pickup = input.pickup || '';
  const dropoff = input.dropoff || '';
  const hasRoute = Boolean(pickup || dropoff);

  const { numeric, whole, cents } = formatReceiptAmount(input.amount);
  const isCash = (input.paymentMethod || '').toLowerCase().includes('cash');
  const isTap = (input.paymentMethod || '').toLowerCase().includes('tap');
  const cardBrand = (input.cardBrand || (isCash ? 'CASH' : isTap ? 'TAP & GO' : 'VISA')).toUpperCase();
  const paymentMethodLabel = input.paymentMethod || (isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card');
  const payId = input.paymentId || '--';
  const dt = input.dateTime || new Date().toLocaleString();

  const bk = input.breakdown;
  const hasBk = Boolean(bk && (bk.base_amount !== undefined || bk.payable_amount !== undefined));
  const bkBase =
    bk?.base_amount !== undefined
      ? Number(bk.base_amount)
      : bk?.payable_amount !== undefined && bk?.service_fee !== undefined
      ? Number(bk.payable_amount) - Number(bk.service_fee)
      : null;
  const bkFee = bk?.service_fee !== undefined ? Number(bk.service_fee) : 0;
  const bkTotal = bk?.payable_amount !== undefined ? Number(bk.payable_amount) : numeric;

  const hasAd = Boolean(input.hasAdBanner && input.bannerImageUrl);
  const bannerUrl = normalizeImageUrl(input.bannerImageUrl);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${biz}</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    @page { size: A4 portrait; margin: 8mm 12mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0; padding: 0; background-color: #FFFFFF; color: #0F172A;
      display: flex; justify-content: center; align-items: center; width: 100%;
    }
    .page-container {
      width: 100%; max-width: 480px; margin: 0 auto; height: 100vh; max-height: 278mm;
      display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid;
    }
    .receipt-card, .receipt-card-70 {
      width: 100%; max-width: 480px; margin: 0 auto; background: #FFFDF7;
      border: 1.5px solid #FEF08A; border-radius: 20px; padding: 16px 20px 14px; text-align: center;
    }
    .receipt-card-70 { flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; margin: 0 auto 10px; }
    .logo-badge {
      width: 46px; height: 46px; background: #FEF9C3; border: 1.2px solid #FDE047; border-radius: 12px;
      margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4px;
    }
    .logo-badge img { width: 100%; height: 100%; object-fit: contain; }
    .biz-name { font-size: 16.5px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
    .tax-invoice-heading { font-size: 16px; font-weight: 900; color: #0F172A; letter-spacing: 2px; margin: 2px 0 4px; text-transform: uppercase; }
    .biz-meta { font-size: 10.5px; color: #64748B; font-weight: 600; }
    .total-paid-label { font-size: 10.5px; font-weight: 800; color: #94A3B8; letter-spacing: 0.8px; margin-top: 10px; }
    .amount { font-size: 34px; font-weight: 900; color: #0F172A; margin: 1px 0 3px; }
    .dollar { font-size: 20px; color: #D97706; vertical-align: baseline; }
    .decimal { font-size: 22px; font-weight: 800; }
    .paid-badge {
      display: inline-flex; align-items: center; background: #ECFDF5; border: 1px solid #A7F3D0;
      color: #059669; font-size: 10.5px; font-weight: 800; padding: 2px 9px; border-radius: 12px;
    }
    .paid-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-right: 4px; }
    .divider { height: 1px; background: #F1F5F9; margin: 9px 0; }
    .route-row { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; text-align: left; }
    .route-col { flex: 1; }
    .route-col.right { text-align: right; }
    .route-label { font-size: 9.5px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; }
    .route-val { font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 1px; }
    .arrow { font-size: 16px; color: #F59E0B; padding: 0 6px; }
    .breakdown-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 10px; margin: 4px 0; }
    .breakdown-hdr { font-size: 9.5px; font-weight: 800; color: #64748B; letter-spacing: 0.5px; text-align: left; margin-bottom: 4px; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; color: #64748B; }
    .breakdown-val { font-weight: 700; color: #0F172A; }
    .breakdown-row.total { font-weight: 800; color: #0F172A; font-size: 12px; margin-top: 3px; }
    .breakdown-divider { height: 1px; background: #E2E8F0; margin: 4px 0; }
    .breakdown-total-val { font-weight: 900; color: #D97706; }
    .meta-list { text-align: left; display: flex; flex-direction: column; gap: 7px; padding: 0 2px; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; }
    .meta-label { font-size: 10px; color: #94A3B8; font-weight: 500; }
    .meta-value { font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 1px; }
    .pill-card { background: #EFF6FF; border: 1px solid #DBEAFE; color: #2563EB; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .pill-cash-tag { background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .pill-brand { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1D4ED8; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
    .pill-brand-cash { background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
    .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #F1F5F9; text-align: center; }
    .thank-you { font-size: 10px; font-weight: 800; letter-spacing: 0.5px; margin: 0 0 2px; color: #0F172A; }
    .powered-by { font-size: 8px; color: #94A3B8; font-weight: 700; letter-spacing: 1.2px; margin: 0 0 3px; }
    .se-pay-gif-logo { display: block; margin: 0 auto; width: 95px; height: auto; object-fit: contain; }
    .ad-banner-30 { height: 29%; background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 8px 12px 10px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
    .ad-tag-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .ad-tag { font-size: 8.5px; font-weight: 800; color: #94A3B8; letter-spacing: 0.8px; text-transform: uppercase; }
    .ad-provider { font-size: 8.5px; font-weight: 700; color: #D97706; letter-spacing: 0.5px; }
    .ad-img-box { flex: 1; width: 100%; height: calc(100% - 16px); border-radius: 12px; overflow: hidden; background: #0F172A; }
    .ad-img-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
  </style>
</head>
<body>
  ${hasAd && bannerUrl ? `
  <div class="page-container">
    <div class="receipt-card-70">
      <div class="logo-badge">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : taxiLogoUri ? `<img src="${taxiLogoUri}" alt="Taxi" />` : `<div style="font-size: 22px;">🚕</div>`}
      </div>
      <div class="biz-name">${biz}</div>
      <div class="tax-invoice-heading">TAX INVOICE</div>
      <div class="biz-meta">ABN: ${abnVal} • PH: ${phoneVal}</div>
      ${isTaxi ? `<div class="biz-meta">TAXI NO.: ${taxiNo}${dcNo ? ' &nbsp;&nbsp; DC: ' + dcNo : ''}</div>` : `<div class="biz-meta">EMP: ${staff}${staffCode ? ' (' + staffCode + ')' : ''}</div>`}
      ${input.address ? `<div class="biz-meta">${input.address}</div>` : ''}

      <div class="total-paid-label">TOTAL PAID (INC GST)</div>
      <div class="amount"><span class="dollar">$</span>${whole}<span class="decimal">.${cents}</span></div>
      <div><span class="paid-badge"><span class="paid-dot"></span>PAID</span></div>

      <div class="divider"></div>

      ${hasRoute ? `
      <div class="route-row">
        <div class="route-col"><div class="route-label">PICKUP</div><div class="route-val">${pickup || '--'}</div></div>
        <div class="arrow">→</div>
        <div class="route-col right"><div class="route-label">DROP OFF</div><div class="route-val">${dropoff || '--'}</div></div>
      </div>
      <div class="divider"></div>
      ` : ''}

      ${hasBk && bkBase !== null ? `
      <div class="breakdown-box">
        <div class="breakdown-hdr">PAYMENT BREAKDOWN</div>
        <div class="breakdown-row"><span>Base Amount</span><span class="breakdown-val">$${Number(bkBase).toFixed(2)}</span></div>
        <div class="breakdown-row"><span>Service Fee</span><span class="breakdown-val">$${Number(bkFee).toFixed(2)}</span></div>
        <div class="breakdown-divider"></div>
        <div class="breakdown-row total"><span>Total (INC GST)</span><span class="breakdown-total-val">$${Number(bkTotal).toFixed(2)}</span></div>
      </div>
      <div class="divider"></div>
      ` : ''}

      <div class="meta-list">
        <div class="meta-row">
          <div><div class="meta-label">Date & Time</div><div class="meta-value">${dt}</div></div>
          <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">${isCash ? '💵 Cash' : isTap ? '⚡ Tap & Go' : '💳 Card'}</div>
        </div>
        <div class="meta-row">
          <div><div class="meta-label">Payment Method</div><div class="meta-value">${paymentMethodLabel}</div></div>
          <div class="${isCash ? 'pill-brand-cash' : 'pill-brand'}">${cardBrand}</div>
        </div>
        <div class="meta-row">
          <div><div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div><div class="meta-value">${payId}</div></div>
        </div>
      </div>

      <div class="footer">
        <div class="thank-you">THANK YOU FOR CHOOSING ${isTaxi && taxiNo ? `TAXI ${taxiNo}` : biz.toUpperCase()}</div>
        <div class="powered-by">POWERED BY</div>
        ${sePayLogoUri ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />` : '<div style="font-weight: 800; font-size: 12px; color: #0F172A;">SE PAY</div>'}
      </div>
    </div>

    <!-- 30% Advertisement Banner -->
    <div class="ad-banner-30">
      <div class="ad-tag-row"><span class="ad-tag">SPONSORED ADVERTISEMENT</span><span class="ad-provider">SE PAY SPECIAL OFFER</span></div>
      <div class="ad-img-box"><img src="${bannerUrl}" alt="Promotion" /></div>
    </div>
  </div>
  ` : `
  <div class="receipt-card">
    <div class="logo-badge">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" />` : taxiLogoUri ? `<img src="${taxiLogoUri}" alt="Taxi" />` : `<div style="font-size: 22px;">🚕</div>`}
    </div>
    <div class="biz-name">${biz}</div>
    <div class="tax-invoice-heading">TAX INVOICE</div>
    <div class="biz-meta">ABN: ${abnVal} • PH: ${phoneVal}</div>
    ${isTaxi ? `<div class="biz-meta">TAXI NO.: ${taxiNo}${dcNo ? ' &nbsp;&nbsp; DC: ' + dcNo : ''}</div>` : `<div class="biz-meta">EMP: ${staff}${staffCode ? ' (' + staffCode + ')' : ''}</div>`}
    ${input.address ? `<div class="biz-meta">${input.address}</div>` : ''}

    <div class="total-paid-label">TOTAL PAID (INC GST)</div>
    <div class="amount"><span class="dollar">$</span>${whole}<span class="decimal">.${cents}</span></div>
    <div><span class="paid-badge"><span class="paid-dot"></span>PAID</span></div>

    <div class="divider"></div>

    ${hasRoute ? `
    <div class="route-row">
      <div class="route-col"><div class="route-label">PICKUP</div><div class="route-val">${pickup || '--'}</div></div>
      <div class="arrow">→</div>
      <div class="route-col right"><div class="route-label">DROP OFF</div><div class="route-val">${dropoff || '--'}</div></div>
    </div>
    <div class="divider"></div>
    ` : ''}

    ${hasBk && bkBase !== null ? `
    <div class="breakdown-box">
      <div class="breakdown-hdr">PAYMENT BREAKDOWN</div>
      <div class="breakdown-row"><span>Base Amount</span><span class="breakdown-val">$${Number(bkBase).toFixed(2)}</span></div>
      <div class="breakdown-row"><span>Service Fee</span><span class="breakdown-val">$${Number(bkFee).toFixed(2)}</span></div>
      <div class="breakdown-divider"></div>
      <div class="breakdown-row total"><span>Total (INC GST)</span><span class="breakdown-total-val">$${Number(bkTotal).toFixed(2)}</span></div>
    </div>
    <div class="divider"></div>
    ` : ''}

    <div class="meta-list">
      <div class="meta-row">
        <div><div class="meta-label">Date & Time</div><div class="meta-value">${dt}</div></div>
        <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">${isCash ? '💵 Cash' : isTap ? '⚡ Tap & Go' : '💳 Card'}</div>
      </div>
      <div class="meta-row">
        <div><div class="meta-label">Payment Method</div><div class="meta-value">${paymentMethodLabel}</div></div>
        <div class="${isCash ? 'pill-brand-cash' : 'pill-brand'}">${cardBrand}</div>
      </div>
      <div class="meta-row">
        <div><div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div><div class="meta-value">${payId}</div></div>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">THANK YOU FOR CHOOSING ${isTaxi && taxiNo ? `TAXI ${taxiNo}` : biz.toUpperCase()}</div>
      <div class="powered-by">POWERED BY</div>
      ${sePayLogoUri ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />` : '<div style="font-weight: 800; font-size: 12px; color: #0F172A;">SE PAY</div>'}
    </div>
  </div>
  `}
</body>
</html>
  `;
}

/**
 * Native Print dialog trigger for a single receipt
 */
export async function printReceipt(input: UnifiedReceiptInput): Promise<void> {
  const html = await generateReceiptHtml(input);
  await Print.printAsync({ html });
}

/**
 * Generates HTML for entire Shift Tally Slips
 */
export function generateShiftSlipHtml(input: ShiftSlipInput): string {
  const biz = input.businessName || 'Business';
  const staff = input.staffName || 'Staff Member';
  const staffEmp = input.staffEmpId ? ` (${input.staffEmpId})` : '';
  const shiftCode = input.displayShiftCode || '--';
  const isPaid = Boolean(input.isPaid);
  const paidDate = input.paidDate;
  const dateText = input.shiftDateText || '--';
  const timeText = input.shiftTimeRangeText || '--';
  const totalAmount = input.totalAmount || '$0.00';
  const cardAmount = input.cardAmount || '$0.00';
  const cardCount = input.cardCount ?? 0;
  const tapAmount = input.tapAmount || '$0.00';
  const tapCount = input.tapCount ?? 0;
  const txns = input.transactions || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; }
    .header { text-align: center; border-bottom: 2px dashed #E5E7EB; padding-bottom: 16px; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: bold; margin: 0; color: #0F172A; }
    .sub { color: #64748B; font-size: 13px; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px; background: ${isPaid ? '#ECFDF5' : '#FFFBEB'}; color: ${isPaid ? '#059669' : '#D97706'}; }
    .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .label { color: #64748B; }
    .val { font-weight: 600; color: #0F172A; }
    .table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .table th { text-align: left; background: #F1F5F9; padding: 8px; font-size: 11px; color: #475569; }
    .table td { padding: 8px; border-bottom: 1px solid #F1F5F9; font-size: 12px; }
    .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px dashed #E5E7EB; padding-top: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${biz}</h1>
    <p class="sub">Shift Tally Slip</p>
    <div class="badge">${isPaid ? `● PAID${paidDate ? ` on ${paidDate}` : ''}` : '● UNPAID'}</div>
  </div>

  <div class="card">
    <div class="row"><span class="label">Shift ID:</span><span class="val">${shiftCode}</span></div>
    <div class="row"><span class="label">Staff:</span><span class="val">${staff}${staffEmp}</span></div>
    <div class="row"><span class="label">Time:</span><span class="val">${dateText} • ${timeText}</span></div>
    <div class="row"><span class="label">Total Collections:</span><span class="val" style="font-size: 16px; font-weight: 800; color: #059669;">${totalAmount} AUD</span></div>
    <div class="row"><span class="label">Card Sales (${cardCount} txns):</span><span class="val">${cardAmount}</span></div>
    <div class="row"><span class="label">Tap & Go Sales (${tapCount} txns):</span><span class="val">${tapAmount}</span></div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>TXN ID</th>
        <th>Time</th>
        <th>Method</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${txns.map(
        (t) => `
        <tr>
          <td>${t.transaction_id}</td>
          <td>${t.date}</td>
          <td>${t.payment_method}</td>
          <td style="font-weight: bold;">${t.amount_formatted}</td>
        </tr>
      `
      ).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>SE PAY SECURED TERMINAL PAYMENT</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `;
}

/**
 * Native Print dialog trigger for a full shift slip
 */
export async function printShiftSlip(input: ShiftSlipInput): Promise<void> {
  const html = generateShiftSlipHtml(input);
  await Print.printAsync({ html });
}

/**
 * Native PDF share for a full shift report
 */
export async function shareShiftSlip(input: ShiftSlipInput): Promise<void> {
  const html = generateShiftSlipHtml(input);
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  const shiftCode = input.displayShiftCode || 'SHIFT';
  const fileName = `Shift_Report_${shiftCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
  const targetUri = `${baseDir}${fileName}`;

  if (base64) {
    await FileSystem.writeAsStringAsync(targetUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else if (uri) {
    try {
      await FileSystem.copyAsync({ from: uri, to: targetUri });
    } catch {
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(targetUri, b64, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    try {
      await Sharing.shareAsync(targetUri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Shift Report ${shiftCode}`,
        UTI: 'com.adobe.pdf',
      });
      return;
    } catch (shareErr) {
      console.warn('Sharing.shareAsync failed, trying Share.share:', shareErr);
    }
  }

  const shareMsg = `Shift Report: ${input.businessName || 'Business'}\nShift: ${shiftCode}\nTotal: ${input.totalAmount || '$0.00'}\nStaff: ${input.staffName || '--'}`;
  await Share.share(
    Platform.OS === 'ios'
      ? {
          title: `Shift Report ${shiftCode}`,
          message: shareMsg,
          url: targetUri,
        }
      : {
          title: `Shift Report ${shiftCode}`,
          message: shareMsg,
        }
  );
}

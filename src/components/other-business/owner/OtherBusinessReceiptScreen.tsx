import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Share,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import HeaderBar from '../../common/HeaderBar';
import { getAssetDataUri, normalizeImageUrl } from '../../../utils/assetUtils';
import { formatSydneyToUserDateTime } from '../../../utils/dateUtils';
import {
  dashboardService,
  onDashboardHeaderSync,
  getCachedDashboardHeader,
} from '../../../services/dashboardService';
import { tokenStorage } from '../../../services/tokenStorage';
import { receiptService, ReceiptData } from '../../../services/receiptService';
import { animatedGifService } from '../../../services/animatedGifService';

function getExportFilename(prefix: string, bizName: string, ext: string): string {
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${prefix}_${sanitize(bizName)}_${Date.now()}.${ext}`;
}

export default function OtherBusinessReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useConfirmModal();
  const receiptCardRef = useRef<View>(null);
  const adBannerCardRef = useRef<View>(null);
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
    cardBrand?: string;
    dateStr?: string;
    abn?: string;
    phone?: string;
  }>();

  const rawAmount = params.amount || '0.00';
  const numericAmount = parseFloat(rawAmount) || 0;
  const method = (params.method || 'tap').toLowerCase();
  const isCash = method === 'cash';
  const isTap = method === 'tap';

  const cardBrand = isCash
    ? 'Cash'
    : (params.cardBrand || (isTap ? 'Contactless' : 'Visa')).trim();
  const cardLast4 = isCash ? '' : (params.cardLast4 || '••••');
  const paymentId = params.paymentId || (isCash ? 'CASH-PAYMENT' : '--');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(() =>
    receiptService.getCachedReceipt(params.paymentId)
  );

  useEffect(() => {
    if (params.paymentId && params.paymentId !== '--' && params.paymentId !== 'CASH-PAYMENT' && !receiptData) {
      let isMounted = true;
      receiptService
        .getReceipt(params.paymentId)
        .then((data) => {
          if (isMounted) setReceiptData(data);
        })
        .catch(() => { });
      return () => {
        isMounted = false;
      };
    }
  }, [params.paymentId, receiptData]);

  const dateStr =
    (params.dateStr && params.dateStr.trim() !== '' && params.dateStr !== '--'
      ? params.dateStr
      : null) || formatSydneyToUserDateTime(new Date());

  const cachedHeader = getCachedDashboardHeader();
  const cachedUser = tokenStorage.getCachedUser();

  const [extraHeader, setExtraHeader] = useState<{ abn?: string; phone?: string }>({
    abn:
      (params.abn && params.abn !== '--' ? params.abn : undefined) ||
      user?.abn ||
      cachedHeader?.abn ||
      cachedUser?.abn,
    phone:
      (params.phone && params.phone !== '--' ? params.phone : undefined) ||
      user?.phone ||
      cachedHeader?.phone ||
      cachedUser?.phone,
  });

  useEffect(() => {
    const unsub = onDashboardHeaderSync((h) => {
      if (h.abn || h.phone) {
        setExtraHeader((prev) => ({
          abn: h.abn || prev.abn,
          phone: h.phone || prev.phone,
        }));
      }
    });

    dashboardService
      .getDashboard()
      .then((res) => {
        if (res?.data?.header) {
          setExtraHeader((prev) => ({
            abn: res.data.header.abn || prev.abn,
            phone: res.data.header.phone || prev.phone,
          }));
        }
      })
      .catch(() => { });

    return () => unsub();
  }, []);

  const businessName =
    receiptData?.business_name || user?.businessName || user?.name || '--';
  const logoUrl = normalizeImageUrl(
    receiptData?.business_logo || user?.logoUrl || cachedHeader?.logo_url
  );
  const address =
    receiptData?.address || user?.businessAddress || '--';
  const empId =
    receiptData?.employee_id || user?.empId || '--';

  const hasAdBanner = Boolean(receiptData?.ad_banner && receiptData?.banner_image_url);
  const bannerImageUrl = normalizeImageUrl(receiptData?.banner_image_url);

  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);

  const isLogoValid = Boolean(logoUrl) && failedLogoUrl !== logoUrl;

  const effectiveNumericAmount =
    receiptData?.amount !== undefined && receiptData?.amount !== null
      ? receiptData.amount
      : numericAmount;

  const abn =
    receiptData?.abn ||
    (params.abn && params.abn.trim() !== '' && params.abn !== '--' ? params.abn : null) ||
    extraHeader.abn ||
    user?.abn ||
    cachedHeader?.abn ||
    cachedUser?.abn ||
    '--';

  const phone =
    receiptData?.phone_no ||
    (params.phone && params.phone.trim() !== '' && params.phone !== '--' ? params.phone : null) ||
    extraHeader.phone ||
    user?.phone ||
    cachedHeader?.phone ||
    cachedUser?.phone ||
    '--';

  const cardBrandFinal =
    receiptData?.card_brand || cardBrand;

  const paymentMethodLabel =
    receiptData?.payment_method || (isCash ? 'Cash Payment' : `${cardBrandFinal} •••• ${cardLast4}`);

  const paymentMethodBadgeLabel =
    receiptData?.payment_type || receiptData?.payment_method_badge || (isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card');

  const effectiveDateStr =
    receiptData?.date_time ? formatSydneyToUserDateTime(receiptData.date_time) : dateStr;

  // Amount formatting: integer and decimal parts
  const formattedWithComma = Math.floor(effectiveNumericAmount).toLocaleString('en-US');
  const decimalPart = effectiveNumericAmount.toFixed(2).split('.')[1] || '00';

  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Generate HTML for full-page PDF document
  const generateReceiptHtml = async (isPhotoCard = false) => {
    const effectiveLogo = logoUrl;
    const sePayLogoUri = await getAssetDataUri(
      require('../../../../assets/SE-pay-logo-gif.gif'),
      'image/gif'
    );

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${businessName}</title>
  <style>
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 8mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }
    .page-container {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
      height: 100vh;
      max-height: 278mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      box-sizing: border-box;
    }
    .receipt-card, .receipt-card-70 {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
      background: #FFFDF7;
      border: 1.5px solid #FEF08A;
      border-radius: 20px;
      padding: 16px 20px 14px;
      text-align: center;
      box-sizing: border-box;
    }
    .receipt-card-70 {
      height: 68%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      margin: 0 auto;
    }
    .logo-badge {
      width: 46px;
      height: 46px;
      background: #FEF9C3;
      border: 1.2px solid #FDE047;
      border-radius: 12px;
      margin: 0 auto 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 4px;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .biz-name {
      font-size: 16.5px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 2px;
      letter-spacing: -0.2px;
    }
    .biz-meta {
      font-size: 10.5px;
      color: #64748B;
      font-weight: 600;
      margin-bottom: 1px;
      line-height: 1.4;
    }
    .biz-address {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 500;
      margin-bottom: 1px;
    }
    .emp-id {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 500;
      margin-bottom: 0;
    }
    .emp-id span {
      color: #0F172A;
      font-weight: 700;
    }
    .total-paid-label {
      font-size: 10px;
      color: #64748B;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin-top: 10px;
      margin-bottom: 2px;
    }
    .amount {
      font-size: 34px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin: 0 0 4px;
      display: flex;
      align-items: baseline;
      justify-content: center;
    }
    .dollar {
      color: #D97706;
      font-weight: 800;
      font-size: 22px;
      margin-right: 2px;
    }
    .decimal {
      font-size: 20px;
      color: #475569;
      font-weight: 700;
    }
    .paid-badge {
      display: inline-flex;
      align-items: center;
      background: #DCFCE7;
      border: 1px solid #A7F3D0;
      color: #166534;
      font-size: 10.5px;
      font-weight: 800;
      padding: 2.5px 12px;
      border-radius: 10px;
      letter-spacing: 0.6px;
      gap: 5px;
      margin: 4px auto 2px;
    }
    .paid-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
    }
    .divider {
      height: 1px;
      background-color: #F1F5F9;
      margin: 10px 0;
      width: 100%;
    }
    .meta-list {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 2px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-label {
      font-size: 10.5px;
      color: #94A3B8;
      font-weight: 500;
    }
    .meta-value {
      font-size: 12.5px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 1px;
    }
    .pill-card {
      background: #FFFBEB;
      border: 1px solid #FEF08A;
      color: #B45309;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .pill-cash-tag {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #059669;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .pill-visa {
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      color: #1D4ED8;
      font-size: 11px;
      font-style: italic;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pill-mastercard {
      background: #FFF1F2;
      border: 1px solid #FECDD3;
      color: #E11D48;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .pill-cash {
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      color: #059669;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #F1F5F9;
      text-align: center;
    }
    .thank-you {
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0 0 2px;
      color: #0F172A;
    }
    .powered-by {
      font-size: 8.5px;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 1.2px;
      margin: 0 0 4px;
    }
    .se-pay-gif-logo {
      display: block;
      margin: 0 auto;
      width: 105px;
      height: auto;
      object-fit: contain;
    }
    .ad-banner-30 {
      height: 29%;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      border-radius: 18px;
      padding: 8px 12px 10px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .ad-tag-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .ad-tag {
      font-size: 8.5px;
      font-weight: 800;
      color: #94A3B8;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .ad-provider {
      font-size: 8.5px;
      font-weight: 700;
      color: #D97706;
      letter-spacing: 0.5px;
    }
    .ad-img-box {
      flex: 1;
      width: 100%;
      height: calc(100% - 16px);
      border-radius: 12px;
      overflow: hidden;
      background: #0F172A;
    }
    .ad-img-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  </style>
</head>
<body>
  ${hasAdBanner && bannerImageUrl ? `
  <div class="page-container">
    <div class="receipt-card-70">
      <div class="logo-badge">
        ${effectiveLogo
          ? `<img src="${effectiveLogo}" alt="Business Logo" />`
          : `<div style="font-size: 26px; line-height: 46px; text-align: center;">🏢</div>`
        }
      </div>
      <div class="biz-name">${businessName}</div>
      <div class="biz-meta">ABN: ${abn} • PH: ${phone}</div>
      <div class="biz-address">${address}</div>
      <div class="emp-id">EMP ID: <span>${empId}</span></div>

      <div class="total-paid-label">TOTAL PAID (INC GST)</div>
      <div class="amount"><span class="dollar">$ </span>${formattedWithComma}<span class="decimal">.${decimalPart}</span></div>
      <div>
        <span class="paid-badge"><span class="paid-dot"></span>PAID</span>
      </div>

      <div class="divider"></div>

      <div class="meta-list">
        <div class="meta-row">
          <div>
            <div class="meta-label">Date & Time</div>
            <div class="meta-value">${effectiveDateStr}</div>
          </div>
          <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">
            ${isCash ? '💵 Cash' : isTap ? '✦ Tap & Go' : '💳 Card'}
          </div>
        </div>

        <div class="meta-row">
          <div>
            <div class="meta-label">Payment Method</div>
            <div class="meta-value">${paymentMethodLabel}</div>
          </div>
          <div class="${isCash ? 'pill-cash' : cardBrandFinal.toUpperCase() === 'MASTERCARD' ? 'pill-mastercard' : 'pill-visa'}">
            ${isCash ? 'CASH' : (cardBrandFinal.toUpperCase() || 'VISA')}
          </div>
        </div>

        <div class="meta-row">
          <div>
            <div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div>
            <div class="meta-value">${paymentId}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="thank-you">THANK YOU FOR CHOOSING ${businessName.toUpperCase()}</div>
        <div class="powered-by">POWERED BY</div>
        ${sePayLogoUri
          ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />`
          : `<div style="font-weight: 800; font-size: 13px; color: #0F172A; letter-spacing: 1px; margin-top: 4px;">SE PAY</div>`
        }
      </div>
    </div>

    <!-- Bottom 30%: Advertisement Banner -->
    <div class="ad-banner-30">
      <div class="ad-tag-row">
        <span class="ad-tag">SPONSORED ADVERTISEMENT</span>
        <span class="ad-provider">SE PAY SPECIAL OFFER</span>
      </div>
      <div class="ad-img-box">
        <img src="${bannerImageUrl}" alt="Special Promotion" />
      </div>
    </div>
  </div>
  ` : `
  <div class="receipt-card">
    <div class="logo-badge">
      ${effectiveLogo
        ? `<img src="${effectiveLogo}" alt="Business Logo" />`
        : `<div style="font-size: 26px; line-height: 46px; text-align: center;">🏢</div>`
      }
    </div>
    <div class="biz-name">${businessName}</div>
    <div class="biz-meta">ABN: ${abn} • PH: ${phone}</div>
    <div class="biz-address">${address}</div>
    <div class="emp-id">EMP ID: <span>${empId}</span></div>

    <div class="total-paid-label">TOTAL PAID (INC GST)</div>
    <div class="amount"><span class="dollar">$ </span>${formattedWithComma}<span class="decimal">.${decimalPart}</span></div>
    <div>
      <span class="paid-badge"><span class="paid-dot"></span>PAID</span>
    </div>

    <div class="divider"></div>

    <div class="meta-list">
      <div class="meta-row">
        <div>
          <div class="meta-label">Date & Time</div>
          <div class="meta-value">${effectiveDateStr}</div>
        </div>
        <div class="${isCash ? 'pill-cash-tag' : 'pill-card'}">
          ${isCash ? '💵 Cash' : isTap ? '✦ Tap & Go' : '💳 Card'}
        </div>
      </div>

      <div class="meta-row">
        <div>
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">
            ${paymentMethodLabel}
          </div>
        </div>
        <div class="${isCash ? 'pill-cash' : cardBrandFinal.toUpperCase() === 'MASTERCARD' ? 'pill-mastercard' : 'pill-visa'}">
          ${isCash ? 'CASH' : (cardBrandFinal.toUpperCase() || 'VISA')}
        </div>
      </div>

      <div class="meta-row">
        <div>
          <div class="meta-label">${isCash ? 'Receipt ID' : 'Payment ID'}</div>
          <div class="meta-value">${paymentId}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">THANK YOU FOR CHOOSING ${businessName.toUpperCase()}</div>
      <div class="powered-by">POWERED BY</div>
      ${sePayLogoUri
        ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />`
        : `<div style="font-weight: 800; font-size: 13px; color: #0F172A; letter-spacing: 1px; margin-top: 4px;">SE PAY</div>`
      }
    </div>
  </div>
  `}
</body>
</html>
    `;
  };

  // Open the Selection Modal (Photo or PDF)
  const handleOpenShareMenu = () => {
    setIsShareModalVisible(true);
  };

  // 1. Share as Lossless High-Resolution PNG Image (100% Crisp Quality)
  const handleSharePhoto = async () => {
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      if (!receiptCardRef.current) {
        throw new Error('Receipt view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const base64Image = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const filename = getExportFilename('Receipt_Card', businessName, 'png');
      const targetUri = `${baseDir}${filename}`;

      await FileSystem.writeAsStringAsync(targetUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/png',
              dialogTitle: `Share Receipt Image - ${businessName}`,
              UTI: 'public.png',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (image) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const shareMsg = `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nMethod: ${isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card'}\nDate: ${dateStr}\n${isCash ? 'Receipt ID' : 'Payment ID'}: ${paymentId}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
            title: `Receipt Image - ${businessName}`,
            message: shareMsg,
            url: targetUri,
          }
          : {
            title: `Receipt Image - ${businessName}`,
            message: shareMsg,
          }
      );
    } catch (error) {
      console.error('Error sharing receipt image:', error);
      showAlert({
        title: 'Share Receipt',
        message: 'Could not generate receipt image. Please try sharing as PDF.',
        type: 'danger',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Share as Animated Card (GIF: 4.0s Receipt + 4.0s Ad Banner)
  const handleShareAnimatedGif = async () => {
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      if (!receiptCardRef.current || !adBannerCardRef.current) {
        throw new Error('Receipt or Ad view is not ready');
      }

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (bannerImageUrl) {
        try {
          await Image.prefetch(bannerImageUrl);
        } catch (e) {
          console.warn('Ad banner prefetch error:', e);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const receiptBase64 = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const adBase64 = await captureRef(adBannerCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const filename = getExportFilename('Animated_Receipt', businessName, 'gif');
      const targetUri = `${baseDir}${filename}`;

      // Configured timing: 4.0s for Receipt, 4.0s for Advertisement Banner
      await animatedGifService.createAndSaveAnimatedGif(targetUri, {
        receiptBase64Png: receiptBase64,
        adBannerBase64Png: adBase64,
        receiptDelaySec: 4.0, // <-- RECEIPT TIMER: 4.0s
        adDelaySec: 4.0,      // <-- AD BANNER TIMER: 4.0s
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            await Sharing.shareAsync(targetUri, {
              mimeType: 'image/gif',
              dialogTitle: `Share Animated Receipt - ${businessName}`,
              UTI: 'com.compuserve.gif',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (gif) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const shareMsg = `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nMethod: ${isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card'}\nDate: ${dateStr}\n${isCash ? 'Receipt ID' : 'Payment ID'}: ${paymentId}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
            title: `Animated Receipt - ${businessName}`,
            message: shareMsg,
            url: targetUri,
          }
          : {
            title: `Animated Receipt - ${businessName}`,
            message: shareMsg,
          }
      );
    } catch (error) {
      console.error('Error sharing animated receipt:', error);
      showAlert({
        title: 'Share Receipt',
        message: 'Could not generate animated receipt. Please try sharing as Image or PDF.',
        type: 'danger',
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 2. Share as PDF Document
  const handleSharePdf = async () => {
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      const html = await generateReceiptHtml(false);
      // Ask Print module for base64 directly to avoid unreadable cache/Print file permissions in Expo Go
      const { uri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const filename = getExportFilename('Receipt', businessName, 'pdf');
      const targetUri = `${baseDir}${filename}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (uri) {
        try {
          await FileSystem.copyAsync({ from: uri, to: targetUri });
        } catch (copyErr) {
          console.warn('Direct copy failed, reading as base64 instead:', copyErr);
          try {
            const fileBase64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await FileSystem.writeAsStringAsync(targetUri, fileBase64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch (readErr) {
            console.warn('Could not read original file as base64:', readErr);
          }
        }
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(targetUri);
          if (fileInfo.exists) {
            await Sharing.shareAsync(targetUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share Receipt PDF - ${businessName}`,
              UTI: 'com.adobe.pdf',
            });
            return;
          }
        } catch (shareAsyncErr) {
          console.warn('Sharing.shareAsync (pdf) failed, falling back to Share.share:', shareAsyncErr);
        }
      }

      const shareMsg = `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nMethod: ${isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card'}\nDate: ${dateStr}\n${isCash ? 'Receipt ID' : 'Payment ID'}: ${paymentId}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
            title: `Receipt - ${businessName}`,
            message: shareMsg,
            url: targetUri,
          }
          : {
            title: `Receipt - ${businessName}`,
            message: shareMsg,
          }
      );
    } catch (error) {
      console.error('Error sharing receipt PDF:', error);
      try {
        const shareMsg = `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nMethod: ${isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card'}\nDate: ${dateStr}\n${isCash ? 'Receipt ID' : 'Payment ID'}: ${paymentId}`;
        await Share.share({
          title: `Receipt - ${businessName}`,
          message: shareMsg,
        });
      } catch {
        showAlert({
          title: 'Share Receipt',
          message: 'Could not open share menu. Please try again.',
          type: 'danger',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Open system printer dialogue
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const html = await generateReceiptHtml(false);
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyPaymentId = () => {
    showAlert({
      title: 'Payment ID',
      message: `${paymentId}\nCopied to clipboard.`,
      type: 'info',
      icon: 'information-circle-outline',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HIDDEN AD BANNER CARD FOR ANIMATED GIF CAPTURE (100% OPAQUE BEHIND SCREEN) ── */}
      {hasAdBanner && bannerImageUrl && (
        <View style={styles.hiddenAdCaptureContainer} pointerEvents="none" collapsable={false}>
          <View ref={adBannerCardRef} collapsable={false} style={styles.adBannerCard}>
            <View style={styles.adCardHeader}>
              <View style={styles.adSponsoredPill}>
                <Ionicons name="sparkles" size={11} color="#92400E" style={{ marginRight: 4 }} />
                <Text style={styles.adSponsoredPillText}>SPONSORED ADVERTISEMENT</Text>
              </View>
              <Text style={styles.adBrandLogoText}>SE PAY</Text>
            </View>

            <View style={styles.adCardImageWrap}>
              <Image
                source={{ uri: bannerImageUrl }}
                style={styles.adCardImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.adCardFooter}>
              <Text style={styles.adCardFooterThank}>THANK YOU FOR CHOOSING {businessName.toUpperCase()}</Text>
              <Text style={styles.adCardFooterPowered}>POWERED BY SE PAY</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Top Header ── */}
      <HeaderBar
        title="Receipt"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleOpenShareMenu}
            activeOpacity={0.6}
            disabled={isSharing}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Ionicons name="share-outline" size={22} color="#0F172A" />
            )}
          </TouchableOpacity>
        }
      />

      <View
        style={[
          styles.root,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Main Receipt Card (Exact Match with Uploaded Image) ── */}
          <View
            ref={receiptCardRef}
            collapsable={false}
            style={styles.receiptCard}
          >
            {/* Top Avatar Logo Box */}
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoBox}>
                {isLogoValid ? (
                  <Image
                    source={{ uri: logoUrl! }}
                    style={styles.logoImage}
                    resizeMode="contain"
                    onError={() => setFailedLogoUrl(logoUrl)}
                  />
                ) : (
                  <Feather name="briefcase" size={24} color="#D97706" />
                )}
              </View>
            </View>

            {/* Business Info Header */}
            <Text style={styles.bizName}>{businessName}</Text>
            <Text style={styles.bizMeta}>
              ABN: {abn} • PH: {phone}
            </Text>
            <Text style={styles.bizAddress}>{address}</Text>
            <Text style={styles.empIdText}>
              EMP ID: <Text style={styles.empIdBold}>{empId}</Text>
            </Text>

            {/* Amount and PAID Pill Badge */}
            <View style={styles.amountSection}>
              <Text style={styles.totalPaidLabel}>TOTAL PAID (INC GST)</Text>

              <View style={styles.amountWrap}>
                <Text style={styles.dollarSign}>$ </Text>
                <Text style={styles.amountInt}>{formattedWithComma}</Text>
                <Text style={styles.amountDec}>.{decimalPart}</Text>
              </View>

              <View style={styles.paidBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.paidText}>PAID</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* ── Meta Information Rows ── */}
            <View style={styles.metaList}>
              {/* Row 1: Date & Time */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Date & Time</Text>
                  <Text style={styles.metaValue}>{effectiveDateStr}</Text>
                </View>
                <View style={[styles.methodCapsule, isCash && styles.cashMethodCapsule]}>
                  <Ionicons
                    name={isCash ? 'cash-outline' : isTap ? 'sparkles' : 'card'}
                    size={11}
                    color={isCash ? '#059669' : '#B45309'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.methodCapsuleText, isCash && styles.cashMethodCapsuleText]}>
                    {paymentMethodBadgeLabel}
                  </Text>
                </View>
              </View>

              {/* Row 2: Payment Method */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Payment Method</Text>
                  <Text style={styles.metaValue}>
                    {paymentMethodLabel}
                  </Text>
                </View>
                {isCash ? (
                  <View style={styles.cashPill}>
                    <Text style={styles.cashPillText}>CASH</Text>
                  </View>
                ) : isTap && cardBrandFinal === 'Contactless' ? (
                  <View style={styles.tapPill}>
                    <Text style={styles.tapPillText}>TAP & GO</Text>
                  </View>
                ) : cardBrandFinal.toUpperCase() === 'MASTERCARD' ? (
                  <View style={styles.mastercardPill}>
                    <Text style={styles.mastercardPillText}>MASTERCARD</Text>
                  </View>
                ) : (
                  <View style={styles.visaPill}>
                    <Text style={styles.visaPillText}>{cardBrandFinal.toUpperCase() || 'VISA'}</Text>
                  </View>
                )}
              </View>

              {/* Row 3: Payment ID */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>{isCash ? 'Receipt ID' : 'Payment ID'}</Text>
                  <Text style={styles.metaValue}>{paymentId}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyPaymentId}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Footer Inside Card ── */}
            <View style={styles.receiptFooter}>
              <Text style={styles.thankYouText}>
                THANK YOU FOR CHOOSING {businessName.toUpperCase()}
              </Text>
              <Text style={styles.poweredByText}>POWERED BY</Text>

              <Image
                source={require('../../../../assets/SE-pay-logo-gif.gif')}
                style={styles.sePayLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── Bottom Action Buttons ── */}
          <View style={styles.actions}>
            {/* 1. Print Digital Receipt (Golden Button) */}
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
              disabled={isPrinting}
              activeOpacity={0.85}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#0F172A" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="print-outline" size={17} color="#0F172A" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.printBtnText} numberOfLines={1} adjustsFontSizeToFit>
                Print Digital Receipt
              </Text>
            </TouchableOpacity>

            {/* 2. Share Digital Receipt Via (White Card Button) */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleOpenShareMenu}
              disabled={isSharing}
              activeOpacity={0.8}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="share-outline" size={17} color="#2563EB" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.shareBtnText} numberOfLines={1} adjustsFontSizeToFit>
                Share Digital Receipt
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* ── SHARE FORMAT SELECTION MODAL (Photo Card or PDF) ── */}
      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsShareModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsShareModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => { }}>
              <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
                {/* Drag pill handle */}
                <View style={styles.modalHandle} />

                {/* Modal Title */}
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>Share Receipt</Text>
                    <Text style={styles.modalSubtitle}>Select your preferred format to share</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setIsShareModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Option 1: Lossless High-Resolution PNG Image (100% Crisp Quality) */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.75}
                  onPress={handleSharePhoto}
                >
                  <View style={[styles.modalOptionIconBox, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="image-outline" size={24} color="#D97706" />
                  </View>
                  <View style={styles.modalOptionTextWrap}>
                    <View style={styles.modalOptionTitleRow}>
                      <Text style={styles.modalOptionTitle}>
                        {hasAdBanner ? 'Share Image (PNG)' : 'Share as Image (PNG)'}
                      </Text>
                      {/* <View style={styles.gifBadge}>
                        <Text style={styles.gifBadgeText}>
                          {hasAdBanner ? 'PNG (100% HD)' : 'PNG'}
                        </Text>
                      </View> */}
                    </View>
                    {/* <Text style={styles.modalOptionDesc}>
                      Lossless, pixel-perfect digital receipt image for WhatsApp, Messages or Email
                    </Text> */}
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Option 2: Animated Card with Ad Banner (When ad_banner is true) */}
                {hasAdBanner && bannerImageUrl && (
                  <TouchableOpacity
                    style={styles.modalOptionCard}
                    activeOpacity={0.75}
                    onPress={handleShareAnimatedGif}
                  >
                    <View style={[styles.modalOptionIconBox, { backgroundColor: '#F3E8FF' }]}>
                      <Ionicons name="film-outline" size={24} color="#9333EA" />
                    </View>
                    <View style={styles.modalOptionTextWrap}>
                      <View style={styles.modalOptionTitleRow}>
                        <Text style={styles.modalOptionTitle}>Share Animated Card</Text>
                        {/* <View style={styles.gifAnimBadge}>
                          <Text style={styles.gifAnimBadgeText}>GIF (4s+4s)</Text>
                        </View> */}
                      </View>
                      {/* <Text style={styles.modalOptionDesc}>
                        Animated loop cycling 4s digital receipt and 4s advertisement banner
                      </Text> */}
                    </View>
                    <Feather name="chevron-right" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}

                {/* Option 3: PDF Document */}
                <TouchableOpacity
                  style={styles.modalOptionCard}
                  activeOpacity={0.75}
                  onPress={handleSharePdf}
                >
                  <View style={[styles.modalOptionIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="document-text-outline" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.modalOptionTextWrap}>
                    <View style={styles.modalOptionTitleRow}>
                      <Text style={styles.modalOptionTitle}>Share as PDF Document</Text>
                      {/* <View style={hasAdBanner ? styles.pdfSplitBadge : styles.pdfBadge}>
                        <Text style={hasAdBanner ? styles.pdfSplitBadgeText : styles.pdfBadgeText}>
                          {hasAdBanner ? '1-PAGE (70/30)' : 'PDF'}
                        </Text>
                      </View> */}
                    </View>
                    {/* <Text style={styles.modalOptionDesc}>
                      {hasAdBanner
                        ? 'Single-page document with 70% receipt and 30% sponsored advertisement'
                        : 'Printable digital PDF document with full transaction breakdown'}
                    </Text> */}
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsShareModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  root: {
    flex: 1,
  },
  headerBtn: {
    padding: 6,
    marginRight: 4,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  /* ── Main Receipt Card ── */
  receiptCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },

  /* Logo Badge */
  logoBadgeContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  /* Business Info */
  bizName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  bizMeta: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 1,
  },
  bizAddress: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 1,
  },
  empIdText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
  },
  empIdBold: {
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Amount Section */
  amountSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  totalPaidLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#64748B',
    marginBottom: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  dollarSign: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 2,
  },
  amountInt: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountDec: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  paidText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.6,
  },

  /* Card Divider */
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
    width: '100%',
  },

  /* Meta Information Rows */
  metaList: {
    gap: 8,
    paddingHorizontal: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  methodCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodCapsuleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  cashMethodCapsule: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cashMethodCapsuleText: {
    color: '#059669',
  },
  cashPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  cashPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  tapPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  tapPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  mastercardPill: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  mastercardPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
  },
  visaPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  visaPillText: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '800',
    color: '#1D4ED8',
  },

  /* Card Footer */
  receiptFooter: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thankYouText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  poweredByText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 4,
  },
  sePayLogo: {
    width: 105,
    height: 24,
  },

  /* ── Action Buttons ── */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  printBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  shareBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* ── Share Modal Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  modalOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  modalOptionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalOptionTextWrap: {
    flex: 1,
    marginRight: 6,
  },
  modalOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 8,
  },
  modalOptionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  gifBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  gifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  gifAnimBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  gifAnimBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  pdfBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pdfBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  pdfSplitBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  pdfSplitBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  hiddenAdCaptureContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
    opacity: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  adBannerCard: {
    width: 350,
    height: 560,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adCardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adSponsoredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  adSponsoredPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  adBrandLogoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1.2,
  },
  adCardImageWrap: {
    width: '100%',
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  adCardImage: {
    width: '100%',
    height: '100%',
  },
  adCardFooter: {
    alignItems: 'center',
    gap: 2,
  },
  adCardFooterThank: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  adCardFooterPowered: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  modalOptionDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  modalCancelBtn: {
    marginTop: 8,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});

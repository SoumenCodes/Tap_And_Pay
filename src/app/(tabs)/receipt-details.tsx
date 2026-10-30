import React, { useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { captureRef } from 'react-native-view-shot';
import { useAuth } from '../../context/AuthContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import HeaderBar from '../../components/common/HeaderBar';
import { OtherBusinessReceiptScreen } from '../../components/other-business';
import { getAssetDataUri } from '../../utils/assetUtils';

function TaxiReceiptScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useConfirmModal();
  const receiptCardRef = useRef<View>(null);

  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
    pickup?: string;
    dropoff?: string;
    taxiNumber?: string;
    dcNumber?: string;
    abn?: string;
    phone?: string;
    dateStr?: string;
    timestamp?: string;
  }>();

  const rawAmount = params.amount || '0.00';
  const numericAmount = parseFloat(rawAmount) || 0;
  const isTap = params.method === 'tap';
  const cardLast4 = params.cardLast4 || '••••';
  const paymentId = params.paymentId || '--';
  const pickup = params.pickup || '--';
  const dropoff = params.dropoff || '--';
  const taxiNumber = params.taxiNumber || user?.taxiNumber || '--';
  const dcNumber = params.dcNumber || (user as any)?.dcNumber || '--';
  const abn = params.abn || user?.abn || (user as any)?.abn || '--';
  const phone = params.phone || user?.phone || (user as any)?.phone || (user as any)?.mobileNumber || '--';
  const businessName = user?.businessName || user?.name || '--';

  const formattedDate = useMemo(() => {
    if (params.dateStr) return params.dateStr;
    const d = params.timestamp ? new Date(params.timestamp) : new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, '0');
    return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
  }, [params.timestamp, params.dateStr]);

  // Amount formatting: integer and decimal parts
  const formattedWithComma =
    numericAmount >= 10000
      ? Math.floor(numericAmount).toLocaleString('en-US')
      : Math.floor(numericAmount).toString();
  const decimalPart = (numericAmount % 1).toFixed(2).split('.')[1] || '00';

  const [isSharing, setIsSharing] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate HTML for printing or sharing as PDF/Photo card
  const generateReceiptHtml = async (isPhotoCard = false) => {
    const taxiLogoUri = await getAssetDataUri(
      require('../../../assets/taxi-logo.png'),
      'image/png'
    );
    const sePayLogoUri = await getAssetDataUri(
      require('../../../assets/SE-pay-logo-gif.gif'),
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
      margin: 12mm 16mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #FFFFFF;
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
    }
    .receipt-card {
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      background: #FFFDF7;
      border: 2px solid #FEF08A;
      border-radius: 28px;
      padding: 36px 36px 40px;
      text-align: center;
      box-sizing: border-box;
    }
    .logo-badge {
      width: 76px;
      height: 76px;
      background: #FEF9C3;
      border: 1.5px solid #FDE047;
      border-radius: 20px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 8px;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .biz-name {
      font-size: 26px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 6px;
      letter-spacing: -0.3px;
    }
    .biz-meta {
      font-size: 14px;
      color: #64748B;
      font-weight: 600;
      margin-bottom: 5px;
      line-height: 1.4;
    }
    .total-paid-label {
      font-size: 13px;
      color: #64748B;
      font-weight: 700;
      letter-spacing: 1px;
      margin-top: 24px;
      margin-bottom: 6px;
    }
    .amount {
      font-size: 58px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin: 0 0 12px;
      display: flex;
      align-items: baseline;
      justify-content: center;
    }
    .dollar {
      color: #D97706;
      font-size: 38px;
      font-weight: 800;
      margin-right: 4px;
    }
    .decimal {
      font-size: 34px;
      color: #475569;
      font-weight: 700;
    }
    .paid-badge {
      display: inline-flex;
      align-items: center;
      background: #ECFDF5;
      color: #059669;
      padding: 6px 18px;
      border-radius: 18px;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.8px;
      gap: 7px;
      margin-bottom: 24px;
    }
    .paid-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
    }
    .divider {
      height: 1.5px;
      background-color: #F1F5F9;
      margin: 24px 0;
      width: 100%;
    }
    .route-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      padding: 8px 0;
    }
    .route-col {
      flex: 1;
    }
    .route-col.right {
      text-align: right;
    }
    .route-label {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #94A3B8;
      margin-bottom: 4px;
    }
    .route-val {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
    }
    .arrow {
      color: #F59E0B;
      font-size: 24px;
      font-weight: bold;
      padding: 0 18px;
    }
    .meta-list {
      text-align: left;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      font-size: 14px;
      color: #94A3B8;
      font-weight: 600;
    }
    .meta-value {
      font-size: 16.5px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 3px;
    }
    .pill-card {
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      color: #2563EB;
      font-size: 13px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 8px;
    }
    .pill-visa {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      font-size: 14px;
      font-style: italic;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 6px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1.5px solid #F1F5F9;
      text-align: center;
    }
    .thank-you {
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: 0.8px;
      margin: 0 0 6px;
      color: #0F172A;
    }
    .powered-by {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 1.2px;
      margin: 0 0 10px;
    }
    .se-pay-gif-logo {
      display: block;
      margin: 0 auto;
      width: 140px;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="logo-badge">
      ${
        taxiLogoUri
          ? `<img src="${taxiLogoUri}" alt="Taxi" />`
          : `<div style="font-size: 26px; line-height: 52px; text-align: center;">🚕</div>`
      }
    </div>
    <div class="biz-name">${businessName}</div>
    <div class="biz-meta">ABN: ${abn} • PH: ${phone}</div>
    <div class="biz-meta">TAXI NO.: ${taxiNumber} &nbsp;&nbsp; DC: ${dcNumber}</div>

    <div class="total-paid-label">TOTAL PAID (INC GST)</div>
    <div class="amount"><span class="dollar">$</span>${formattedWithComma}<span class="decimal">.${decimalPart}</span></div>
    <div>
      <span class="paid-badge"><span class="paid-dot"></span>PAID</span>
    </div>

    <div class="divider"></div>

    <div class="route-row">
      <div class="route-col">
        <div class="route-label">PICKUP</div>
        <div class="route-val">${pickup}</div>
      </div>
      <div class="arrow">→</div>
      <div class="route-col right">
        <div class="route-label">DROP OFF</div>
        <div class="route-val">${dropoff}</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="meta-list">
      <div class="meta-row">
        <div>
          <div class="meta-label">Date & Time</div>
          <div class="meta-value">${formattedDate}</div>
        </div>
        <div class="pill-card">${isTap ? '⚡ Tap & Go' : '💳 Card'}</div>
      </div>

      <div class="meta-row">
        <div>
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">Visa •••• ${cardLast4}</div>
        </div>
        <div class="pill-visa">VISA</div>
      </div>

      <div class="meta-row">
        <div>
          <div class="meta-label">Payment ID</div>
          <div class="meta-value">${paymentId}</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="thank-you">THANK YOU FOR CHOOSING TAXI ${taxiNumber}</div>
      <div class="powered-by">POWERED BY</div>
      ${
        sePayLogoUri
          ? `<img class="se-pay-gif-logo" src="${sePayLogoUri}" alt="SE PAY" />`
          : `<div style="font-weight: 800; font-size: 13px; color: #0F172A; letter-spacing: 1px; margin-top: 4px;">SE PAY</div>`
      }
    </div>
  </div>
</body>
</html>
    `;
  };

  // Open the Selection Modal (Photo or PDF)
  const handleOpenShareMenu = () => {
    setIsShareModalVisible(true);
  };

  // 1. Share as High-Resolution PNG Image
  const handleSharePhoto = async () => {
    setIsShareModalVisible(false);
    try {
      setIsSharing(true);

      if (!receiptCardRef.current) {
        throw new Error('Receipt view is not ready');
      }

      // Capture exact rendered card to base64 and write into sandboxed document directory
      const base64Image = await captureRef(receiptCardRef, {
        format: 'png',
        quality: 1.0,
        result: 'base64',
      });

      const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Receipt_Card_${sanitize(businessName)}_${Date.now()}.png`;
      const targetUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(targetUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'image/png',
          dialogTitle: `Share Receipt Image - ${businessName}`,
          UTI: 'public.png',
        });
      } else {
        await Share.share({
          title: `Receipt Image - ${businessName}`,
          message: `Digital Receipt: ${businessName}\nTaxi: ${taxiNumber}\nRoute: ${pickup} to ${dropoff}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: ${formattedDate}\nPayment ID: ${paymentId}`,
          url: targetUri,
        });
      }
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

      const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Receipt_${sanitize(businessName)}_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.documentDirectory}${filename}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: uri, to: targetUri });
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Receipt PDF - ${businessName}`,
          UTI: '.pdf',
        });
      } else {
        await Share.share({
          title: `Receipt - ${businessName}`,
          message: `Taxi Receipt: ${businessName}\nTaxi: ${taxiNumber}\nRoute: ${pickup} to ${dropoff}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: ${formattedDate}\nPayment ID: ${paymentId}`,
          url: targetUri,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt PDF:', error);
      showAlert({
        title: 'Share Receipt',
        message: 'Could not open share menu. Please try again.',
        type: 'danger',
      });
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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <HeaderBar
        title="Receipt"
        showBack
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
          {/* ── Main Receipt Card (Exact Image Match) ── */}
          <View
            ref={receiptCardRef}
            collapsable={false}
            style={styles.receiptCard}
          >
            {/* Top Avatar Logo Box */}
            <View style={styles.badgeWrap}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../assets/taxi-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Business Info Header */}
            <Text style={styles.bizName}>{businessName}</Text>
            <Text style={styles.bizMeta}>
              ABN: {abn} • PH: {phone}
            </Text>
            <Text style={styles.bizMeta}>
              TAXI NO.: {taxiNumber}   DC: {dcNumber}
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

            {/* ── Route Section (PICKUP -> DROP OFF) ── */}
            <View style={styles.routeSection}>
              <View style={styles.routeColLeft}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeValue}>{pickup}</Text>
              </View>

              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={18} color="#F59E0B" />
              </View>

              <View style={styles.routeColRight}>
                <Text style={[styles.routeLabel, { textAlign: 'right' }]}>DROP OFF</Text>
                <Text style={[styles.routeValue, { textAlign: 'right' }]}>{dropoff}</Text>
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
                  <Text style={styles.metaValue}>21 Sep 2026, 09:41 AM</Text>
                </View>
                <View style={styles.methodCapsule}>
                  <Ionicons
                    name={isTap ? 'flash' : 'card'}
                    size={12}
                    color="#2563EB"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.methodCapsuleText}>{isTap ? 'Tap & Go' : 'Card'}</Text>
                </View>
              </View>

              {/* Row 2: Payment Method */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Payment Method</Text>
                  <Text style={styles.metaValue}>Visa •••• {cardLast4}</Text>
                </View>
                <View style={styles.visaPill}>
                  <Text style={styles.visaPillText}>VISA</Text>
                </View>
              </View>

              {/* Row 3: Payment ID */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Payment ID</Text>
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
                THANK YOU FOR CHOOSING TAXI {taxiNumber}
              </Text>
              <Text style={styles.poweredByText}>POWERED BY</Text>

              <Image
                source={require('../../../assets/SE-pay-logo-gif.gif')}
                style={styles.sePayLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── Bottom Action Buttons ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
              disabled={isPrinting}
              activeOpacity={0.85}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#0F172A" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="print-outline" size={19} color="#0F172A" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.printBtnText}>Print Digital Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleOpenShareMenu}
              disabled={isSharing}
              activeOpacity={0.85}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#0A3977" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="share-outline" size={19} color="#0A3977" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.shareBtnText}>Share Digital Receipt Via</Text>
            </TouchableOpacity>
          </View>
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

                {/* Option 1: Card Photo as PNG Image */}
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
                      <Text style={styles.modalOptionTitle}>Share as Image (PNG)</Text>
                      <View style={styles.gifBadge}>
                        <Text style={styles.gifBadgeText}>PNG</Text>
                      </View>
                    </View>
                    <Text style={styles.modalOptionDesc}>
                      High-resolution PNG image of your receipt card for WhatsApp, Messages or Email
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>

                {/* Option 2: PDF Document */}
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
                      <View style={styles.pdfBadge}>
                        <Text style={styles.pdfBadgeText}>PDF</Text>
                      </View>
                    </View>
                    <Text style={styles.modalOptionDesc}>
                      Formal printable digital PDF document with full breakdown
                    </Text>
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
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  headerBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingTop: 2,
    paddingBottom: 16,
  },
  receiptCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  logoImage: {
    width: 38,
    height: 38,
  },
  bizName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  bizMeta: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    marginTop: 1,
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  totalPaidLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 2,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 2,
  },
  amountInt: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountDec: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 5,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
    width: '100%',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  routeColLeft: {
    flex: 1,
  },
  routeColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  arrowContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  routeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  metaList: {
    gap: 10,
    paddingHorizontal: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  methodCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  methodCapsuleText: {
    color: '#2563EB',
    fontSize: 9.5,
    fontWeight: '700',
  },
  visaPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  visaPillText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thankYouText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  poweredByText: {
    fontSize: 8.5,
    color: '#94A3B8',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 4,
  },
  sePayLogo: {
    height: 70,
  },
  actions: {
    gap: 10,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    height: 44,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  printBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    borderRadius: 12,
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
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

export default function ReceiptDetailsScreen() {
  const { user } = useAuth();
  const isOtherBusiness =
    user?.loginType === 'other_business' ||
    user?.loginType === 'other_business_employee';

  if (isOtherBusiness) {
    return <OtherBusinessReceiptScreen />;
  }

  return <TaxiReceiptScreen />;
}


import React, { useState, useRef } from 'react';
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
import { useAuth } from '../../../context/AuthContext';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import HeaderBar from '../../common/HeaderBar';
import { getAssetDataUri } from '../../../utils/assetUtils';

export default function OtherBusinessReceiptScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useConfirmModal();
  const receiptCardRef = useRef<View>(null);
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
    dateStr?: string;
  }>();

  const rawAmount = params.amount || '0.00';
  const numericAmount = parseFloat(rawAmount) || 0;
  const isTap = params.method === 'tap' || !params.method;
  const cardLast4 = params.cardLast4 || '••••';
  const paymentId = params.paymentId || '--';
  const dateStr = params.dateStr || '--';

  const businessName = user?.businessName || user?.name || '--';
  const abn = (user as any)?.abn || '--';
  const phone = (user as any)?.phone || (user as any)?.mobileNumber || '--';
  const address = user?.businessAddress || '--';
  const empId = user?.empId || '--';

  // Amount formatting: integer and decimal parts
  const formattedWithComma =
    numericAmount >= 10000
      ? Math.floor(numericAmount).toLocaleString('en-US')
      : Math.floor(numericAmount).toString();
  const decimalPart = (numericAmount.toFixed(2)).split('.')[1] || '00';

  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // Generate HTML for Card-sized photo or PDF document
  const generateReceiptHtml = async (isPhotoCard = false) => {
    const crownCutsBadgeUri = await getAssetDataUri(
      require('../../../../assets/crown_cuts_badge_hd.png'),
      'image/png'
    );
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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: ${isPhotoCard ? '16px' : '24px 16px'};
      background-color: ${isPhotoCard ? '#FFFFFF' : '#F8FAFC'};
      color: #0F172A;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .receipt-card {
      width: 100%;
      max-width: 380px;
      background: #FFFDF7;
      border: 1.5px solid #FEF08A;
      border-radius: 24px;
      padding: 22px 20px 24px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.12);
      text-align: center;
      box-sizing: border-box;
    }
    .logo-badge {
      width: 52px;
      height: 52px;
      background: #FEF9C3;
      border: 1px solid #FDE047;
      border-radius: 14px;
      margin: 0 auto 10px;
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
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .biz-meta {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
      margin-bottom: 3px;
    }
    .biz-address {
      font-size: 10.5px;
      color: #94A3B8;
      font-weight: 500;
      margin-bottom: 3px;
    }
    .emp-id {
      font-size: 10.5px;
      color: #94A3B8;
      font-weight: 500;
      margin-bottom: 14px;
    }
    .emp-id span {
      color: #0F172A;
      font-weight: 700;
    }
    .total-paid-label {
      font-size: 10.5px;
      color: #64748B;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .amount {
      font-size: 38px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }
    .dollar {
      color: #D97706;
      font-weight: 800;
      font-size: 26px;
    }
    .decimal {
      font-size: 22px;
      color: #64748B;
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
      padding: 3px 10px;
      border-radius: 12px;
      letter-spacing: 0.5px;
      margin-bottom: 18px;
    }
    .paid-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
      margin-right: 5px;
    }
    .divider {
      height: 1px;
      background: #F1F5F9;
      margin: 16px 0;
    }
    .meta-list {
      text-align: left;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .meta-row:last-child {
      margin-bottom: 0;
    }
    .meta-label {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 600;
    }
    .meta-value {
      font-size: 13.5px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
    }
    .pill-card {
      background: #FFFBEB;
      border: 1px solid #FEF08A;
      color: #B45309;
      font-size: 10.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .pill-visa {
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      color: #1D4ED8;
      font-size: 11px;
      font-style: italic;
      font-weight: 800;
      padding: 2.5px 8px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;
      text-align: center;
    }
    .thank-you {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
      margin: 0 0 4px;
      color: #0F172A;
    }
    .powered-by {
      font-size: 9.5px;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin: 0 0 6px;
    }
    .se-pay-gif-logo {
      display: block;
      margin: 0 auto;
      width: 105px;
      height: auto;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="logo-badge">
      ${
        crownCutsBadgeUri
          ? `<img src="${crownCutsBadgeUri}" alt="Badge" />`
          : `<div style="font-size: 26px; line-height: 52px; text-align: center;">👑</div>`
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
          <div class="meta-value">${dateStr}</div>
        </div>
        <div class="pill-card">${isTap ? '✦ Tap & Go' : '💳 Card'}</div>
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
      <div class="thank-you">THANK YOU FOR CHOOSING ${businessName.toUpperCase()}</div>
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
          message: `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: ${dateStr}\nPayment ID: ${paymentId}`,
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
          message: `Digital Receipt: ${businessName}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: ${dateStr}\nPayment ID: ${paymentId}`,
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
    <View style={styles.container}>
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
          {/* ── Main Receipt Card (Exact Match with Uploaded Image) ── */}
          <View
            ref={receiptCardRef}
            collapsable={false}
            style={styles.receiptCard}
          >
            {/* Top Avatar Logo Box */}
            <View style={styles.logoBadgeContainer}>
              <View style={styles.logoBox}>
                <Image
                  source={require('../../../../assets/crown_cuts_badge_hd.png')}
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
                  <Text style={styles.metaValue}>{dateStr}</Text>
                </View>
                <View style={styles.methodCapsule}>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color="#B45309"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.methodCapsuleText}>
                    {isTap ? 'Tap & Go' : 'Card'}
                  </Text>
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
            <TouchableWithoutFeedback onPress={() => {}}>
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
                      Printable digital PDF document with full transaction breakdown
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
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  /* Logo Badge */
  logoBadgeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },

  /* Business Info */
  bizName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  bizMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 3,
  },
  bizAddress: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 3,
  },
  empIdText: {
    fontSize: 10.5,
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
    marginTop: 18,
    marginBottom: 14,
  },
  totalPaidLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 26,
    fontWeight: '800',
    color: '#D97706',
  },
  amountInt: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountDec: {
    fontSize: 22,
    fontWeight: '700',
    color: '#64748B',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
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
    letterSpacing: 0.5,
  },

  /* Card Divider */
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },

  /* Meta Information Rows */
  metaList: {
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
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
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  poweredByText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sePayLogo: {
    width: 90,
    height: 26,
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

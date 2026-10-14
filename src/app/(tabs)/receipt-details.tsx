import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../context/AuthContext';
import HeaderBar from '../../components/common/HeaderBar';
import { OtherBusinessReceiptScreen } from '../../components/other-business';

function TaxiReceiptScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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
  }>();

  const rawAmount = params.amount || '104.00';
  const numericAmount = parseFloat(rawAmount) || 104;
  const isTap = params.method === 'tap';
  const cardLast4 = params.cardLast4 || '4242';
  const paymentId = params.paymentId || 'pi_3N5x...8F2d';
  const pickup = params.pickup || 'Hospital';
  const dropoff = params.dropoff || 'Home';
  const taxiNumber = params.taxiNumber || user?.taxiNumber || 'M6061';
  const dcNumber = params.dcNumber || '93821048';
  const abn = params.abn || '62 458 123 800';
  const phone = params.phone || '0400 555 320';
  const businessName = user?.businessName || 'Elite Taxi Service';

  // Amount formatting: integer and decimal parts
  const formattedWithComma =
    numericAmount >= 10000
      ? Math.floor(numericAmount).toLocaleString('en-US')
      : Math.floor(numericAmount).toString();
  const decimalPart = (numericAmount % 1).toFixed(2).split('.')[1] || '00';

  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate HTML for printing or sharing as PDF
  const generateReceiptHtml = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${businessName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px 16px;
      background-color: #F8FAFC;
      color: #0F172A;
      display: flex;
      justify-content: center;
    }
    .receipt-card {
      width: 100%;
      max-width: 380px;
      background: #FFFDF7;
      border: 1.5px solid #FEF08A;
      border-radius: 24px;
      padding: 24px 20px 28px;
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
      font-size: 24px;
    }
    .biz-name {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 4px;
      color: #0F172A;
    }
    .biz-meta {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
      margin: 2px 0;
      line-height: 1.4;
    }
    .total-paid-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #64748B;
      margin-top: 18px;
      margin-bottom: 4px;
    }
    .amount {
      font-size: 40px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 8px;
      display: flex;
      align-items: baseline;
      justify-content: center;
    }
    .dollar {
      color: #D97706;
      font-size: 28px;
      margin-right: 4px;
    }
    .decimal {
      font-size: 26px;
      color: #475569;
    }
    .paid-badge {
      display: inline-flex;
      align-items: center;
      background: #ECFDF5;
      color: #059669;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      gap: 5px;
    }
    .paid-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: #10B981;
      display: inline-block;
    }
    .divider {
      height: 1px;
      background-color: #F1F5F9;
      margin: 18px 0;
      width: 100%;
    }
    .route-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
    }
    .route-col {
      flex: 1;
    }
    .route-col.right {
      text-align: right;
    }
    .route-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      color: #94A3B8;
    }
    .route-val {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 3px;
    }
    .arrow {
      color: #F59E0B;
      font-size: 18px;
      font-weight: bold;
      padding: 0 10px;
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
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      color: #2563EB;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .pill-visa {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      font-size: 10.5px;
      font-style: italic;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;
      text-align: center;
    }
    .thank-you {
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0 0 6px;
      color: #0F172A;
    }
    .powered-by {
      font-size: 9.5px;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin: 0 0 6px;
    }
    .se-pay {
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: 1.5px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="logo-badge">🚖</div>
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
          <div class="meta-value">21 Sep 2026, 09:41 AM</div>
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
      <div class="se-pay">SE PAY</div>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Open native mobile share dialog with generated PDF
  const handleShare = async () => {
    try {
      setIsSharing(true);
      const html = generateReceiptHtml();
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

      const pdfFileName = `receipt_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${pdfFileName}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({
          from: uri,
          to: targetUri,
        });
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Receipt - ${businessName}`,
          UTI: '.pdf',
        });
      } else {
        await Share.share({
          title: `Receipt - ${businessName}`,
          message: `Taxi Receipt: ${businessName}\nTaxi: ${taxiNumber}\nRoute: ${pickup} to ${dropoff}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: 21 Sep 2026, 09:41 AM\nPayment ID: ${paymentId}`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      try {
        await Share.share({
          title: `Receipt - ${businessName}`,
          message: `Taxi Receipt: ${businessName}\nTaxi: ${taxiNumber}\nRoute: ${pickup} to ${dropoff}\nAmount: $${formattedWithComma}.${decimalPart} AUD\nDate: 21 Sep 2026, 09:41 AM\nPayment ID: ${paymentId}`,
        });
      } catch {
        Alert.alert('Share Receipt', 'Could not open share menu. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Open system printer dialogue
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const html = generateReceiptHtml();
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyPaymentId = () => {
    Alert.alert('Payment ID', `${paymentId}\nCopied to clipboard.`);
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
            onPress={handleShare}
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
          <View style={styles.receiptCard}>
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
                source={require('../../../assets/se_pay_brand_logo.png')}
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
              onPress={handleShare}
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
    width: 96,
    height: 26,
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


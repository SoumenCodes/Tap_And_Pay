import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  Image,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../context/AuthContext';

export default function ReceiptDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
  }>();

  const rawAmount = params.amount || '1250';
  const numericAmount = parseFloat(rawAmount) || 0;
  const isTap = params.method === 'tap' || !params.method;
  const cardLast4 = params.cardLast4 || '4242';
  const paymentId = params.paymentId || 'pi_3N5x...8F2d';

  const formattedAmount =
    numericAmount >= 1000
      ? numericAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : rawAmount;

  const businessName = user?.businessName || 'Crown Cuts';

  const [isSharing, setIsSharing] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Generate HTML for the PDF document matching the screen design
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
      padding: 30px 16px;
      background-color: #F8FAFC;
      color: #0F172A;
      display: flex;
      justify-content: center;
    }
    .receipt-card {
      width: 100%;
      max-width: 380px;
      background: #FFFDF7;
      border: 2px solid #FEF08A;
      border-radius: 24px;
      padding: 28px 22px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.12);
      text-align: center;
      box-sizing: border-box;
    }
    .crown-badge {
      width: 52px;
      height: 52px;
      background: #FEF9C3;
      border: 1px solid #FDE047;
      border-radius: 14px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }
    .biz-name {
      font-size: 19px;
      font-weight: 800;
      margin: 0 0 2px;
      color: #0F172A;
    }
    .biz-sub {
      font-size: 12px;
      color: #64748B;
      margin: 0 0 6px;
    }
    .biz-meta {
      font-size: 11px;
      color: #64748B;
      margin: 2px 0;
      line-height: 1.4;
    }
    .amount-box {
      margin: 20px 0 18px;
    }
    .amount {
      font-size: 38px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 8px;
    }
    .amount .dollar {
      color: #D97706;
    }
    .paid-badge {
      display: inline-block;
      background: #DCFCE7;
      color: #15803D;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .meta-list {
      border-top: 1px solid #F1F5F9;
      padding-top: 16px;
      margin-top: 16px;
      text-align: left;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .meta-label {
      font-size: 11px;
      color: #94A3B8;
      font-weight: 600;
    }
    .meta-value {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
    }
    .pill {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      color: #B45309;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .visa-pill {
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;
      text-align: center;
    }
    .thank-you {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      margin: 0 0 6px;
      color: #0F172A;
    }
    .powered-by {
      font-size: 9px;
      color: #94A3B8;
      font-weight: 700;
      letter-spacing: 0.8px;
      margin: 0 0 4px;
    }
    .se-pay {
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="crown-badge">👑</div>
    <div class="biz-name">${businessName}</div>
    <div class="biz-sub">Soumen's Business</div>
    <div class="biz-meta">ABN: 62 458 123 800 • PH: 0400 555 320</div>
    <div class="biz-meta">Suite 4, 120 Collins Street, Melbourne VIC</div>
    <div class="biz-meta">EMP ID: 93821048</div>

    <div class="amount-box">
      <div class="amount"><span class="dollar">$ </span>${formattedAmount}</div>
      <div class="paid-badge">● PAID</div>
    </div>

    <div class="meta-list">
      <div class="meta-row">
        <div>
          <div class="meta-label">Date & Time</div>
          <div class="meta-value">21 Sep 2026, 09:41 AM</div>
        </div>
        <div class="pill">⚡ ${isTap ? 'Tap & Go' : 'Card'}</div>
      </div>

      <div class="meta-row">
        <div>
          <div class="meta-label">Payment Method</div>
          <div class="meta-value">Visa •••• ${cardLast4}</div>
        </div>
        <div class="visa-pill">VISA</div>
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
      <div class="se-pay">SE PAY</div>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Open native mobile share dialog with generated PDF (WhatsApp, Email, etc.)
  const handleShare = async () => {
    try {
      setIsSharing(true);
      const html = generateReceiptHtml();
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });

      // Save into FileSystem.cacheDirectory so native Android/ExpoSharing has full read permission
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
          message: `Receipt from ${businessName}\nAmount: $${formattedAmount} AUD\nDate: 21 Sep 2026, 09:41 AM\nPayment ID: ${paymentId}`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      // Fallback to text share if native PDF sharing encounters any OS restriction
      try {
        await Share.share({
          title: `Receipt - ${businessName}`,
          message: `Receipt from ${businessName}\nAmount: $${formattedAmount} AUD\nDate: 21 Sep 2026, 09:41 AM\nPayment ID: ${paymentId}`,
        });
      } catch (fallbackError) {
        console.error('Fallback share error:', fallbackError);
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

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 20 : 16) + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
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
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Main Receipt Card (100% Figma Match) ── */}
        <View style={styles.receiptCard}>
          {/* Crown Cuts Badge Box */}
          <View style={styles.badgeWrap}>
            <View style={styles.crownBox}>
              <Image
                source={require('../../../assets/crown_cuts_badge_hd.png')}
                style={styles.crownImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Business Details Header */}
          <Text style={styles.bizName}>{businessName}</Text>
          <Text style={styles.bizSub}>Soumen&apos;s Business</Text>
          <Text style={styles.bizMeta}>ABN: 62 458 123 800 • PH: 0400 555 320</Text>
          <Text style={styles.bizMeta}>Suite 4, 120 Collins Street, Melbourne VIC</Text>
          <Text style={styles.bizMeta}>EMP ID:  93821048</Text>

          {/* Amount and PAID badge */}
          <View style={styles.amountSection}>
            <View style={styles.amountWrap}>
              <Text style={styles.dollarSign}>$ </Text>
              <Text style={styles.amountText}>{formattedAmount}</Text>
            </View>

            <View style={styles.paidBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.paidText}>PAID</Text>
            </View>
          </View>

          {/* Meta rows */}
          <View style={styles.metaList}>
            {/* Row 1: Date & Time */}
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>21 Sep 2026, 09:41 AM</Text>
              </View>
              <View style={styles.tapPill}>
                <Ionicons name={isTap ? 'flash' : 'card'} size={11} color="#B45309" />
                <Text style={styles.tapPillText}>{isTap ? 'Tap & Go' : 'Card'}</Text>
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
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="copy-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thank You & Powered By Footer */}
          <View style={styles.receiptFooter}>
            <Text style={styles.thankYouText}>
              THANK YOU FOR CHOOSING {businessName.toUpperCase()}
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
              <Ionicons name="print-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
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
              <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="share-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.shareBtnText}>Share Digital Receipt Via</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 28,
  },
  receiptCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  badgeWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  crownBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownImage: {
    width: 36,
    height: 36,
  },
  bizName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
  },
  bizSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  bizMeta: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 34,
    fontWeight: '800',
    color: '#D97706',
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  paidText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaList: {
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  tapPillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  visaPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  visaPillText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  thankYouText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  poweredByText: {
    fontSize: 9,
    color: '#94A3B8',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: 6,
  },
  sePayLogo: {
    width: 110,
    height: 32,
  },
  actions: {
    gap: 12,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    height: 52,
    borderRadius: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  printBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 14,
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});

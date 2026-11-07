import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import HeaderBar from '../../components/common/HeaderBar';
import ReceiptShareModal from '../../components/common/ReceiptShareModal';
import { OtherBusinessReceiptScreen } from '../../components/other-business';
import { normalizeImageUrl } from '../../utils/assetUtils';
import {
  dashboardService,
  onDashboardHeaderSync,
  getCachedDashboardHeader,
} from '../../services/dashboardService';
import { tokenStorage } from '../../services/tokenStorage';
import { receiptService, ReceiptData } from '../../services/receiptService';
import { printReceipt, UnifiedReceiptInput } from '../../services/receiptExportService';
import { formatSydneyToUserDateTime } from '../../utils/dateUtils';

function TaxiReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useConfirmModal();

  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
    cardBrand?: string;
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

  const cachedHeader = getCachedDashboardHeader();
  const cachedUser = tokenStorage.getCachedUser();

  const isOtherBiz =
    user?.loginType === 'other_business' ||
    user?.loginType === 'other_business_employee';

  const [extraHeader, setExtraHeader] = useState<{ abn?: string; phone?: string }>({
    abn:
      (params.abn && params.abn !== '--' ? params.abn : undefined) ||
      user?.abn ||
      cachedHeader?.abn ||
      cachedUser?.abn ||
      (isOtherBiz ? '50110219475' : undefined),
    phone:
      (params.phone && params.phone !== '--' ? params.phone : undefined) ||
      user?.phone ||
      cachedHeader?.phone ||
      cachedUser?.phone ||
      (isOtherBiz ? '9932783473' : undefined),
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
  const taxiNumber =
    receiptData?.taxi_number || receiptData?.taxi_no || params.taxiNumber || user?.taxiNumber || '--';
  const dcNumber =
    receiptData?.dc_number || params.dcNumber || (user as any)?.dcNumber || '';
  const pickup =
    receiptData?.pickup_location || receiptData?.pickup || params.pickup || '--';
  const dropoff =
    receiptData?.drop_location || receiptData?.dropoff || params.dropoff || '--';

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
    (isOtherBiz ? '50110219475' : '--');

  const phone =
    receiptData?.phone_no ||
    (params.phone && params.phone.trim() !== '' && params.phone !== '--' ? params.phone : null) ||
    extraHeader.phone ||
    user?.phone ||
    cachedHeader?.phone ||
    cachedUser?.phone ||
    (isOtherBiz ? '9932783473' : '--');

  const cardBrandFinal =
    receiptData?.card_brand || cardBrand;

  const paymentMethodLabel =
    receiptData?.payment_method || (isCash ? 'Cash Payment' : `${cardBrandFinal} •••• ${cardLast4}`);

  const paymentMethodBadgeLabel =
    receiptData?.payment_type || receiptData?.payment_method_badge || (isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card');

  const receiptDateTime = receiptData?.date_time;
  const formattedDate = useMemo(() => {
    if (receiptDateTime) {
      return formatSydneyToUserDateTime(receiptDateTime);
    }
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
  }, [receiptDateTime, params.timestamp, params.dateStr]);

  // Amount formatting: integer and decimal parts
  const formattedWithComma = Math.floor(effectiveNumericAmount).toLocaleString('en-US');
  const decimalPart = (effectiveNumericAmount % 1).toFixed(2).split('.')[1] || '00';

  // Payment Breakdown (POST /api/payment/fees or GET /api/receipt/:id)
  const breakdown =
    receiptData?.payment_break_down ||
    (receiptData as any)?.payment_breakdown;

  const hasBreakdown = Boolean(
    breakdown &&
    (breakdown.base_amount !== undefined ||
      breakdown.service_fee !== undefined ||
      breakdown.payable_amount !== undefined)
  );

  const breakdownBaseAmount =
    breakdown?.base_amount !== undefined && breakdown?.base_amount !== null
      ? Number(breakdown.base_amount)
      : breakdown?.payable_amount !== undefined && breakdown?.service_fee !== undefined
        ? Number(breakdown.payable_amount) - Number(breakdown.service_fee)
        : null;

  const breakdownServiceFee =
    breakdown?.service_fee !== undefined && breakdown?.service_fee !== null
      ? Number(breakdown.service_fee)
      : 0;

  const breakdownPayableAmount =
    breakdown?.payable_amount !== undefined && breakdown?.payable_amount !== null
      ? Number(breakdown.payable_amount)
      : effectiveNumericAmount;

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const receiptInput: UnifiedReceiptInput = useMemo(() => {
    return {
      businessName,
      businessLogo: logoUrl,
      abn,
      phone,
      amount: effectiveNumericAmount,
      amountFormatted: `$${formattedWithComma}.${decimalPart}`,
      dateTime: formattedDate,
      paymentMethod: paymentMethodLabel,
      paymentType: paymentMethodBadgeLabel,
      cardBrand: cardBrandFinal,
      paymentId,
      isTaxi: true,
      taxiNumber,
      dcNumber,
      pickup,
      dropoff,
      hasAdBanner,
      bannerImageUrl,
      breakdown,
    };
  }, [
    businessName,
    logoUrl,
    abn,
    phone,
    effectiveNumericAmount,
    formattedWithComma,
    decimalPart,
    formattedDate,
    paymentMethodLabel,
    paymentMethodBadgeLabel,
    cardBrandFinal,
    paymentId,
    taxiNumber,
    dcNumber,
    pickup,
    dropoff,
    hasAdBanner,
    bannerImageUrl,
    breakdown,
  ]);

  const handleOpenShareMenu = () => {
    setIsShareModalVisible(true);
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      await printReceipt(receiptInput);
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="share-outline" size={22} color="#0F172A" />
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
                {isLogoValid ? (
                  <Image
                    source={{ uri: logoUrl! }}
                    style={styles.logoImage}
                    resizeMode="contain"
                    onError={() => setFailedLogoUrl(logoUrl)}
                  />
                ) : (
                  <Image
                    source={require('../../../assets/taxi-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>

            {/* Business Info Header */}
            <Text style={styles.bizName}>{businessName}</Text>
            <Text style={styles.taxInvoiceHeading}>TAX INVOICE</Text>
            <Text style={styles.bizMeta}>
              ABN: {abn} • PH: {phone}
            </Text>
            <Text style={styles.bizMeta}>
              TAXI NO.: {taxiNumber}{dcNumber ? `   DC: ${dcNumber}` : ''}
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

            {/* ── Payment Breakdown Section ── */}
            {hasBreakdown && breakdownBaseAmount !== null && (
              <>
                <View style={styles.breakdownCard}>
                  <View style={styles.breakdownHeaderRow}>
                    <Text style={styles.breakdownHeaderTitle}>PAYMENT BREAKDOWN</Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Base Amount</Text>
                    <Text style={styles.breakdownValue}>
                      ${Number(breakdownBaseAmount).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Service Fee</Text>
                    <Text style={styles.breakdownValue}>
                      ${Number(breakdownServiceFee).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.breakdownInnerDivider} />

                  <View style={styles.breakdownTotalRow}>
                    <Text style={styles.breakdownTotalLabel}>
                      Total <Text style={styles.breakdownIncGst}>(INC GST)</Text>
                    </Text>
                    <Text style={styles.breakdownTotalValue}>
                      ${Number(breakdownPayableAmount).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />
              </>
            )}

            {/* ── Meta Information Rows ── */}
            <View style={styles.metaList}>
              {/* Row 1: Date & Time */}
              <View style={styles.metaRow}>
                <View>
                  <Text style={styles.metaLabel}>Date & Time</Text>
                  <Text style={styles.metaValue}>{formattedDate}</Text>
                </View>
                <View style={[styles.methodCapsule, isCash && styles.cashMethodCapsule]}>
                  <Ionicons
                    name={isCash ? 'cash-outline' : isTap ? 'flash' : 'card'}
                    size={12}
                    color={isCash ? '#059669' : '#2563EB'}
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
                <ActivityIndicator size="small" color="#0F172A" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="print-outline" size={17} color="#0F172A" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.printBtnText} numberOfLines={1} adjustsFontSizeToFit>
                Print Digital Receipt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleOpenShareMenu}
              activeOpacity={0.85}
            >
              <Ionicons name="share-outline" size={17} color="#0A3977" style={{ marginRight: 6 }} />
              <Text style={styles.shareBtnText} numberOfLines={1} adjustsFontSizeToFit>
                Share Digital Receipt
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ── UNIFIED RECEIPT SHARE MODAL (PNG, GIF, PDF) ── */}
      <ReceiptShareModal
        visible={isShareModalVisible}
        onClose={() => setIsShareModalVisible(false)}
        receiptInput={receiptInput}
      />
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
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 12,
  },
  badgeWrap: {
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
  bizName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  taxInvoiceHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bizMeta: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 1,
  },
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
    justifyContent: 'center',
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
    color: '#166534',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
    width: '100%',
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  breakdownHeaderRow: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  breakdownHeaderTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  breakdownInnerDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  breakdownTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownIncGst: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  breakdownTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#D97706',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  routeColLeft: {
    flex: 1,
    minWidth: 0,
  },
  routeColRight: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  arrowContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  routeLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  routeValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  metaList: {
    gap: 8,
    paddingHorizontal: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 1,
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
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  cashPillText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tapPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  tapPillText: {
    color: '#B45309',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mastercardPill: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  mastercardPillText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '800',
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
    color: '#94A3B8',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 4,
  },
  sePayLogo: {
    width: 105,
    height: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  printBtnText: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '800',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 12.5,
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

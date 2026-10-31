import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  shiftService,
  ShiftDetailsData,
  ShiftDetailsTransactionItem,
} from '../../../services/shiftService';
import {
  formatSydneyToUserDate,
  formatSydneyToUserTime,
  formatSydneyToUserDateTime,
  formatShiftRecordTime,
} from '../../../utils/dateUtils';

interface OtherBusinessShiftDetailsScreenProps {
  shiftId: string;
  onBack: () => void;
  businessName?: string;
  userName?: string;
}

type TxnFilterType = 'all' | 'card' | 'tap';

export default function OtherBusinessShiftDetailsScreen({
  shiftId = '13',
  onBack,
  businessName = 'Business',
  userName = 'Staff Member',
}: OtherBusinessShiftDetailsScreenProps) {
  const { showAlert } = useConfirmModal();

  // API State
  const [shiftDetails, setShiftDetails] = useState<ShiftDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TxnFilterType>('all');

  // Fetch shift details from live API (GET /api/shift/history/details/:id)
  const fetchShiftDetails = useCallback(
    async (methodFilter?: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const methodParam = methodFilter !== undefined ? methodFilter : filterType;
        const res = await shiftService.getShiftDetails(shiftId, {
          method: methodParam !== 'all' ? methodParam : undefined,
        });

        if (res?.data) {
          setShiftDetails(res.data);
        }
      } catch (err: any) {
        console.warn('Failed to load shift details:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift details.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [shiftId, filterType]
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftDetails(shiftId)
      .then((res) => {
        if (isMounted && res?.data) {
          setShiftDetails(res.data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn('Failed to load shift details:', err?.message || err);
          setErrorMessage(err?.message || 'Unable to load shift details.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [shiftId]);

  const handleRefresh = () => {
    fetchShiftDetails(filterType, true);
  };

  const handleFilterChange = (newFilter: TxnFilterType) => {
    setFilterType(newFilter);
    fetchShiftDetails(newFilter);
  };

  // Convert shift start_at & end_at from Australia/Sydney to user device local time
  const shiftTime = useMemo(() => {
    if (!shiftDetails?.shift_info) {
      return { dateText: '--', timeRangeText: '--' };
    }
    return formatShiftRecordTime({
      start_at: shiftDetails.shift_info.start_at,
      end_at: shiftDetails.shift_info.end_at,
      time_range: shiftDetails.shift_info.time_range,
      session_date: shiftDetails.shift_info.session_date,
    });
  }, [
    shiftDetails?.shift_info?.start_at,
    shiftDetails?.shift_info?.end_at,
    shiftDetails?.shift_info?.time_range,
    shiftDetails?.shift_info?.session_date,
  ]);

  // Filter transactions by search query locally
  const filteredTransactions = useMemo(() => {
    const list = shiftDetails?.transactions || [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((txn) => {
      const matchId = (txn.transaction_id || '').toLowerCase().includes(query);
      const matchMethod = (txn.payment_method || '').toLowerCase().includes(query);
      const matchAmount = (txn.amount_formatted || txn.amount?.toString() || '').toLowerCase().includes(query);
      const matchDate = (txn.date || '').toLowerCase().includes(query);
      return matchId || matchMethod || matchAmount || matchDate;
    });
  }, [shiftDetails?.transactions, searchQuery]);

  // Group transactions by user's local date (e.g. "31 Oct 2026")
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: { txns: ShiftDetailsTransactionItem[]; total: number } } = {};

    filteredTransactions.forEach((txn) => {
      const groupDate = formatSydneyToUserDate(txn.date) || txn.date.split(' ')[0] || 'Transactions';
      if (!groups[groupDate]) {
        groups[groupDate] = { txns: [], total: 0 };
      }
      groups[groupDate].txns.push(txn);
      groups[groupDate].total += txn.amount || 0;
    });

    return Object.entries(groups).map(([date, data]) => ({
      date,
      transactions: data.txns,
      total: data.total,
    }));
  }, [filteredTransactions]);

  // Helper for whole and cents display
  const formatAmountParts = (amount?: number) => {
    if (amount === undefined || amount === null) {
      return { whole: '0', cents: '.00' };
    }
    const whole = Math.floor(amount).toLocaleString('en-US');
    const cents = (amount % 1).toFixed(2).split('.')[1] || '00';
    return { whole, cents: `.${cents}` };
  };

  // Generate HTML for individual receipt
  const getReceiptHtml = (txn: ShiftDetailsTransactionItem) => {
    const isCard = (txn.payment_method || '').toLowerCase().includes('card');
    const isCash = (txn.payment_method || '').toLowerCase().includes('cash');
    const localDateTime = formatSydneyToUserDateTime(txn.date) || txn.date;
    const staffName = shiftDetails?.user?.name || userName;
    const staffEmpId = shiftDetails?.user?.code || shiftDetails?.user?.emp_id || '';
    const displayShiftCode =
      shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111827; text-align: center; }
            .header { border-bottom: 2px dashed #E5E7EB; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: bold; margin: 0; color: #0F172A; }
            .subtitle { font-size: 13px; color: #64748B; margin-top: 4px; }
            .abn { font-size: 11px; color: #94A3B8; margin-top: 2px; }
            .amount-box { margin: 20px 0; padding: 16px; background: #F8FAFC; border-radius: 12px; }
            .amount { font-size: 32px; font-weight: 800; color: #0F172A; margin: 4px 0; }
            .status { color: #10B981; font-weight: 700; font-size: 13px; }
            .details { text-align: left; margin: 16px 0; font-size: 13px; border-bottom: 1px dashed #E5E7EB; padding-bottom: 16px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #64748B; }
            .value { font-weight: 600; color: #1E293B; }
            .footer { font-size: 11px; color: #94A3B8; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${businessName}</h1>
            <p class="subtitle">Receipt • ${staffName}</p>
            <p class="abn">EMP: ${staffName}${staffEmpId ? ` (${staffEmpId})` : ''} • Shift: ${displayShiftCode}</p>
          </div>

          <div class="amount-box">
            <div class="status">● PAID / SETTLED</div>
            <div class="amount">${txn.amount_formatted || `$${txn.amount.toFixed(2)} AUD`}</div>
            <div style="font-size: 12px; color: #64748B;">${isCash ? 'Cash Payment' : isCard ? 'Chip & PIN Card' : 'Contactless Tap & Go'}</div>
          </div>

          <div class="details">
            <div class="row"><span class="label">Transaction ID:</span><span class="value">${txn.transaction_id}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span class="value">${localDateTime}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${txn.payment_method}</span></div>
            <div class="row"><span class="label">Terminal ID:</span><span class="value">${txn.terminal_id || 'SE-PAY-01'}</span></div>
          </div>

          <div class="footer">
            <p>SE PAY SECURED TERMINAL PAYMENT</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  // Generate HTML for full Shift Slip
  const getShiftSlipHtml = () => {
    const staffName = shiftDetails?.user?.name || userName;
    const staffEmpId = shiftDetails?.user?.code || shiftDetails?.user?.emp_id || '';
    const displayShiftCode =
      shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;
    const isPaid = Boolean(shiftDetails?.shift_info?.is_paid);
    const paidDate = shiftDetails?.shift_info?.paid_date;
    const totalAmount = shiftDetails?.metrics?.total?.amount_formatted || '$0.00';
    const cardAmount = shiftDetails?.metrics?.card?.amount_formatted || '$0.00';
    const cardCount = shiftDetails?.metrics?.card?.count ?? 0;
    const tapAmount = shiftDetails?.metrics?.tap_and_go?.amount_formatted || '$0.00';
    const tapCount = shiftDetails?.metrics?.tap_and_go?.count ?? 0;
    const txns = shiftDetails?.transactions || [];

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
            <h1 class="title">${businessName}</h1>
            <p class="sub">Shift Tally Slip • Terminal #537384</p>
            <div class="badge">${isPaid ? `● PAID${paidDate ? ` on ${paidDate}` : ''}` : '● UNPAID'}</div>
          </div>

          <div class="card">
            <div class="row"><span class="label">Shift ID:</span><span class="val">${displayShiftCode}</span></div>
            <div class="row"><span class="label">Employee:</span><span class="val">${staffName}${staffEmpId ? ` (${staffEmpId})` : ''}</span></div>
            <div class="row"><span class="label">Time:</span><span class="val">${shiftTime.dateText} • ${shiftTime.timeRangeText}</span></div>
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
                  <td>${formatSydneyToUserTime(t.date)}</td>
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
  };

  // Reprint Receipt via native print dialog
  const handleReprint = async (txn: ShiftDetailsTransactionItem) => {
    try {
      await Print.printAsync({
        html: getReceiptHtml(txn),
      });
    } catch (error) {
      console.warn('Print error or canceled:', error);
    }
  };

  // Share Receipt via native sheet
  const handleShare = async (txn: ShiftDetailsTransactionItem) => {
    try {
      const html = getReceiptHtml(txn);
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const fileName = `receipt_${txn.transaction_id.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
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
            dialogTitle: `Share Receipt ${txn.transaction_id}`,
            UTI: 'com.adobe.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync failed, trying Share.share:', shareErr);
        }
      }

      const localDateTime = formatSydneyToUserDateTime(txn.date) || txn.date;
      const shareMsg = `Receipt: ${businessName}\nTransaction: ${txn.transaction_id}\nAmount: ${txn.amount_formatted}\nMethod: ${txn.payment_method}\nDate: ${localDateTime}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Receipt ${txn.transaction_id}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Receipt ${txn.transaction_id}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing receipt:', error);
      showAlert({
        title: 'Error',
        message: 'Unable to share receipt.',
        type: 'danger',
      });
    }
  };

  // Reprint Shift Slip
  const handleReprintShiftSlip = async () => {
    try {
      await Print.printAsync({
        html: getShiftSlipHtml(),
      });
    } catch (error) {
      console.warn('Print shift slip canceled or failed:', error);
    }
  };

  // Share Shift Report
  const handleShareShiftReport = async () => {
    try {
      const html = getShiftSlipHtml();
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const displayShiftCode =
        shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;
      const fileName = `Shift_Report_${displayShiftCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}.pdf`;
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
            dialogTitle: `Share Shift Report`,
            UTI: 'com.adobe.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync report failed, trying Share.share:', shareErr);
        }
      }

      const shareMsg = `Shift Report: ${businessName}\nShift: ${displayShiftCode}\nTime: ${shiftTime.dateText} • ${shiftTime.timeRangeText}\nTotal: ${shiftDetails?.metrics?.total?.amount_formatted || '$0.00'}`;
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: `Shift Report - ${displayShiftCode}`,
              message: shareMsg,
              url: targetUri,
            }
          : {
              title: `Shift Report - ${displayShiftCode}`,
              message: shareMsg,
            }
      );
    } catch (error) {
      console.error('Error sharing shift report:', error);
      showAlert({
        title: 'Error',
        message: 'Unable to share shift report.',
        type: 'danger',
      });
    }
  };

  const headerTitle =
    shiftDetails?.shift_info?.display_shift_id || shiftDetails?.display_shift_id || shiftId;

  // Breakdown metrics numbers
  const totalParts = formatAmountParts(shiftDetails?.metrics?.total?.amount);
  const cardParts = formatAmountParts(shiftDetails?.metrics?.card?.amount);
  const tapParts = formatAmountParts(shiftDetails?.metrics?.tap_and_go?.amount);

  const isPaid = Boolean(shiftDetails?.shift_info?.is_paid);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar with Back Button and Shift ID */}
      <HeaderBar
        title={headerTitle}
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
      >
        {/* Error State Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchShiftDetails()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={styles.loadingText}>Loading shift details...</Text>
          </View>
        )}

        {!isLoading && (
          <>
            {/* ── 1. EMPLOYEE & SHIFT SUMMARY CARD ── */}
            <View style={styles.employeeSummaryCard}>
              {/* Top Row: Avatar + Name + EMP ID */}
              <View style={styles.employeeTopRow}>
                {shiftDetails?.user?.avatar ? (
                  <Image source={{ uri: shiftDetails.user.avatar }} style={styles.employeeAvatar} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsAvatarText}>
                      {shiftDetails?.user?.initials || 'EM'}
                    </Text>
                  </View>
                )}

                <View style={styles.employeeNameCol}>
                  <Text style={styles.employeeNameText}>
                    {shiftDetails?.user?.name || userName}
                  </Text>
                  {(shiftDetails?.user?.code || shiftDetails?.user?.emp_id) && (
                    <Text style={styles.empIdLabel}>
                      EMP ID:{' '}
                      <Text style={styles.empIdValue}>
                        {shiftDetails?.user?.code || shiftDetails?.user?.emp_id}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>

              {/* Middle Row: Shift ID + Paid / Unpaid Badge */}
              <View style={styles.shiftIdStatusRow}>
                <Text style={styles.shiftIdCode}>{headerTitle}</Text>

                {isPaid ? (
                  <View style={styles.paidBadge}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidBadgeText}>
                      PAID{shiftDetails?.shift_info?.paid_date ? ` on ${shiftDetails.shift_info.paid_date}` : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unpaidBadge}>
                    <View style={styles.unpaidDot} />
                    <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                  </View>
                )}
              </View>

              {/* Bottom Row: Shift Date & Time & Range (User Timezone) */}
              <Text style={styles.shiftMetaText}>
                {shiftTime.dateText} • {shiftTime.timeRangeText}
              </Text>
            </View>

            {/* ── 2. METRICS CARD (TOTAL, CARD, TAP & GO) ── */}
            <View style={styles.metricsCard}>
              {/* Column 1: TOTAL */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <View style={styles.bulletTotal} />
                  <Text style={styles.metricColumnTitleTotal}>TOTAL</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarGold}>$</Text>
                  <Text style={styles.metricAmountTotal}>{totalParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{totalParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.total?.count ?? 0} Txns
                </Text>
              </View>

              <View style={styles.columnDivider} />

              {/* Column 2: CARD */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="card-outline" size={12} color="#2563EB" />
                  <Text style={styles.metricColumnTitleCard}>CARD</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarBlue}>$</Text>
                  <Text style={styles.metricAmountCard}>{cardParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{cardParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.card?.count ?? 0} Txns
                </Text>
              </View>

              <View style={styles.columnDivider} />

              {/* Column 3: TAP & GO */}
              <View style={styles.metricColumn}>
                <View style={styles.metricLabelRow}>
                  <View style={styles.bulletTap} />
                  <Text style={styles.metricColumnTitleTap}>TAP & GO</Text>
                </View>
                <View style={styles.metricAmountRow}>
                  <Text style={styles.metricDollarOrange}>$</Text>
                  <Text style={styles.metricAmountTap}>{tapParts.whole}</Text>
                  <Text style={styles.metricAmountCents}>{tapParts.cents}</Text>
                </View>
                <Text style={styles.metricSubtext}>
                  {shiftDetails?.metrics?.tap_and_go?.count ?? 0} Txns
                </Text>
              </View>
            </View>

            {/* ── 3. SEARCH BAR ── */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={16} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search TXN ID, amount..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* ── 4. SEGMENTED FILTER PILLS (All, Card, Tap & Go) ── */}
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'all' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('all')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'all' && styles.segmentTabTextActive,
                  ]}
                >
                  All ({shiftDetails?.filters?.tabs?.all?.count ?? shiftDetails?.metrics?.total?.count ?? 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'card' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('card')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'card' && styles.segmentTabTextActive,
                  ]}
                >
                  Card ({shiftDetails?.filters?.tabs?.card?.count ?? shiftDetails?.metrics?.card?.count ?? 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentTab,
                  filterType === 'tap' && styles.segmentTabActive,
                ]}
                onPress={() => handleFilterChange('tap')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabText,
                    filterType === 'tap' && styles.segmentTabTextActive,
                  ]}
                >
                  Tap & Go ({shiftDetails?.filters?.tabs?.tap_and_go?.count ?? shiftDetails?.metrics?.tap_and_go?.count ?? 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── 5. GROUPED TRANSACTION LIST ── */}
            {groupedTransactions.map((group) => (
              <View key={group.date} style={styles.dateGroupContainer}>
                {/* Date Group Header */}
                <View style={styles.dateGroupHeaderRow}>
                  <Text style={styles.dateGroupTitle}>{group.date}</Text>
                  <View style={styles.dateGroupTotalRow}>
                    <Text style={styles.dateGroupCurrency}>$</Text>
                    <Text style={styles.dateGroupTotalValue}>
                      {Math.floor(group.total).toLocaleString('en-US')}
                    </Text>
                    <Text style={styles.dateGroupCents}>
                      .{((group.total % 1) * 100).toFixed(0).padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                {/* Transaction Cards */}
                {group.transactions.map((txn: ShiftDetailsTransactionItem) => {
                  const isCard = (txn.payment_method || '').toLowerCase().includes('card');
                  const formattedTime = formatSydneyToUserTime(txn.date) || txn.date;

                  return (
                    <View key={String(txn.id)} style={styles.txnCard}>
                      {/* Top Row: ID + Time + Method Chip + Amount */}
                      <View style={styles.txnTopRow}>
                        <View style={styles.txnIdTimeGroup}>
                          <Text style={styles.txnIdText}>{txn.transaction_id}</Text>
                          <Text style={styles.txnTimeText}>{formattedTime}</Text>

                          {isCard ? (
                            <View style={styles.chipCard}>
                              <Ionicons name="card-outline" size={11} color="#2563EB" />
                              <Text style={styles.chipCardText}>Card</Text>
                            </View>
                          ) : (
                            <View style={styles.chipTap}>
                              <MaterialCommunityIcons name="contactless-payment" size={12} color="#D97706" />
                              <Text style={styles.chipTapText}>Tap & Go</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.txnAmountGroup}>
                          <Text style={styles.txnAmountCurrency}>$</Text>
                          <Text style={styles.txnAmountWhole}>
                            {Math.floor(txn.amount).toLocaleString('en-US')}
                          </Text>
                          <Text style={styles.txnAmountCents}>
                            .{((txn.amount % 1) * 100).toFixed(0).padStart(2, '0')}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom Row: Settlement Verification + Action Buttons */}
                      <View style={styles.txnBottomRow}>
                        <View style={styles.verificationGroup}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                          <Text style={styles.verificationText}>Settled • Successful</Text>
                        </View>

                        <View style={styles.txnActionsRow}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleReprint(txn)}
                            activeOpacity={0.7}
                          >
                            <Feather name="printer" size={11} color="#334155" />
                            <Text style={styles.actionButtonText}>Reprint</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleShare(txn)}
                            activeOpacity={0.7}
                          >
                            <Feather name="share" size={11} color="#334155" />
                            <Text style={styles.actionButtonText}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {filteredTransactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={28} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Transactions Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? 'Try adjusting your search criteria' : 'No transactions recorded for this filter'}
                </Text>
              </View>
            )}

            {/* ── 6. BOTTOM ACTION BUTTONS ── */}
            <View style={styles.bottomButtonsRow}>
              {/* Yellow/Gold Button: Reprint Shift Slip */}
              <TouchableOpacity
                style={styles.reprintSlipBtn}
                onPress={handleReprintShiftSlip}
                activeOpacity={0.85}
              >
                <Feather name="printer" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.reprintSlipBtnText}>Reprint Shift Slip</Text>
              </TouchableOpacity>

              {/* White Button: Share Report */}
              <TouchableOpacity
                style={styles.shareReportBtn}
                onPress={handleShareShiftReport}
                activeOpacity={0.85}
              >
                <Feather name="share" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.shareReportBtnText}>Share Report</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },

  /* 1. Employee Summary Card */
  employeeSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 13,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  employeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  initialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  initialsAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  employeeNameCol: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  empIdLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  empIdValue: {
    fontWeight: '700',
    color: '#D97706',
  },
  shiftIdStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftIdCode: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    gap: 4,
  },
  paidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    gap: 4,
  },
  unpaidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  shiftMetaText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },

  /* 2. Metrics Card */
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#F1F5F9',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  bulletTotal: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  bulletTap: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
  },
  metricColumnTitleTotal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.2,
  },
  metricColumnTitleCard: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.2,
  },
  metricColumnTitleTap: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.2,
  },
  metricAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricDollarGold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  metricDollarBlue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  metricDollarOrange: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  metricAmountTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricAmountCard: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  metricAmountTap: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EA580C',
  },
  metricAmountCents: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  /* 3. Search Bar */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },

  /* 4. Segmented Control */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* 5. Grouped Transactions */
  dateGroupContainer: {
    marginBottom: 14,
  },
  dateGroupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dateGroupTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  dateGroupTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dateGroupCurrency: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  dateGroupTotalValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateGroupCents: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 11,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  txnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txnIdTimeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  txnIdText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  chipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 3,
  },
  chipCardText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  chipTap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    gap: 2,
  },
  chipTapText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#D97706',
  },
  txnAmountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  txnAmountCurrency: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  txnAmountWhole: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnAmountCents: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  txnBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 7,
  },
  verificationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  verificationText: {
    fontSize: 10.5,
    color: '#475569',
  },
  txnActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  actionButtonText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* 6. Bottom Action Buttons */
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  reprintSlipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  reprintSlipBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  shareReportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  shareReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Loading & Error States */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DC2626',
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

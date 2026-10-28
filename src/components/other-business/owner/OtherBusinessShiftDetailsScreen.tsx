import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  MOCK_BUSINESS_TRANSACTIONS,
  MOCK_BUSINESS_STATS,
} from '../../../data/mockBusinessTransactions';
import { BusinessTransaction } from '../../../types/businessTransaction';
import { SALON_EMPLOYEES } from './OtherBusinessTransactionsScreen';

interface OtherBusinessShiftDetailsScreenProps {
  shiftId: string;
  onBack: () => void;
  businessName?: string;
  userName?: string;
}

type TxnFilterType = 'all' | 'card' | 'tap_and_go';

export default function OtherBusinessShiftDetailsScreen({
  shiftId = '26102026/93821048/537384',
  onBack,
  businessName = 'Crown Cuts',
  userName = 'Soumen Sen',
}: OtherBusinessShiftDetailsScreenProps) {
  const { showAlert } = useConfirmModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TxnFilterType>('all');

  // Derive employee from shiftId (e.g. "26102026/93821048/537384" -> "93821048")
  const empId = useMemo(() => {
    const parts = shiftId.split('/');
    return parts.length >= 2 ? parts[1] : '93821048';
  }, [shiftId]);

  const employee = useMemo(() => {
    return (
      SALON_EMPLOYEES.find((e) => e.empId === empId) ||
      SALON_EMPLOYEES[0]
    );
  }, [empId]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return MOCK_BUSINESS_TRANSACTIONS.filter((txn) => {
      if (filterType === 'card' && txn.method !== 'card') return false;
      if (filterType === 'tap_and_go' && txn.method !== 'tap_and_go') return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = txn.id.toLowerCase().includes(query);
        const matchAmount = txn.amount.toString().includes(query);
        const matchVerification = txn.verification.toLowerCase().includes(query);
        if (!matchId && !matchAmount && !matchVerification) return false;
      }

      return true;
    });
  }, [filterType, searchQuery]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: { txns: BusinessTransaction[]; total: number } } = {};

    filteredTransactions.forEach((txn) => {
      if (!groups[txn.date]) {
        groups[txn.date] = { txns: [], total: 0 };
      }
      groups[txn.date].txns.push(txn);
      groups[txn.date].total += txn.amount;
    });

    return Object.entries(groups).map(([date, data]) => ({
      date,
      transactions: data.txns,
      total: data.total,
    }));
  }, [filteredTransactions]);

  // Generate HTML for individual receipt
  const getReceiptHtml = (txn: BusinessTransaction) => {
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
            <p class="subtitle">${userName || employee.name}'s Business</p>
            <p class="abn">EMP: ${employee.name} (${employee.empId}) • Shift: ${shiftId}</p>
          </div>

          <div class="amount-box">
            <div class="status">● PAID / SETTLED</div>
            <div class="amount">$${txn.amount.toFixed(2)} AUD</div>
            <div style="font-size: 12px; color: #64748B;">${txn.method === 'card' ? 'Chip & PIN Card' : 'Contactless Tap & Go'}</div>
          </div>

          <div class="details">
            <div class="row"><span class="label">Transaction ID:</span><span class="value">${txn.id}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span class="value">${txn.date}, ${txn.time}</span></div>
            <div class="row"><span class="label">Verification:</span><span class="value">${txn.verification}</span></div>
            <div class="row"><span class="label">Terminal ID:</span><span class="value">${txn.terminalId || '#537384'}</span></div>
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
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px; background: #ECFDF5; color: #059669; }
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
            <div class="badge">● PAID on 30 Oct 2026</div>
          </div>

          <div class="card">
            <div class="row"><span class="label">Shift ID:</span><span class="val">${shiftId}</span></div>
            <div class="row"><span class="label">Employee:</span><span class="val">${employee.name} (${employee.empId})</span></div>
            <div class="row"><span class="label">Time:</span><span class="val">26 Oct 2026 • 07:30 AM – 05:00 PM • 9.5 hrs</span></div>
            <div class="row"><span class="label">Total Collections:</span><span class="val" style="font-size: 16px; font-weight: 800; color: #059669;">$${MOCK_BUSINESS_STATS.totalAmount.toFixed(2)} AUD</span></div>
            <div class="row"><span class="label">Card Sales (9 txns):</span><span class="val">$${MOCK_BUSINESS_STATS.cardAmount.toFixed(2)}</span></div>
            <div class="row"><span class="label">Tap & Go Sales (5 txns):</span><span class="val">$${MOCK_BUSINESS_STATS.tapAndGoAmount.toFixed(2)}</span></div>
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
              ${MOCK_BUSINESS_TRANSACTIONS.map(
                (t) => `
                <tr>
                  <td>${t.id}</td>
                  <td>${t.time}</td>
                  <td>${t.method === 'card' ? 'Card' : 'Tap & Go'}</td>
                  <td style="font-weight: bold;">$${t.amount.toFixed(2)}</td>
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
  const handleReprint = async (txn: BusinessTransaction) => {
    try {
      await Print.printAsync({
        html: getReceiptHtml(txn),
      });
    } catch (error) {
      console.warn('Print error or canceled:', error);
    }
  };

  // Share Receipt via native sheet
  const handleShare = async (txn: BusinessTransaction) => {
    try {
      const html = getReceiptHtml(txn);
      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const fileName = `receipt_${txn.id.replace('#', '')}_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

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
          dialogTitle: `Share Receipt ${txn.id}`,
          UTI: '.pdf',
        });
      }
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
      const fileName = `Shift_Report_${shiftId.replace(/\//g, '_')}.pdf`;
      const targetUri = `${FileSystem.cacheDirectory}${fileName}`;

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
          dialogTitle: `Share Shift Report`,
          UTI: '.pdf',
        });
      } else {
        showAlert({
          title: 'Report Saved',
          message: `Saved to ${targetUri}`,
          type: 'success',
          icon: 'document-text-outline',
        });
      }
    } catch (error) {
      console.error('Error sharing shift report:', error);
      showAlert({
        title: 'Error',
        message: 'Unable to share shift report.',
        type: 'danger',
      });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar with Back Button and Shift ID */}
      <HeaderBar
        title={shiftId}
        showBack={true}
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. EMPLOYEE & SHIFT SUMMARY CARD ── */}
        <View style={styles.employeeSummaryCard}>
          {/* Top Row: Avatar + Name + EMP ID */}
          <View style={styles.employeeTopRow}>
            <Image source={employee.avatar} style={styles.employeeAvatar} />
            <View style={styles.employeeNameCol}>
              <Text style={styles.employeeNameText}>{employee.name}</Text>
              <Text style={styles.empIdLabel}>
                EMP ID: <Text style={styles.empIdValue}>{employee.empId}</Text>
              </Text>
            </View>
          </View>

          {/* Middle Row: Shift ID + Paid Badge */}
          <View style={styles.shiftIdStatusRow}>
            <Text style={styles.shiftIdCode}>{shiftId}</Text>
            <View style={styles.paidBadge}>
              <View style={styles.paidDot} />
              <Text style={styles.paidBadgeText}>PAID on 30 Oct 2026</Text>
            </View>
          </View>

          {/* Bottom Row: Shift Date & Time & Hours */}
          <Text style={styles.shiftMetaText}>
            26 Oct 2026 • 07:30 AM – 05:00 PM • 9.5 hrs
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
              <Text style={styles.metricAmountTotal}>
                {Math.floor(MOCK_BUSINESS_STATS.totalAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>
              {MOCK_BUSINESS_STATS.totalCount} Txns
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
              <Text style={styles.metricAmountCard}>
                {Math.floor(MOCK_BUSINESS_STATS.cardAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>
              {MOCK_BUSINESS_STATS.cardCount} Txns
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
              <Text style={styles.metricAmountTap}>
                {Math.floor(MOCK_BUSINESS_STATS.tapAndGoAmount)}
              </Text>
              <Text style={styles.metricAmountCents}>.00</Text>
            </View>
            <Text style={styles.metricSubtext}>
              {MOCK_BUSINESS_STATS.tapAndGoCount} Txns
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
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'all' && styles.segmentTabTextActive,
              ]}
            >
              All ({MOCK_BUSINESS_STATS.totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              filterType === 'card' && styles.segmentTabActive,
            ]}
            onPress={() => setFilterType('card')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'card' && styles.segmentTabTextActive,
              ]}
            >
              Card ({MOCK_BUSINESS_STATS.cardCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              filterType === 'tap_and_go' && styles.segmentTabActive,
            ]}
            onPress={() => setFilterType('tap_and_go')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentTabText,
                filterType === 'tap_and_go' && styles.segmentTabTextActive,
              ]}
            >
              Tap & Go ({MOCK_BUSINESS_STATS.tapAndGoCount})
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
                  {Math.floor(group.total)}
                </Text>
                <Text style={styles.dateGroupCents}>
                  .{((group.total % 1) * 100).toFixed(0).padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Transaction Cards */}
            {group.transactions.map((txn) => {
              const isCard = txn.method === 'card';

              return (
                <View key={txn.id} style={styles.txnCard}>
                  {/* Top Row: ID + Time + Method Chip + Amount */}
                  <View style={styles.txnTopRow}>
                    <View style={styles.txnIdTimeGroup}>
                      <Text style={styles.txnIdText}>{txn.id}</Text>
                      <Text style={styles.txnTimeText}>{txn.time}</Text>

                      {isCard ? (
                        <View style={styles.chipCard}>
                          <Ionicons name="card-outline" size={11} color="#2563EB" />
                          <Text style={styles.chipCardText}>Card</Text>
                        </View>
                      ) : (
                        <View style={styles.chipTap}>
                          <MaterialCommunityIcons name="flash" size={11} color="#D97706" />
                          <Text style={styles.chipTapText}>Tap & Go</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.txnAmountGroup}>
                      <Text style={styles.txnAmountCurrency}>$</Text>
                      <Text style={styles.txnAmountWhole}>
                        {Math.floor(txn.amount)}
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
                      <Text style={styles.verificationText}>{txn.verification}</Text>
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
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
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
  shiftMetaText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
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
});

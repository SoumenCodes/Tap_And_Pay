import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import HeaderBar from '../../common/HeaderBar';

export interface EmployeeShiftItem {
  id: string;
  dateKey: string;
  dateText: string;
  timeRange: string;
  status: 'paid' | 'unpaid';
  paidDate?: string;
  totalAmount: number;
  txnsCount: number;
  cardTxns: number;
  cardAmount: number;
  tapTxns: number;
  tapAmount: number;
}

const MOCK_EMPLOYEE_SHIFTS: EmployeeShiftItem[] = [
  {
    id: '26102026/93822048/537384',
    dateKey: '26102026',
    dateText: '26 Oct 2026',
    timeRange: '07:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 485.0,
    txnsCount: 14,
    cardTxns: 9,
    cardAmount: 320.0,
    tapTxns: 5,
    tapAmount: 165.0,
  },
  {
    id: '25102026/93822048/537383',
    dateKey: '25102026',
    dateText: '25 Oct 2026',
    timeRange: '05:30 PM – 02:00 AM',
    status: 'paid',
    paidDate: '30 Oct 2026',
    totalAmount: 390.0,
    txnsCount: 11,
    cardTxns: 7,
    cardAmount: 250.0,
    tapTxns: 4,
    tapAmount: 140.0,
  },
  {
    id: '24102026/93822048/537382',
    dateKey: '24102026',
    dateText: '24 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'unpaid',
    totalAmount: 240.0,
    txnsCount: 8,
    cardTxns: 5,
    cardAmount: 155.0,
    tapTxns: 3,
    tapAmount: 85.0,
  },
  {
    id: '23102026/93822048/537381',
    dateKey: '23102026',
    dateText: '23 Oct 2026',
    timeRange: '09:00 AM – 05:30 PM',
    status: 'unpaid',
    totalAmount: 120.0,
    txnsCount: 4,
    cardTxns: 2,
    cardAmount: 60.0,
    tapTxns: 2,
    tapAmount: 60.0,
  },
  {
    id: '22102026/93822048/537380',
    dateKey: '22102026',
    dateText: '22 Oct 2026',
    timeRange: '08:00 AM – 05:00 PM',
    status: 'paid',
    paidDate: '26 Oct 2026',
    totalAmount: 410.0,
    txnsCount: 12,
    cardTxns: 8,
    cardAmount: 280.0,
    tapTxns: 4,
    tapAmount: 130.0,
  },
  {
    id: '21102026/93822048/537379',
    dateKey: '21102026',
    dateText: '21 Oct 2026',
    timeRange: '08:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '26 Oct 2026',
    totalAmount: 380.0,
    txnsCount: 10,
    cardTxns: 6,
    cardAmount: 240.0,
    tapTxns: 4,
    tapAmount: 140.0,
  },
  {
    id: '20102026/93822048/537378',
    dateKey: '20102026',
    dateText: '20 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'paid',
    paidDate: '26 Oct 2026',
    totalAmount: 350.0,
    txnsCount: 9,
    cardTxns: 6,
    cardAmount: 230.0,
    tapTxns: 3,
    tapAmount: 120.0,
  },
  {
    id: '19102026/93822048/537377',
    dateKey: '19102026',
    dateText: '19 Oct 2026',
    timeRange: '08:00 AM – 05:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 395.0,
    txnsCount: 11,
    cardTxns: 7,
    cardAmount: 265.0,
    tapTxns: 4,
    tapAmount: 130.0,
  },
  {
    id: '18102026/93822048/537376',
    dateKey: '18102026',
    dateText: '18 Oct 2026',
    timeRange: '09:00 AM – 04:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 290.0,
    txnsCount: 8,
    cardTxns: 5,
    cardAmount: 180.0,
    tapTxns: 3,
    tapAmount: 110.0,
  },
  {
    id: '17102026/93822048/537375',
    dateKey: '17102026',
    dateText: '17 Oct 2026',
    timeRange: '08:00 AM – 05:30 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 430.0,
    txnsCount: 13,
    cardTxns: 9,
    cardAmount: 300.0,
    tapTxns: 4,
    tapAmount: 130.0,
  },
  {
    id: '16102026/93822048/537374',
    dateKey: '16102026',
    dateText: '16 Oct 2026',
    timeRange: '08:30 AM – 05:00 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 370.0,
    txnsCount: 10,
    cardTxns: 6,
    cardAmount: 240.0,
    tapTxns: 4,
    tapAmount: 130.0,
  },
  {
    id: '15102026/93822048/537373',
    dateKey: '15102026',
    dateText: '15 Oct 2026',
    timeRange: '08:00 AM – 04:30 PM',
    status: 'paid',
    paidDate: '23 Oct 2026',
    totalAmount: 370.0,
    txnsCount: 9,
    cardTxns: 6,
    cardAmount: 230.0,
    tapTxns: 3,
    tapAmount: 140.0,
  },
];

interface OtherBusinessEmployeeHistoryScreenProps {
  userName?: string;
  empId?: string;
  onSelectShift?: (shift: { id: string }) => void;
}

export default function OtherBusinessEmployeeHistoryScreen({
  empId = '93822048',
  onSelectShift,
}: OtherBusinessEmployeeHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState('20–26 Oct 2026');
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  // Filtered shifts based on search query and status filter
  const filteredShifts = useMemo(() => {
    return MOCK_EMPLOYEE_SHIFTS.filter((shift) => {
      // Status filter
      if (filterStatus === 'paid' && shift.status !== 'paid') return false;
      if (filterStatus === 'unpaid' && shift.status !== 'unpaid') return false;

      // Search query filter (matches Shift ID, Date text, amount)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const idMatches = shift.id.toLowerCase().includes(query);
        const dateMatches = shift.dateText.toLowerCase().includes(query);
        return idMatches || dateMatches;
      }

      return true;
    });
  }, [searchQuery, filterStatus]);

  const allCount = MOCK_EMPLOYEE_SHIFTS.length;
  const paidCount = MOCK_EMPLOYEE_SHIFTS.filter((s) => s.status === 'paid').length;
  const unpaidCount = MOCK_EMPLOYEE_SHIFTS.filter((s) => s.status === 'unpaid').length;

  const handleCardPress = (shift: EmployeeShiftItem) => {
    if (onSelectShift) {
      onSelectShift({ id: shift.id });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── HEADER BAR (Centered Title & EMP ID Subtitle) ── */}
      <HeaderBar
        title="Shift History"
        showBack={false}
        subtitle={
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.empIdLabel}>EMP ID: </Text>
            <Text style={styles.empIdValue}>{empId}</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. SEARCH & DATE FILTER ROW ── */}
        <View style={styles.searchDateRow}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={17} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Shift ID..."
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
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Range Button */}
          <TouchableOpacity
            style={styles.datePickerBtn}
            activeOpacity={0.75}
            onPress={() => setIsDateModalVisible(true)}
          >
            <Ionicons name="calendar-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.datePickerText}>{selectedDateRange}</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. FILTER PILLS (All, Paid, Unpaid) ── */}
        <View style={styles.filterPillsRow}>
          {/* All Shifts */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterStatus === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterStatus('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                filterStatus === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              All Shifts ({allCount})
            </Text>
          </TouchableOpacity>

          {/* Paid Shifts */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterStatus === 'paid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterStatus('paid')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                filterStatus === 'paid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Paid Shifts ({paidCount})
            </Text>
          </TouchableOpacity>

          {/* Unpaid Shifts */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterStatus === 'unpaid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterStatus('unpaid')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                filterStatus === 'unpaid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Unpaid Shifts ({unpaidCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. TOTAL SHIFT COLLECTIONS CARD ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>TOTAL SHIFT COLLECTIONS</Text>
          <View style={styles.bigAmountRow}>
            <Text style={styles.bigAmountDollar}>$</Text>
            <Text style={styles.bigAmountWhole}>3,840</Text>
            <Text style={styles.bigAmountCents}>.00</Text>
          </View>

          {/* Dual Segment Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarGreen, { flex: 3480 }]} />
            <View style={[styles.progressBarOrange, { flex: 360 }]} />
          </View>

          {/* 2 Bottom Metric Boxes */}
          <View style={styles.metricsBoxesRow}>
            {/* Settled / Paid */}
            <View style={styles.metricBoxPaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.dotGreen} />
                <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
              </View>
              <Text style={styles.metricPaidAmount}>$3,480.00</Text>
              <Text style={styles.metricBoxSub}>10 shifts completed</Text>
            </View>

            {/* Pending / Unpaid */}
            <View style={styles.metricBoxUnpaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.dotOrange} />
                <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
              </View>
              <Text style={styles.metricUnpaidAmount}>$360.00</Text>
              <Text style={styles.metricBoxSub}>2 shifts awaiting</Text>
            </View>
          </View>
        </View>

        {/* ── 4. SHIFT RECORDS HEADER ── */}
        <View style={styles.recordsSectionHeader}>
          <Text style={styles.recordsSectionTitle}>SHIFT RECORDS</Text>
        </View>

        {/* ── 5. SHIFT RECORDS LIST ── */}
        <View style={styles.shiftsList}>
          {filteredShifts.map((shift) => {
            const isPaid = shift.status === 'paid';

            return (
              <TouchableOpacity
                key={shift.id}
                style={[
                  styles.shiftCard,
                  !isPaid && styles.shiftCardUnpaid,
                ]}
                activeOpacity={0.88}
                onPress={() => handleCardPress(shift)}
              >
                {/* Top Row: Shift ID + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardShiftId, !isPaid && styles.cardShiftIdUnpaid]}>
                    {shift.id}
                  </Text>

                  {isPaid ? (
                    <View style={styles.paidBadge}>
                      <View style={styles.paidDot} />
                      <Text style={styles.paidBadgeText}>
                        PAID <Text style={styles.paidDateText}>on {shift.paidDate}</Text>
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unpaidBadge}>
                      <View style={styles.unpaidDot} />
                      <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                    </View>
                  )}
                </View>

                {/* Middle Row: Date/Time + Txns + Total/Pending + View Trips Button */}
                <View style={styles.cardMiddleRow}>
                  <View style={styles.middleLeftCol}>
                    <Text style={styles.cardDateTime}>
                      {shift.dateText} • {shift.timeRange}
                    </Text>

                    <View style={styles.txnsTotalRow}>
                      <View style={[styles.txnsCountPill, !isPaid && styles.txnsCountPillUnpaid]}>
                        <Text style={[styles.txnsCountText, !isPaid && styles.txnsCountTextUnpaid]}>
                          {shift.txnsCount} Txns
                        </Text>
                      </View>

                      <Text style={styles.totalLabel}>
                        {isPaid ? 'Total: ' : 'Pending: '}
                        <Text style={[styles.totalValue, !isPaid && styles.totalValueUnpaid]}>
                          ${shift.totalAmount.toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* View Trips Button */}
                  <TouchableOpacity
                    style={[styles.viewTripsBtn, !isPaid && styles.viewTripsBtnUnpaid]}
                    activeOpacity={0.7}
                    onPress={() => handleCardPress(shift)}
                  >
                    <Text style={[styles.viewTripsText, !isPaid && styles.viewTripsTextUnpaid]}>
                      View Trips
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={15}
                      color={isPaid ? '#2563EB' : '#B45309'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Card & Tap & Go Breakdowns */}
                <View style={styles.breakdownRow}>
                  {/* Card Pill */}
                  <View style={[styles.breakdownPill, !isPaid && styles.breakdownPillUnpaid]}>
                    <Ionicons
                      name="card-outline"
                      size={13}
                      color={isPaid ? '#64748B' : '#B45309'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.breakdownText, !isPaid && styles.breakdownTextUnpaid]}>
                      Card:{' '}
                      <Text style={styles.breakdownBold}>
                        {shift.cardTxns} txns • ${shift.cardAmount.toFixed(2)}
                      </Text>
                    </Text>
                  </View>

                  {/* Tap & Go Pill */}
                  <View style={[styles.breakdownPill, !isPaid && styles.breakdownPillUnpaid]}>
                    <Ionicons
                      name="radio-outline"
                      size={13}
                      color={isPaid ? '#64748B' : '#B45309'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.breakdownText, !isPaid && styles.breakdownTextUnpaid]}>
                      Tap & Go:{' '}
                      <Text style={styles.breakdownBold}>
                        {shift.tapTxns} txns • ${shift.tapAmount.toFixed(2)}
                      </Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── DATE RANGE PICKER MODAL ── */}
      <Modal
        visible={isDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDateModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsDateModalVisible(false)}
        >
          <View style={styles.dateModalBox}>
            <Text style={styles.dateModalTitle}>Select Date Range</Text>
            {['20–26 Oct 2026', '13–19 Oct 2026', '06–12 Oct 2026', 'All Dates'].map(
              (range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.dateOptionRow,
                    selectedDateRange === range && styles.dateOptionRowActive,
                  ]}
                  onPress={() => {
                    setSelectedDateRange(range);
                    setIsDateModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dateOptionText,
                      selectedDateRange === range && styles.dateOptionTextActive,
                    ]}
                  >
                    {range}
                  </Text>
                  {selectedDateRange === range && (
                    <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  empIdLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  empIdValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },

  /* 1. Search & Date Filter Row */
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  datePickerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* 2. Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#475569',
  },

  /* 3. Summary Card */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bigAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  bigAmountDollar: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  bigAmountWhole: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bigAmountCents: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748B',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  progressBarGreen: {
    backgroundColor: '#059669',
    height: '100%',
  },
  progressBarOrange: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  metricsBoxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  dotOrange: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  metricBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  metricPaidAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 2,
  },
  metricUnpaidAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
    marginBottom: 2,
  },
  metricBoxSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* 4. Records Section Header */
  recordsSectionHeader: {
    marginBottom: 10,
  },
  recordsSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },

  /* 5. Shifts List & Cards */
  shiftsList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  shiftCardUnpaid: {
    backgroundColor: '#FFFDF7',
    borderColor: '#FEF08A',
    borderWidth: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardShiftId: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardShiftIdUnpaid: {
    color: '#B45309',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  paidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },
  paidDateText: {
    fontWeight: '600',
    color: '#059669',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  unpaidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  unpaidBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  middleLeftCol: {
    flex: 1,
  },
  cardDateTime: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  txnsTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txnsCountPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  txnsCountPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  txnsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  txnsCountTextUnpaid: {
    color: '#B45309',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValueUnpaid: {
    color: '#B45309',
  },
  viewTripsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  viewTripsBtnUnpaid: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  viewTripsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewTripsTextUnpaid: {
    color: '#B45309',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  breakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  breakdownPillUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  breakdownText: {
    fontSize: 10.5,
    color: '#64748B',
  },
  breakdownTextUnpaid: {
    color: '#92400E',
  },
  breakdownBold: {
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Modal Backdrop & Date Options */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dateModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  dateOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dateOptionRowActive: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dateOptionText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '500',
  },
  dateOptionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

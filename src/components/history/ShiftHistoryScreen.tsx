import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_SHIFTS, MOCK_SHIFT_STATS } from '../../data/mockShifts';
import { ShiftRecord } from '../../types/shift';
import HeaderBar from '../common/HeaderBar';

interface ShiftHistoryScreenProps {
  onSelectShift: (shift: ShiftRecord) => void;
  taxiNumber?: string;
}

type ShiftFilterType = 'all' | 'paid' | 'unpaid';

interface TaxiDriver {
  id: string;
  name: string;
  taxiNumber: string;
  dcNumber: string;
  avatar: any;
  status: 'active' | 'off_shift';
}

const DRIVERS_LIST: TaxiDriver[] = [
  {
    id: 'drv_1',
    name: 'Lovedeep Kangura',
    taxiNumber: 'M6061',
    dcNumber: '93821048',
    avatar: require('../../../assets/emp_avatar_1.png'),
    status: 'active',
  },
  {
    id: 'drv_2',
    name: 'Gurpreet Singh',
    taxiNumber: 'M6062',
    dcNumber: '93821049',
    avatar: require('../../../assets/emp_avatar_2.png'),
    status: 'active',
  },
  {
    id: 'drv_3',
    name: 'Harpreet Dhillon',
    taxiNumber: 'M6063',
    dcNumber: '93821050',
    avatar: require('../../../assets/emp_avatar_3.png'),
    status: 'active',
  },
  {
    id: 'drv_4',
    name: 'Manpreet Sandhu',
    taxiNumber: 'M6064',
    dcNumber: '93821051',
    avatar: require('../../../assets/emp_avatar_4.png'),
    status: 'off_shift',
  },
];

export default function ShiftHistoryScreen({
  onSelectShift,
}: ShiftHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ShiftFilterType>('all');
  const [dateRangeText, setDateRangeText] = useState('20–26 Oct 2026');
  const [selectedDriver, setSelectedDriver] = useState<TaxiDriver>(DRIVERS_LIST[0]);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false);

  // Filter shifts based on pill tab & search input
  const filteredShifts = useMemo(() => {
    return MOCK_SHIFTS.filter((shift) => {
      // Tab filter
      if (filterType === 'paid' && shift.status !== 'paid') return false;
      if (filterType === 'unpaid' && shift.status !== 'unpaid') return false;

      // Search filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = shift.id.toLowerCase().includes(query);
        const matchTaxi = shift.taxiNumber.toLowerCase().includes(query);
        const matchDate = shift.dateText.toLowerCase().includes(query);
        if (!matchId && !matchTaxi && !matchDate) return false;
      }

      return true;
    });
  }, [filterType, searchQuery]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Common Header Bar (Centered title, no back button) */}
      <HeaderBar title="Shift History" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── SELECT DRIVER SECTION ── */}
        <View style={styles.driverSectionHeader}>
          <Text style={styles.driverSectionLabel}>SELECT DRIVER</Text>
          <View style={styles.totalDriversBadge}>
            <Text style={styles.totalDriversBadgeText}>{DRIVERS_LIST.length} Total</Text>
          </View>
        </View>

        {/* Driver Selector Card */}
        <TouchableOpacity
          style={styles.driverCard}
          activeOpacity={0.8}
          onPress={() => setIsDriverModalVisible(true)}
        >
          <View style={styles.driverCardLeft}>
            <Image source={selectedDriver.avatar} style={styles.driverAvatar} />
            <Text style={styles.driverName}>{selectedDriver.name}</Text>
            <View style={styles.taxiNoBadge}>
              <Text style={styles.taxiNoBadgeText}>{selectedDriver.taxiNumber}</Text>
            </View>
          </View>
          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </View>
        </TouchableOpacity>

        {/* ── SEARCH & DATE RANGE FILTER ROW ── */}
        <View style={styles.searchDateRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={17} color="#94A3B8" style={styles.searchIcon} />
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
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.dateFilterButton}
            activeOpacity={0.8}
            onPress={() => {
              setDateRangeText((prev) =>
                prev === '20–26 Oct 2026' ? 'All Dates' : '20–26 Oct 2026'
              );
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.dateFilterText}>{dateRangeText}</Text>
          </TouchableOpacity>
        </View>

        {/* ── FILTER PILLS ── */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'all'
                  ? styles.filterPillTextActive
                  : styles.filterPillTextInactive,
              ]}
            >
              All Shifts ({MOCK_SHIFT_STATS.allShiftsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'paid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('paid')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'paid'
                  ? styles.filterPillTextActive
                  : styles.filterPillTextInactive,
              ]}
            >
              Paid Shifts ({MOCK_SHIFT_STATS.paidShiftsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              filterType === 'unpaid' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => setFilterType('unpaid')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                filterType === 'unpaid'
                  ? styles.filterPillTextActive
                  : styles.filterPillTextInactive,
              ]}
            >
              Unpaid Shifts ({MOCK_SHIFT_STATS.unpaidShiftsCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TOTAL SHIFT COLLECTIONS CARD ── */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>TOTAL SHIFT COLLECTIONS</Text>

          <View style={styles.amountDisplayRow}>
            <Text style={styles.amountBig}>
              ${Math.floor(MOCK_SHIFT_STATS.totalCollection).toLocaleString('en-US')}
            </Text>
            <Text style={styles.amountCents}>.00</Text>
          </View>

          {/* Ratio Progress Bar */}
          <View style={styles.ratioBarContainer}>
            <View style={[styles.ratioBarGreen, { flex: 9 }]} />
            <View style={[styles.ratioBarAmber, { flex: 1 }]} />
          </View>

          {/* Sub-Metric Boxes */}
          <View style={styles.metricBoxesRow}>
            {/* Box 1: Settled / Paid */}
            <View style={styles.metricBoxPaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.bulletPaid} />
                <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
              </View>
              <Text style={styles.metricPaidAmount}>
                ${MOCK_SHIFT_STATS.paidAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.metricSubtext}>
                {MOCK_SHIFT_STATS.paidShiftsCount} shifts completed
              </Text>
            </View>

            {/* Box 2: Pending / Unpaid */}
            <View style={styles.metricBoxUnpaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.bulletUnpaid} />
                <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
              </View>
              <Text style={styles.metricUnpaidAmount}>
                ${MOCK_SHIFT_STATS.unpaidAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.metricSubtext}>
                {MOCK_SHIFT_STATS.unpaidShiftsCount} shifts awaiting
              </Text>
            </View>
          </View>
        </View>

        {/* ── SHIFT RECORDS HEADING ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SHIFT RECORDS</Text>
        </View>

        {/* ── SHIFT RECORDS LIST ── */}
        {filteredShifts.map((shift) => {
          const isUnpaid = shift.status === 'unpaid';

          return (
            <View
              key={shift.id}
              style={[styles.shiftCard, isUnpaid && styles.shiftCardUnpaid]}
            >
              {/* Header: ID + Status Badge */}
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[styles.shiftIdText, isUnpaid && styles.shiftIdTextUnpaid]}
                  numberOfLines={1}
                >
                  {shift.id}
                </Text>

                {isUnpaid ? (
                  <View style={styles.unpaidBadge}>
                    <View style={styles.unpaidDot} />
                    <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                  </View>
                ) : (
                  <View style={styles.paidBadge}>
                    <View style={styles.paidDot} />
                    <Text style={styles.paidBadgeText}>
                      PAID{shift.paidDate ? ` on ${shift.paidDate}` : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Time Range */}
              <Text style={styles.dateRangeText}>
                {shift.dateText} • {shift.timeRange}
              </Text>

              {/* Middle Row: Trips + Total/Pending + View Trips Button */}
              <View style={styles.cardMiddleRow}>
                <View style={styles.tripsAndAmountRow}>
                  <View style={[styles.tripsPill, isUnpaid && styles.tripsPillUnpaid]}>
                    <Text style={[styles.tripsPillText, isUnpaid && styles.tripsPillTextUnpaid]}>
                      {shift.tripsCount} Trips
                    </Text>
                  </View>

                  <Text style={styles.totalLabelText}>
                    {isUnpaid ? 'Pending: ' : 'Total: '}
                    <Text style={[styles.totalAmountValue, isUnpaid && styles.pendingAmountValue]}>
                      ${shift.totalAmount.toFixed(2)}
                    </Text>
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.viewTripsBtn, isUnpaid && styles.viewTripsBtnUnpaid]}
                  onPress={() => onSelectShift(shift)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.viewTripsBtnText,
                      isUnpaid && styles.viewTripsBtnTextUnpaid,
                    ]}
                  >
                    View Trips
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isUnpaid ? '#D97706' : '#2563EB'}
                  />
                </TouchableOpacity>
              </View>

              {/* Bottom Row: Breakdown Pills */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownPill}>
                  <Ionicons name="card-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                  <Text style={styles.breakdownPillText}>
                    Card: <Text style={styles.breakdownPillBold}>{shift.cardCount} txns • ${shift.cardAmount.toFixed(2)}</Text>
                  </Text>
                </View>

                <View style={styles.breakdownPill}>
                  <Ionicons name="flash-outline" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                  <Text style={styles.breakdownPillText}>
                    Tap & Go: <Text style={styles.breakdownPillBold}>{shift.tapAndGoCount} txns • ${shift.tapAndGoAmount.toFixed(2)}</Text>
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ── DRIVER SELECTION MODAL ── */}
      <Modal
        visible={isDriverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDriverModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsDriverModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.modalTitle}>Select Taxi Driver</Text>
            <Text style={styles.modalSubtitle}>Filter shifts by driver & fleet vehicle</Text>

            {DRIVERS_LIST.map((drv) => {
              const isSelected = drv.id === selectedDriver.id;
              return (
                <TouchableOpacity
                  key={drv.id}
                  style={[
                    styles.driverOptionRow,
                    isSelected && styles.driverOptionRowActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedDriver(drv);
                    setIsDriverModalVisible(false);
                  }}
                >
                  <Image source={drv.avatar} style={styles.modalDriverAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.modalDriverName}>{drv.name}</Text>
                    <Text style={styles.modalDriverMeta}>
                      Taxi {drv.taxiNumber} • DC {drv.dcNumber}
                    </Text>
                  </View>
                  <View style={styles.taxiNoBadge}>
                    <Text style={styles.taxiNoBadgeText}>{drv.taxiNumber}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#2563EB"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* Driver Section */
  driverSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  driverSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  totalDriversBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalDriversBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#FDE047',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  driverCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  driverName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  taxiNoBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  taxiNoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search & Date Filter */
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    gap: 6,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#475569',
  },

  /* Stats Card */
  statsCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  amountBig: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountCents: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748B',
  },
  ratioBarContainer: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  ratioBarGreen: {
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  ratioBarAmber: {
    backgroundColor: '#F59E0B',
    borderRadius: 3,
    marginLeft: 2,
  },
  metricBoxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 14,
    padding: 12,
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  bulletPaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  bulletUnpaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  metricBoxTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  metricPaidAmount: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2,
  },
  metricUnpaidAmount: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* Section Header */
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },

  /* Shift Records Card */
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  shiftCardUnpaid: {
    borderColor: '#FDE047',
    borderWidth: 1.4,
    backgroundColor: '#FFFDF9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shiftIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  shiftIdTextUnpaid: {
    color: '#D97706',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  paidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '800',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  unpaidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    color: '#D97706',
    fontSize: 9.5,
    fontWeight: '800',
  },
  dateRangeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 10,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripsAndAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripsPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripsPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  tripsPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  tripsPillTextUnpaid: {
    color: '#B45309',
  },
  totalLabelText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  totalAmountValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingAmountValue: {
    color: '#D97706',
  },
  viewTripsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  viewTripsBtnUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  viewTripsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewTripsBtnTextUnpaid: {
    color: '#D97706',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  breakdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  breakdownPillText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  breakdownPillBold: {
    color: '#0F172A',
    fontWeight: '700',
  },

  /* Driver Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 16,
  },
  driverOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  driverOptionRowActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  modalDriverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  modalDriverName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDriverMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
});

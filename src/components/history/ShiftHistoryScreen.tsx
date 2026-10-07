import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { MOCK_SHIFTS, MOCK_SHIFT_STATS } from '../../data/mockShifts';
import { ShiftRecord } from '../../types/shift';

interface ShiftHistoryScreenProps {
  onSelectShift: (shift: ShiftRecord) => void;
  taxiNumber?: string;
}

type ShiftFilterType = 'all' | 'paid' | 'unpaid';

export default function ShiftHistoryScreen({
  onSelectShift,
  taxiNumber = 'M6061',
}: ShiftHistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ShiftFilterType>('all');
  const [dateRangeText, setDateRangeText] = useState('20–26 Oct 2026');

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Shift History</Text>
        <View style={styles.taxiNumberRow}>
          <Text style={styles.taxiNumberLabel}>Taxi No.: </Text>
          <Text style={styles.taxiNumberValue}>{taxiNumber}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search & Date Range Filter Row */}
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
              // Toggle or select range
              setDateRangeText((prev) => (prev === '20–26 Oct 2026' ? 'All Dates' : '20–26 Oct 2026'));
            }}
          >
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.dateFilterText}>{dateRangeText}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
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
                filterType === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
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
                filterType === 'paid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
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
                filterType === 'unpaid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Unpaid Shifts ({MOCK_SHIFT_STATS.unpaidShiftsCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Shift Collections Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsTopGlow} />

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
                ${MOCK_SHIFT_STATS.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                ${MOCK_SHIFT_STATS.unpaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.metricSubtext}>
                {MOCK_SHIFT_STATS.unpaidShiftsCount} shifts awaiting
              </Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SHIFT RECORDS</Text>
          <Text style={styles.sectionSubtitle}>
            Displaying {filteredShifts.length} {filteredShifts.length === 1 ? 'record' : 'recent'}
          </Text>
        </View>

        {/* Shift Records List */}
        {filteredShifts.map((shift) => {
          const isUnpaid = shift.status === 'unpaid';

          return (
            <View
              key={shift.id}
              style={[
                styles.shiftCard,
                isUnpaid && styles.shiftCardUnpaid,
              ]}
            >
              {/* Card Header Row: ID + Status Badge */}
              <View style={styles.cardHeaderRow}>
                <Text
                  style={[
                    styles.shiftIdText,
                    isUnpaid && styles.shiftIdTextUnpaid,
                  ]}
                  numberOfLines={1}
                >
                  {shift.id}
                </Text>

                {isUnpaid ? (
                  <View style={styles.unpaidBadge}>
                    <View style={styles.unpaidBadgeDot} />
                    <Text style={styles.unpaidBadgeText}>UNPAID</Text>
                  </View>
                ) : (
                  <View style={styles.paidBadge}>
                    <View style={styles.paidBadgeDot} />
                    <Text style={styles.paidBadgeText}>
                      PAID{shift.paidDate ? ` on ${shift.paidDate}` : ''}
                    </Text>
                  </View>
                )}
              </View>

              {/* Date & Time Row */}
              <Text style={styles.shiftDateTimeText}>
                {shift.dateText} • {shift.timeRange}
              </Text>

              {/* Trips & Total / Pending Row */}
              <View style={styles.tripsAndTotalRow}>
                <View style={styles.tripsCountGroup}>
                  <View
                    style={[
                      styles.tripsBadge,
                      isUnpaid && styles.tripsBadgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tripsBadgeText,
                        isUnpaid && styles.tripsBadgeTextUnpaid,
                      ]}
                    >
                      {shift.tripsCount} Trips
                    </Text>
                  </View>

                  <View style={styles.amountLabelGroup}>
                    <Text style={styles.amountLabelText}>
                      {isUnpaid ? 'Pending:' : 'Total:'}
                    </Text>
                    <Text
                      style={[
                        styles.cardAmountValue,
                        isUnpaid && styles.cardAmountValueUnpaid,
                      ]}
                    >
                      {' '}
                      ${shift.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* View Trips Button */}
                <TouchableOpacity
                  style={[
                    styles.viewTripsButton,
                    isUnpaid && styles.viewTripsButtonUnpaid,
                  ]}
                  onPress={() => onSelectShift(shift)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.viewTripsButtonText,
                      isUnpaid && styles.viewTripsButtonTextUnpaid,
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

              {/* Breakdown Chips Row */}
              <View style={styles.breakdownChipsRow}>
                {/* Card Chip */}
                <View
                  style={[
                    styles.breakdownChip,
                    isUnpaid && styles.breakdownChipUnpaid,
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={14}
                    color={isUnpaid ? '#D97706' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.chipLabel}>Card: </Text>
                  <Text style={styles.chipValue}>
                    {shift.cardCount} txns • ${shift.cardAmount.toFixed(2)}
                  </Text>
                </View>

                {/* Tap & Go Chip */}
                <View
                  style={[
                    styles.breakdownChip,
                    isUnpaid && styles.breakdownChipUnpaid,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="contactless-payment"
                    size={15}
                    color={isUnpaid ? '#D97706' : '#0284C7'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.chipLabel}>Tap & Go: </Text>
                  <Text style={styles.chipValue}>
                    {shift.tapAndGoCount} txns • ${shift.tapAndGoAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {filteredShifts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={36} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Shifts Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filter or search query</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  taxiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taxiNumberLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  taxiNumberValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
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
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#475569',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statsTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F59E0B',
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  amountBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountCents: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  ratioBarGreen: {
    backgroundColor: '#10B981',
  },
  ratioBarAmber: {
    backgroundColor: '#F59E0B',
  },
  metricBoxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    padding: 12,
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  bulletPaid: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  bulletUnpaid: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  metricBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  metricPaidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  metricUnpaidAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  shiftCardUnpaid: {
    borderColor: '#FDE68A',
    borderWidth: 1.2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  shiftIdTextUnpaid: {
    color: '#92400E',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  paidBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  unpaidBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  unpaidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  shiftDateTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 10,
  },
  tripsAndTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripsCountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripsBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tripsBadgeUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  tripsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  tripsBadgeTextUnpaid: {
    color: '#92400E',
  },
  amountLabelGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountLabelText: {
    fontSize: 13,
    color: '#64748B',
  },
  cardAmountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardAmountValueUnpaid: {
    color: '#D97706',
  },
  viewTripsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 3,
  },
  viewTripsButtonUnpaid: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  viewTripsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  viewTripsButtonTextUnpaid: {
    color: '#D97706',
  },
  breakdownChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  breakdownChipUnpaid: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FEF08A',
  },
  chipLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});

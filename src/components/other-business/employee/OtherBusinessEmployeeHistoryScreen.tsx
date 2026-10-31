import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import HeaderBar from '../../common/HeaderBar';
import {
  shiftService,
  ShiftHistoryData,
  ShiftRecordItem,
} from '../../../services/shiftService';
import { formatShiftRecordTime } from '../../../utils/dateUtils';

export interface EmployeeShiftItem {
  id: string;
  dateKey: string;
  dateText: string;
  timeRange: string;
  status: 'paid' | 'unpaid' | string;
  paidDate?: string;
  totalAmount: number;
  txnsCount: number;
  cardTxns: number;
  cardAmount: number;
  tapTxns: number;
  tapAmount: number;
}

interface OtherBusinessEmployeeHistoryScreenProps {
  userName?: string;
  empId?: string;
  onSelectShift?: (shift: { id: string }) => void;
}

export default function OtherBusinessEmployeeHistoryScreen({
  empId = 'EMP2026100720101878',
  onSelectShift,
}: OtherBusinessEmployeeHistoryScreenProps) {
  const [shiftHistoryData, setShiftHistoryData] = useState<ShiftHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState('All Dates');
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  const fetchHistory = useCallback(
    async (status?: string, search?: string, isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const params: any = {};
        if (status && status !== 'all') {
          params.status = status;
        }
        if (search && search.trim().length > 0) {
          params.search = search.trim();
        }

        const res = await shiftService.getShiftHistory(params);
        if (res?.data) {
          setShiftHistoryData(res.data);
          if (res.data.filters?.date_range) {
            setSelectedDateRange(res.data.filters.date_range);
          }
        }
      } catch (err: any) {
        console.warn('Failed to load employee shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Initial load via asynchronous promise resolution to comply with React 19 effect purity
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftHistory({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted || !res?.data) return;
        setShiftHistoryData(res.data);
        if (res.data.filters?.date_range) {
          setSelectedDateRange(res.data.filters.date_range);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load employee shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filterStatus, searchQuery]);

  const handleRefresh = () => {
    fetchHistory(filterStatus, searchQuery, true);
  };

  const handleTabPress = (type: 'all' | 'paid' | 'unpaid') => {
    setFilterStatus(type);
    fetchHistory(type, searchQuery);
  };

  const handleSearchSubmit = () => {
    fetchHistory(filterStatus, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchHistory(filterStatus, '');
  };

  const filteredShifts: ShiftRecordItem[] = useMemo(() => {
    const list = shiftHistoryData?.shift_records || [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter((shift) => {
      const matchId = (shift.display_shift_id || '').toLowerCase().includes(query);
      const matchDate = (shift.session_date || '').toLowerCase().includes(query);
      const matchTime = (shift.time_range || '').toLowerCase().includes(query);
      const matchAmount = (shift.amount_formatted || '').toLowerCase().includes(query);
      return matchId || matchDate || matchTime || matchAmount;
    });
  }, [shiftHistoryData?.shift_records, searchQuery]);

  const allCount = shiftHistoryData?.filters?.tabs?.all_shifts?.count ?? 0;
  const paidCount = shiftHistoryData?.filters?.tabs?.paid_shifts?.count ?? 0;
  const unpaidCount = shiftHistoryData?.filters?.tabs?.unpaid_shifts?.count ?? 0;

  const summary = shiftHistoryData?.summary;
  const totalCollections = summary?.total_shift_collections ?? 0;
  const wholeAmount = Math.floor(totalCollections).toLocaleString('en-US');
  const centsAmount = (totalCollections.toFixed(2)).split('.')[1] || '00';
  const paidPercentage = summary?.paid_percentage ?? 0;

  const handleCardPress = (shift: ShiftRecordItem) => {
    if (onSelectShift) {
      onSelectShift({ id: shift.display_shift_id || String(shift.id) });
    }
  };

  const displayEmpId = shiftHistoryData?.header?.emp_id || empId;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── HEADER BAR (Centered Title & EMP ID Subtitle) ── */}
      <HeaderBar
        title={shiftHistoryData?.header?.title || 'Shift History'}
        showBack={false}
        subtitle={
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.empIdLabel}>EMP ID: </Text>
            <Text style={styles.empIdValue}>{displayEmpId}</Text>
          </View>
        }
      />

      <ScrollView
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
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleClearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Date Range Badge */}
          <View style={styles.datePickerBtn}>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
            <Text style={styles.datePickerText} numberOfLines={1}>
              {selectedDateRange}
            </Text>
          </View>
        </View>

        {/* ── 2. FILTER PILLS (All, Paid, Unpaid) ── */}
        <View style={styles.filterPillsRow}>
          {/* All Shifts */}
          <TouchableOpacity
            style={[
              styles.filterPill,
              filterStatus === 'all' ? styles.filterPillActive : styles.filterPillInactive,
            ]}
            onPress={() => handleTabPress('all')}
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
            onPress={() => handleTabPress('paid')}
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
            onPress={() => handleTabPress('unpaid')}
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
            <Text style={styles.bigAmountWhole}>{wholeAmount}</Text>
            <Text style={styles.bigAmountCents}>.{centsAmount}</Text>
          </View>

          {/* Dual Segment Progress Bar */}
          <View style={styles.progressBarTrack}>
            {summary && summary.total_shift_collections > 0 ? (
              <>
                <View
                  style={[
                    styles.progressBarGreen,
                    { flex: Math.max(0.01, paidPercentage) },
                  ]}
                />
                <View
                  style={[
                    styles.progressBarOrange,
                    { flex: Math.max(0.01, 100 - paidPercentage) },
                  ]}
                />
              </>
            ) : (
              <View style={[styles.progressBarNeutral, { flex: 1 }]} />
            )}
          </View>

          {/* 2 Bottom Metric Boxes */}
          <View style={styles.metricsBoxesRow}>
            {/* Settled / Paid */}
            <View style={styles.metricBoxPaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.dotGreen} />
                <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
              </View>
              <Text style={styles.metricPaidAmount}>
                {summary?.settled_paid_formatted || '$0.00'}
              </Text>
              <Text style={styles.metricBoxSub}>
                {summary?.settled_paid_subtitle || '0 shifts completed'}
              </Text>
            </View>

            {/* Pending / Unpaid */}
            <View style={styles.metricBoxUnpaid}>
              <View style={styles.metricBoxHeader}>
                <View style={styles.dotOrange} />
                <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
              </View>
              <Text style={styles.metricUnpaidAmount}>
                {summary?.pending_unpaid_formatted || '$0.00'}
              </Text>
              <Text style={styles.metricBoxSub}>
                {summary?.pending_unpaid_subtitle || '0 shifts awaiting'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 4. SHIFT RECORDS HEADER ── */}
        <View style={styles.recordsSectionHeader}>
          <Text style={styles.recordsSectionTitle}>SHIFT RECORDS</Text>
        </View>

        {/* Loading Spinner */}
        {isLoading && !shiftHistoryData && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D97706" />
            <Text style={styles.loadingText}>Loading shift history...</Text>
          </View>
        )}

        {/* Error Alert */}
        {errorMessage && !isLoading && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* ── 5. SHIFT RECORDS LIST ── */}
        <View style={styles.shiftsList}>
          {!isLoading &&
            filteredShifts.map((shift) => {
              const isPaid = shift.status === 'PAID';
              const { dateText, timeRangeText } = formatShiftRecordTime({
                start_at: shift.start_at,
                end_at: shift.end_at,
                time_range: shift.time_range,
                session_date: shift.session_date,
              });

              return (
                <TouchableOpacity
                  key={String(shift.id)}
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
                      {shift.display_shift_id}
                    </Text>

                    {isPaid ? (
                      <View style={styles.paidBadge}>
                        <View style={styles.paidDot} />
                        <Text style={styles.paidBadgeText}>
                          PAID{shift.paid_date ? ` on ${shift.paid_date}` : ''}
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
                      {shift.user_name ? (
                        <View style={styles.shiftCardEmployeeRow}>
                          <Ionicons
                            name="person-outline"
                            size={12}
                            color="#475569"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.shiftCardEmployeeName} numberOfLines={1}>
                            {shift.user_name}
                            {shift.employee_code ? (
                              <Text style={styles.shiftCardEmployeeCode}>
                                {' '}• {shift.employee_code}
                              </Text>
                            ) : null}
                          </Text>
                        </View>
                      ) : null}

                      <Text style={styles.cardDateTime}>
                        {dateText} • {timeRangeText}
                      </Text>

                      <View style={styles.txnsTotalRow}>
                        <View style={[styles.txnsCountPill, !isPaid && styles.txnsCountPillUnpaid]}>
                          <Text style={[styles.txnsCountText, !isPaid && styles.txnsCountTextUnpaid]}>
                            {shift.total_txns} Txns
                          </Text>
                        </View>

                        <Text style={styles.totalLabel}>
                          {isPaid ? 'Total: ' : 'Pending: '}
                          <Text style={[styles.totalValue, !isPaid && styles.totalValueUnpaid]}>
                            {shift.amount_formatted}
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
                          {shift.card?.txns ?? 0} txns • {shift.card?.amount_formatted ?? '$0.00'}
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
                          {shift.tap_and_go?.txns ?? 0} txns • {shift.tap_and_go?.amount_formatted ?? '$0.00'}
                        </Text>
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

          {!isLoading && filteredShifts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Shifts Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
            </View>
          )}
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
            {['All Dates'].map((range) => (
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
                  <Ionicons name="checkmark" size={18} color="#D97706" />
                )}
              </TouchableOpacity>
            ))}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  empIdLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  empIdValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* 1. Search & Date Filter Row */
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
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
    height: 42,
  },
  datePickerText: {
    fontSize: 12.5,
    fontWeight: '600',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
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
    color: '#64748B',
  },

  /* 3. Summary Card */
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bigAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bigAmountDollar: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
    marginRight: 2,
  },
  bigAmountWhole: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bigAmountCents: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
  },
  progressBarTrack: {
    flexDirection: 'row',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarGreen: {
    backgroundColor: '#10B981',
  },
  progressBarOrange: {
    backgroundColor: '#F59E0B',
  },
  progressBarNeutral: {
    backgroundColor: '#CBD5E1',
  },
  metricsBoxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  dotOrange: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  metricBoxTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  metricPaidAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  metricUnpaidAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  metricBoxSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },

  /* 4. Records Section Header */
  recordsSectionHeader: {
    marginBottom: 10,
  },
  recordsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 10,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  /* 5. Shifts List */
  shiftsList: {
    gap: 10,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  shiftCardUnpaid: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFEFA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardShiftId: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardShiftIdUnpaid: {
    color: '#0F172A',
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
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  paidDateText: {
    fontWeight: '500',
    color: '#047857',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
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
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  middleLeftCol: {
    flex: 1,
  },
  shiftCardEmployeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftCardEmployeeName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftCardEmployeeCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cardDateTime: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
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
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  txnsCountPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  txnsCountText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  txnsCountTextUnpaid: {
    color: '#92400E',
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  totalValueUnpaid: {
    color: '#D97706',
  },
  viewTripsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 2,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  viewTripsBtnUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  viewTripsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewTripsTextUnpaid: {
    color: '#B45309',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  breakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownPillUnpaid: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF7',
  },
  breakdownText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  breakdownTextUnpaid: {
    color: '#92400E',
  },
  breakdownBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 3,
  },

  /* Date Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dateModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  dateModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
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
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  dateOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  dateOptionTextActive: {
    color: '#D97706',
    fontWeight: '700',
  },
});

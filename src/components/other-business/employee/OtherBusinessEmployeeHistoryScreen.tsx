import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import HeaderBar from '../../common/HeaderBar';
import DateRangePickerModal from '../../common/DateRangePickerModal';
import {
  shiftService,
  ShiftHistoryData,
  ShiftRecordItem,
  onShiftChange,
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
  const PAGE_LIMIT = 10;

  // API State
  const [shiftHistoryData, setShiftHistoryData] = useState<ShiftHistoryData | null>(null);
  const [shiftRecords, setShiftRecords] = useState<ShiftRecordItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('All Dates');
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  const activeSearchRef = useRef<string>('');
  const isInitialMount = useRef<boolean>(true);

  // Core API fetcher supporting pagination, date range, search, and status
  const fetchHistory = useCallback(
    async ({
      page = 1,
      status = filterStatus,
      search = searchQuery,
      startDateVal = startDate,
      endDateVal = endDate,
      isRefresh = false,
      isLoadMore = false,
    }: {
      page?: number;
      status?: 'all' | 'paid' | 'unpaid';
      search?: string;
      startDateVal?: string | null;
      endDateVal?: string | null;
      isRefresh?: boolean;
      isLoadMore?: boolean;
    } = {}) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const params: any = {
          page,
          limit: PAGE_LIMIT,
        };
        if (status && status !== 'all') {
          params.status = status;
        }
        if (search && search.trim().length > 0) {
          params.search = search.trim();
        }
        if (startDateVal) {
          params.start_date = startDateVal;
        }
        if (endDateVal) {
          params.end_date = endDateVal;
        }

        const res = await shiftService.getShiftHistory(params);
        if (res?.data) {
          setShiftHistoryData(res.data);
          const newRecords = res.data.shift_records || [];

          if (page === 1) {
            setShiftRecords(newRecords);
          } else {
            setShiftRecords((prev) => {
              const seen = new Set(prev.map((s) => s.id ?? s.shift_id));
              const unique = newRecords.filter((s) => !seen.has(s.id ?? s.shift_id));
              return [...prev, ...unique];
            });
          }
          setCurrentPage(page);

          // Determine pagination end
          const pagination = res.data.pagination || (res as any).pagination;
          if (pagination) {
            if (typeof pagination.has_more === 'boolean') {
              setHasMore(pagination.has_more);
            } else if (typeof pagination.has_more_pages === 'boolean') {
              setHasMore(pagination.has_more_pages);
            } else if (pagination.total_pages) {
              setHasMore(page < pagination.total_pages);
            } else {
              setHasMore(newRecords.length >= PAGE_LIMIT);
            }
          } else {
            setHasMore(newRecords.length >= PAGE_LIMIT);
          }

          if (!startDateVal && !endDateVal && res.data.filters?.date_range) {
            setSelectedDateRange(res.data.filters.date_range);
          }
        } else {
          if (page === 1) setShiftRecords([]);
          setHasMore(false);
        }
      } catch (err: any) {
        console.warn('Failed to load employee shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [filterStatus, searchQuery, startDate, endDate]
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftHistory({
        page: 1,
        limit: PAGE_LIMIT,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      .then((res) => {
        if (!isMounted || !res?.data) return;
        setShiftHistoryData(res.data);
        setShiftRecords(res.data.shift_records || []);
        setCurrentPage(1);

        const pagination = res.data.pagination || (res as any).pagination;
        if (pagination) {
          if (typeof pagination.has_more === 'boolean') {
            setHasMore(pagination.has_more);
          } else if (pagination.total_pages) {
            setHasMore(1 < pagination.total_pages);
          } else {
            setHasMore((res.data.shift_records || []).length >= PAGE_LIMIT);
          }
        } else {
          setHasMore((res.data.shift_records || []).length >= PAGE_LIMIT);
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search input to query API smoothly without lagging keystrokes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (searchQuery === activeSearchRef.current) return;

    const timer = setTimeout(() => {
      activeSearchRef.current = searchQuery;
      fetchHistory({ page: 1, search: searchQuery });
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchHistory]);

  const handleRefresh = useCallback(() => {
    fetchHistory({ page: 1, isRefresh: true });
  }, [fetchHistory]);

  const isFirstMountRef = useRef<boolean>(true);

  // Sync shift changes across the app
  useEffect(() => {
    const unsub = onShiftChange(() => {
      fetchHistory({ page: 1, isRefresh: true });
    });
    return () => unsub();
  }, [fetchHistory]);

  // Auto-refresh when navigating to the shift history tab or screen
  useFocusEffect(
    useCallback(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      fetchHistory({ page: 1, isRefresh: true });
    }, [fetchHistory])
  );

  // Scroll pagination: loads next page when employee scrolls near the end
  const handleLoadMore = () => {
    if (isLoading || isRefreshing || isLoadingMore || !hasMore) {
      return;
    }
    fetchHistory({
      page: currentPage + 1,
      isLoadMore: true,
    });
  };

  const handleTabPress = (type: 'all' | 'paid' | 'unpaid') => {
    setFilterStatus(type);
    fetchHistory({ page: 1, status: type });
  };

  const handleSearchSubmit = () => {
    activeSearchRef.current = searchQuery;
    fetchHistory({ page: 1, search: searchQuery });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    activeSearchRef.current = '';
    fetchHistory({ page: 1, search: '' });
  };

  // Handle Date Range Selection
  const handleApplyDateRange = (
    newStart: string | null,
    newEnd: string | null,
    label: string
  ) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setSelectedDateRange(label);
    setIsDateModalVisible(false);
    fetchHistory({
      page: 1,
      startDateVal: newStart,
      endDateVal: newEnd,
    });
  };

  const handleClearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedDateRange('All Dates');
    setIsDateModalVisible(false);
    fetchHistory({
      page: 1,
      startDateVal: null,
      endDateVal: null,
    });
  };

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

      <FlatList
        data={shiftRecords}
        keyExtractor={(item, index) => `${item.id || item.shift_id || index}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#D97706"
            colors={['#D97706']}
          />
        }
        ListHeaderComponent={
          <>
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

              {/* Date Range Button */}
              <TouchableOpacity
                style={[
                  styles.datePickerBtn,
                  (startDate || endDate) && styles.datePickerBtnActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setIsDateModalVisible(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={startDate || endDate ? '#D97706' : '#0F172A'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.datePickerText,
                    (startDate || endDate) && styles.datePickerTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedDateRange}
                </Text>
                {(startDate || endDate) && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleClearDateFilter();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ marginLeft: 3 }}
                  >
                    <Ionicons name="close-circle" size={15} color="#D97706" />
                  </TouchableOpacity>
                )}
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

            {/* Initial Loading Spinner */}
            {isLoading && shiftRecords.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D97706" />
                <Text style={styles.loadingText}>Loading shift history...</Text>
              </View>
            )}

            {/* Error Alert */}
            {errorMessage && shiftRecords.length === 0 && !isLoading && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item: shift }) => {
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
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={32} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Shifts Found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search criteria</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {isLoadingMore && (
              <View style={styles.footerLoadingContainer}>
                <ActivityIndicator size="small" color="#D97706" />
                <Text style={styles.footerLoadingText}>Loading more shifts...</Text>
              </View>
            )}
            {!hasMore && shiftRecords.length > 0 && (
              <View style={styles.footerEndOfList}>
                <Text style={styles.footerEndOfListText}>
                  Showing all {shiftRecords.length} shifts
                </Text>
              </View>
            )}
            <View style={{ height: 32 }} />
          </>
        }
      />

      {/* ── DATE RANGE PICKER MODAL ── */}
      <DateRangePickerModal
        visible={isDateModalVisible}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onClose={() => setIsDateModalVisible(false)}
        onApply={handleApplyDateRange}
      />
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
  datePickerBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  datePickerText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  datePickerTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  footerLoadingContainer: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  footerEndOfList: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerEndOfListText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
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

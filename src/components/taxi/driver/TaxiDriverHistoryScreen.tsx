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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../common/HeaderBar';
import DateRangePickerModal from '../../common/DateRangePickerModal';
import {
  shiftService,
  ShiftHistoryData,
  ShiftRecordItem,
  onShiftChange,
} from '../../../services/shiftService';
import { formatShiftRecordTime } from '../../../utils/dateUtils';

interface TaxiDriverHistoryScreenProps {
  onSelectShift: (shift: ShiftRecordItem | any) => void;
  taxiNumber?: string;
}

type ShiftFilterType = 'all' | 'paid' | 'unpaid';

export default function TaxiDriverHistoryScreen({
  onSelectShift,
  taxiNumber = 'M6022',
}: TaxiDriverHistoryScreenProps) {
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
  const [filterType, setFilterType] = useState<ShiftFilterType>('all');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [dateRangeText, setDateRangeText] = useState('All Dates');
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);

  // Track active search to prevent duplicate requests
  const activeSearchRef = useRef<string>('');
  const isInitialMount = useRef<boolean>(true);

  // Core API fetcher supporting pagination, date range, search, and status filtering
  const fetchShiftHistory = useCallback(
    async ({
      page = 1,
      status = filterType,
      search = searchQuery,
      startDateVal = startDate,
      endDateVal = endDate,
      isRefresh = false,
      isLoadMore = false,
    }: {
      page?: number;
      status?: ShiftFilterType;
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

          // Pagination calculation
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
            setDateRangeText(res.data.filters.date_range);
          }
        } else {
          if (page === 1) setShiftRecords([]);
          setHasMore(false);
        }
      } catch (err: any) {
        console.warn('Failed to load taxi driver shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [filterType, searchQuery, startDate, endDate]
  );

  // Initial load
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftHistory({
        page: 1,
        limit: PAGE_LIMIT,
      })
      .then((res) => {
        if (!isMounted || !res?.data) return;
        setShiftHistoryData(res.data);
        const newRecords = res.data.shift_records || [];
        setShiftRecords(newRecords);
        setCurrentPage(1);

        const pagination = res.data.pagination || (res as any).pagination;
        if (pagination) {
          if (typeof pagination.has_more === 'boolean') {
            setHasMore(pagination.has_more);
          } else if (pagination.total_pages) {
            setHasMore(1 < pagination.total_pages);
          } else {
            setHasMore(newRecords.length >= PAGE_LIMIT);
          }
        } else {
          setHasMore(newRecords.length >= PAGE_LIMIT);
        }

        if (res.data.filters?.date_range) {
          setDateRangeText(res.data.filters.date_range);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load taxi driver shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Debounced Search
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== activeSearchRef.current) {
        activeSearchRef.current = searchQuery.trim();
        fetchShiftHistory({ page: 1, search: searchQuery.trim() });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchShiftHistory]);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    fetchShiftHistory({ page: 1, isRefresh: true });
  }, [fetchShiftHistory]);

  const isFirstMountRef = useRef<boolean>(true);

  // Sync shift changes across the app
  useEffect(() => {
    const unsub = onShiftChange(() => {
      fetchShiftHistory({ page: 1, isRefresh: true });
    });
    return () => unsub();
  }, [fetchShiftHistory]);

  // Auto-refresh when navigating to the shift history tab or screen
  useFocusEffect(
    useCallback(() => {
      if (isFirstMountRef.current) {
        isFirstMountRef.current = false;
        return;
      }
      fetchShiftHistory({ page: 1, isRefresh: true });
    }, [fetchShiftHistory])
  );

  // Infinite Scroll Pagination
  const handleLoadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchShiftHistory({ page: currentPage + 1, isLoadMore: true });
    }
  }, [isLoading, isLoadingMore, hasMore, currentPage, fetchShiftHistory]);

  // Tab Filter Switcher
  const handleTabPress = (type: ShiftFilterType) => {
    if (filterType === type) return;
    setFilterType(type);
    fetchShiftHistory({ page: 1, status: type });
  };

  // Date Range Picker Apply
  const handleApplyDateRange = (start: string | null, end: string | null, displayText: string) => {
    setStartDate(start);
    setEndDate(end);
    setDateRangeText(displayText);
    setIsDateModalVisible(false);
    fetchShiftHistory({
      page: 1,
      startDateVal: start,
      endDateVal: end,
    });
  };

  // Derived Summary & Tab Counts
  const tabs = shiftHistoryData?.filters?.tabs;
  const allCount = tabs?.all_shifts?.count ?? shiftRecords.length;
  const paidCount = tabs?.paid_shifts?.count ?? 0;
  const unpaidCount = tabs?.unpaid_shifts?.count ?? 0;

  const summary = shiftHistoryData?.summary;
  const totalCollections = summary?.total_shift_collections_formatted || '$0.00';
  const settledAmount = summary?.settled_paid_formatted || '$0.00';
  const settledSubtitle = summary?.settled_paid_subtitle || `${summary?.settled_paid_shifts_count ?? 0} shifts completed`;
  const pendingAmount = summary?.pending_unpaid_formatted || '$0.00';
  const pendingSubtitle = summary?.pending_unpaid_subtitle || `${summary?.pending_unpaid_shifts_count ?? 0} shifts awaiting`;

  const totalNumeric = summary?.total_shift_collections || 0;
  const paidNumeric = summary?.settled_paid || 0;
  const greenFlex = totalNumeric > 0 ? Math.max(0.1, (paidNumeric / totalNumeric) * 10) : 1;
  const amberFlex = totalNumeric > 0 ? Math.max(0.1, 10 - greenFlex) : 9;

  // Header taxi number
  const displayTaxiNo = shiftHistoryData?.header?.taxi_no || taxiNumber;

  // Render Shift Record Card
  const renderShiftItem = ({ item: shift }: { item: ShiftRecordItem }) => {
    const isUnpaid = shift.is_paid === false || shift.status === 'UNPAID' || shift.status === 'unpaid';
    const shiftTime = formatShiftRecordTime(shift);
    const displayId = shift.display_shift_id || `SH#${shift.shift_id || shift.id}`;
    const taxiNo = shift.taxi_number || shift.employee_code || '';

    return (
      <View style={[styles.shiftCard, isUnpaid && styles.shiftCardUnpaid]}>
        {/* Header: Shift ID + Status Badge */}
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.shiftIdText, isUnpaid && styles.shiftIdTextUnpaid]} numberOfLines={1}>
            {displayId}
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
                PAID{shift.paid_date ? ` on ${shift.paid_date}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Date & Time Range */}
        <Text style={styles.dateRangeText}>
          {shiftTime.dateText} • {shiftTime.timeRangeText}
          {taxiNo ? ` • Taxi: ${taxiNo}` : ''}
        </Text>

        {/* Middle Row: Trips + Total/Pending Amount + View Trips Button */}
        <View style={styles.cardMiddleRow}>
          <View style={styles.tripsAndAmountRow}>
            <View style={[styles.tripsPill, isUnpaid && styles.tripsPillUnpaid]}>
              <Text style={[styles.tripsPillText, isUnpaid && styles.tripsPillTextUnpaid]}>
                {shift.total_txns ?? 0} Trips
              </Text>
            </View>

            <Text style={styles.totalLabelText}>
              {isUnpaid ? 'Pending: ' : 'Total: '}
              <Text style={[styles.totalAmountValue, isUnpaid && styles.pendingAmountValue]}>
                {shift.amount_formatted || `$${(shift.amount || 0).toFixed(2)}`}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.viewTripsBtn, isUnpaid && styles.viewTripsBtnUnpaid]}
            onPress={() => onSelectShift(shift)}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewTripsBtnText, isUnpaid && styles.viewTripsBtnTextUnpaid]}>
              View Trips
            </Text>
            <Feather
              name="chevron-right"
              size={14}
              color={isUnpaid ? '#B45309' : '#2563EB'}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Row: Breakdown Pills */}
        <View style={styles.breakdownRow}>
          <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
            <Ionicons
              name="card-outline"
              size={13}
              color={isUnpaid ? '#B45309' : '#64748B'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.breakdownPillText, isUnpaid && styles.breakdownPillTextUnpaid]}>
              Card:{' '}
              <Text style={[styles.breakdownPillBold, isUnpaid && styles.breakdownPillBoldUnpaid]}>
                {shift.card?.txns ?? 0} txns • {shift.card?.amount_formatted || `$${(shift.card?.amount || 0).toFixed(2)}`}
              </Text>
            </Text>
          </View>

          <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
            <MaterialCommunityIcons
              name="contactless-payment"
              size={14}
              color={isUnpaid ? '#B45309' : '#2563EB'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.breakdownPillText, isUnpaid && styles.breakdownPillTextUnpaid]}>
              Tap & Go:{' '}
              <Text style={[styles.breakdownPillBold, isUnpaid && styles.breakdownPillBoldUnpaid]}>
                {shift.tap_and_go?.txns ?? 0} txns • {shift.tap_and_go?.amount_formatted || `$${(shift.tap_and_go?.amount || 0).toFixed(2)}`}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // List Header Component
  const renderListHeader = () => (
    <View>
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
          onPress={() => setIsDateModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#0F172A" />
          <Text style={styles.dateFilterText} numberOfLines={1}>
            {dateRangeText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── FILTER PILLS ── */}
      <View style={styles.filterPillsRow}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            filterType === 'all' ? styles.filterPillActive : styles.filterPillInactive,
          ]}
          onPress={() => handleTabPress('all')}
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
            All Shifts ({allCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            filterType === 'paid' ? styles.filterPillActive : styles.filterPillInactive,
          ]}
          onPress={() => handleTabPress('paid')}
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
            Paid Shifts ({paidCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterPill,
            filterType === 'unpaid' ? styles.filterPillActive : styles.filterPillInactive,
          ]}
          onPress={() => handleTabPress('unpaid')}
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
            Unpaid Shifts ({unpaidCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── TOTAL SHIFT COLLECTIONS CARD ── */}
      <View style={styles.statsCard}>
        <LinearGradient
          colors={[
            'rgba(251, 191, 36, 0)',
            '#FBBF24',
            '#F59E0B',
            '#FBBF24',
            'rgba(251, 191, 36, 0)',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cardTopStripe}
        />
        <Text style={styles.statsTitle}>TOTAL SHIFT COLLECTIONS</Text>

        <View style={styles.amountDisplayRow}>
          <Text style={styles.amountBig}>{totalCollections}</Text>
        </View>

        {/* Ratio Progress Bar */}
        <View style={styles.ratioBarContainer}>
          <View style={[styles.ratioBarGreen, { flex: greenFlex }]} />
          <View style={[styles.ratioBarAmber, { flex: amberFlex }]} />
        </View>

        {/* Sub-Metric Boxes */}
        <View style={styles.metricBoxesRow}>
          {/* Settled / Paid */}
          <View style={styles.metricBoxPaid}>
            <View style={styles.metricBoxHeader}>
              <View style={styles.bulletPaid} />
              <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
            </View>
            <Text style={styles.metricPaidAmount}>{settledAmount}</Text>
            <Text style={styles.metricSubtext}>{settledSubtitle}</Text>
          </View>

          {/* Pending / Unpaid */}
          <View style={styles.metricBoxUnpaid}>
            <View style={styles.metricBoxHeader}>
              <View style={styles.bulletUnpaid} />
              <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
            </View>
            <Text style={styles.metricUnpaidAmount}>{pendingAmount}</Text>
            <Text style={styles.metricSubtext}>{pendingSubtitle}</Text>
          </View>
        </View>
      </View>

      {/* ── SHIFT RECORDS HEADING ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>SHIFT RECORDS</Text>
        <Text style={styles.sectionSubtitle}>
          Displaying {shiftRecords.length}
          {shiftHistoryData?.pagination?.total_records
            ? ` of ${shiftHistoryData.pagination.total_records}`
            : ''}
        </Text>
      </View>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar with Taxi Number Subtitle */}
      <HeaderBar
        title="Shift History"
        subtitle={
          <Text style={styles.headerSubtitleText}>
            Taxi No.: <Text style={styles.headerTaxiOrange}>{displayTaxiNo}</Text>
          </Text>
        }
      />

      {isLoading && shiftRecords.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Loading shift history...</Text>
        </View>
      ) : (
        <FlatList
          data={shiftRecords}
          keyExtractor={(item, index) => `${item.id || item.shift_id || index}-${index}`}
          renderItem={renderShiftItem}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Shift Records Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || startDate || endDate
                  ? 'No shifts match your search or date filters.'
                  : 'No shift history recorded yet.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#F59E0B" />
                <Text style={styles.footerLoaderText}>Loading more shifts...</Text>
              </View>
            ) : (
              <View style={{ height: 28 }} />
            )
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#F59E0B']}
              tintColor="#F59E0B"
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        visible={isDateModalVisible}
        onClose={() => setIsDateModalVisible(false)}
        onApply={handleApplyDateRange}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerSubtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  headerTaxiOrange: {
    color: '#D97706',
    fontWeight: '700',
  },
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    marginRight: 8,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    maxWidth: 145,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 5,
  },
  filterPillsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
  },
  filterPillInactive: {
    backgroundColor: '#F1F5F9',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#64748B',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  statsTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 4,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  amountBig: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#F1F5F9',
  },
  ratioBarGreen: {
    backgroundColor: '#10B981',
  },
  ratioBarAmber: {
    backgroundColor: '#F59E0B',
  },
  metricBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    marginRight: 6,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    marginLeft: 6,
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bulletPaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  bulletUnpaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 5,
  },
  metricBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricPaidAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 2,
  },
  metricUnpaidAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748B',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  shiftCardUnpaid: {
    borderColor: '#FDE68A',
    backgroundColor: '#FEFDF8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftIdText: {
    fontSize: 15,
    fontWeight: '800',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unpaidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 5,
  },
  unpaidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  dateRangeText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tripsAndAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripsPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  tripsPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  tripsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  tripsPillTextUnpaid: {
    color: '#B45309',
  },
  totalLabelText: {
    fontSize: 12,
    color: '#64748B',
  },
  totalAmountValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pendingAmountValue: {
    color: '#B45309',
  },
  viewTripsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewTripsBtnUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  viewTripsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    marginRight: 2,
  },
  viewTripsBtnTextUnpaid: {
    color: '#B45309',
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  breakdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  breakdownPillUnpaid: {
    backgroundColor: '#FFFBEB',
  },
  breakdownPillText: {
    fontSize: 11,
    color: '#64748B',
  },
  breakdownPillTextUnpaid: {
    color: '#92400E',
  },
  breakdownPillBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  breakdownPillBoldUnpaid: {
    color: '#92400E',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerLoaderText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
});

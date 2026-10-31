import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  shiftService,
  ShiftHistoryData,
  ShiftRecordItem,
  ShiftSelectorEmployee,
} from '../../../services/shiftService';
import { formatShiftRecordTime } from '../../../utils/dateUtils';

export interface BusinessEmployeeItem {
  id: string;
  name: string;
  empId: string;
  avatar: any;
  role: string;
  isOnline: boolean;
}

export const DEFAULT_BUSINESS_EMPLOYEES: BusinessEmployeeItem[] = [
  {
    id: '12',
    name: 'Ramesh Poddar',
    empId: 'EMP2026100720101878',
    avatar: require('../../../../assets/emp_avatar_1.png'),
    role: 'Staff Member',
    isOnline: true,
  },
  {
    id: '19',
    name: 'Ashoke Malakar',
    empId: 'EMP321045',
    avatar: require('../../../../assets/emp_avatar_2.png'),
    role: 'Senior Staff',
    isOnline: false,
  },
];

export interface OtherBusinessShiftTxn {
  id: string;
  service: string;
  time: string;
  method: 'card' | 'tap_and_go';
  amount: number;
  verification: string;
}

export interface OtherBusinessShiftRecord {
  id: string;
  display_shift_id?: string;
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
  transactions: OtherBusinessShiftTxn[];
}

export interface OtherBusinessTransactionsScreenProps {
  businessName?: string;
  userName?: string;
  initialEmpId?: string;
  onSelectShift?: (shift: ShiftRecordItem | any) => void;
}

type ShiftFilterType = 'all' | 'paid' | 'unpaid';

export default function OtherBusinessTransactionsScreen({
  businessName = 'Habibs',
  userName = 'Merchant Owner',
  initialEmpId,
  onSelectShift,
}: OtherBusinessTransactionsScreenProps) {
  const { showAlert } = useConfirmModal();

  // API State
  const [shiftHistoryData, setShiftHistoryData] = useState<ShiftHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [selectedEmployee, setSelectedEmployee] = useState<ShiftSelectorEmployee | null>(null);
  const [isEmployeeModalVisible, setIsEmployeeModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ShiftFilterType>('all');
  const [dateRangeText, setDateRangeText] = useState('All Dates');

  // Modal for Viewing Shift Sales/Trips (fallback when not navigated via onSelectShift)
  const [selectedShiftForDetails, setSelectedShiftForDetails] = useState<ShiftRecordItem | null>(null);

  // Fetch shift history from live API
  const fetchShiftHistory = useCallback(
    async (
      empId?: number | string | null,
      status?: string,
      search?: string,
      isRefresh = false
    ) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setErrorMessage(null);

        const params: any = {};
        if (empId !== undefined && empId !== null && empId !== '') {
          params.employee_id = empId;
        }
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
            setDateRangeText(res.data.filters.date_range);
          }

          // Sync current selection if still in list
          const empList = res.data.header?.selector?.employee_list || [];
          if (empList.length > 0) {
            setSelectedEmployee((prev) => {
              if (prev) {
                // Keep current selection if still in list
                const match = empList.find((e) => e.id === prev.id);
                return match || prev;
              }
              if (initialEmpId) {
                const match = empList.find(
                  (e) => String(e.id) === String(initialEmpId) || e.code === String(initialEmpId)
                );
                return match || null;
              }
              return null;
            });
          }
        }
      } catch (err: any) {
        console.warn('Failed to load shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [initialEmpId]
  );

  // Initial load via asynchronous promise resolution to comply with React 19 effect purity
  useEffect(() => {
    let isMounted = true;
    shiftService
      .getShiftHistory({
        employee_id: initialEmpId || undefined,
        status: filterType !== 'all' ? filterType : undefined,
        search: searchQuery.trim() || undefined,
      })
      .then((res) => {
        if (!isMounted || !res?.data) return;
        setShiftHistoryData(res.data);
        if (res.data.filters?.date_range) {
          setDateRangeText(res.data.filters.date_range);
        }
        const empList = res.data.header?.selector?.employee_list || [];
        if (empList.length > 0 && initialEmpId) {
          const match = empList.find(
            (e) => String(e.id) === String(initialEmpId) || e.code === String(initialEmpId)
          );
          if (match) {
            setSelectedEmployee(match);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load shift history:', err?.message || err);
        setErrorMessage(err?.message || 'Unable to load shift history.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialEmpId, filterType, searchQuery]);

  // Handle pull to refresh
  const handleRefresh = () => {
    fetchShiftHistory(selectedEmployee?.id || null, filterType, searchQuery, true);
  };

  // Handle Tab Switch (All, Paid, Unpaid)
  const handleTabPress = (type: ShiftFilterType) => {
    setFilterType(type);
    fetchShiftHistory(selectedEmployee?.id || null, type, searchQuery);
  };

  // Handle Employee Selection
  const handleSelectEmployee = (emp: ShiftSelectorEmployee | null) => {
    setSelectedEmployee(emp);
    setIsEmployeeModalVisible(false);
    fetchShiftHistory(emp ? emp.id : null, filterType, searchQuery);
  };

  // Handle Search Input Change
  const handleSearchSubmit = () => {
    fetchShiftHistory(selectedEmployee?.id || null, filterType, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchShiftHistory(selectedEmployee?.id || null, filterType, '');
  };

  // Filter shifts locally for instantaneous response
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

  const handleShiftPress = (shift: ShiftRecordItem) => {
    if (onSelectShift) {
      onSelectShift(shift);
    } else {
      setSelectedShiftForDetails(shift);
    }
  };

  // Handle Export / Print Shift Summary PDF
  const handleExportShiftReport = async (shift: ShiftRecordItem) => {
    try {
      const { dateText, timeRangeText } = formatShiftRecordTime({
        start_at: shift.start_at,
        end_at: shift.end_at,
        time_range: shift.time_range,
        session_date: shift.session_date,
      });
      const isPaid = shift.status === 'PAID';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0F172A; }
              .header { border-bottom: 2px dashed #E2E8F0; padding-bottom: 16px; margin-bottom: 16px; text-align: center; }
              .title { font-size: 22px; font-weight: 800; margin: 0; color: #0F172A; }
              .sub { font-size: 13px; color: #64748B; margin-top: 4px; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; margin-top: 8px; background: ${isPaid ? '#ECFDF5' : '#FFFBEB'}; color: ${isPaid ? '#059669' : '#B45309'}; }
              .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; margin: 16px 0; }
              .row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
              .label { color: #64748B; }
              .val { font-weight: 600; color: #0F172A; }
              .footer { text-align: center; font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px dashed #E2E8F0; padding-top: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">${businessName}</h1>
              <p class="sub">Shift Audit Report • ${shift.user_name || 'Staff'} (${shift.employee_code || '--'})</p>
              <div class="badge">${isPaid ? `● PAID (${shift.paid_date || 'Settled'})` : '● UNPAID / AWAITING'}</div>
            </div>

            <div class="card">
              <div class="row"><span class="label">Shift Code:</span><span class="val">${shift.display_shift_id}</span></div>
              <div class="row"><span class="label">Date & Time:</span><span class="val">${dateText} • ${timeRangeText}</span></div>
              <div class="row"><span class="label">Total Collected:</span><span class="val" style="font-weight: 800; font-size: 16px; color: #059669;">${shift.amount_formatted} AUD</span></div>
              <div class="row"><span class="label">Card Transactions:</span><span class="val">${shift.card?.txns || 0} txns (${shift.card?.amount_formatted || '$0.00'})</span></div>
              <div class="row"><span class="label">Tap & Go Transactions:</span><span class="val">${shift.tap_and_go?.txns || 0} txns (${shift.tap_and_go?.amount_formatted || '$0.00'})</span></div>
            </div>

            <div class="footer">
              <p>Generated by SE PAY Terminal • ${businessName}</p>
              <p>Thank you!</p>
            </div>
          </body>
        </html>
      `;

      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const fileName = `Shift_${shift.display_shift_id}_${Date.now()}.pdf`;
      const targetUri = `${FileSystem.documentDirectory}${fileName}`;

      if (base64) {
        await FileSystem.writeAsStringAsync(targetUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({ from: uri, to: targetUri });
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        try {
          await Sharing.shareAsync(targetUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Shift Report ${shift.display_shift_id}`,
            UTI: '.pdf',
          });
          return;
        } catch (shareErr) {
          console.warn('Sharing.shareAsync failed, falling back to Share.share:', shareErr);
        }
      }

      showAlert({
        title: 'Report Saved',
        message: `Shift report PDF generated successfully.`,
        type: 'success',
        icon: 'document-text-outline',
      });
    } catch (err) {
      console.error('Error exporting shift report:', err);
      showAlert({
        title: 'Export Error',
        message: 'Unable to generate shift PDF report.',
        type: 'danger',
      });
    }
  };

  const summary = shiftHistoryData?.summary;
  const totalCollections = summary?.total_shift_collections ?? 0;
  const wholeAmount = `$${Math.floor(totalCollections).toLocaleString('en-US')}`;
  const centsAmount = `.${(totalCollections.toFixed(2)).split('.')[1] || '00'}`;
  const paidPercentage = summary?.paid_percentage ?? 0;

  const selector = shiftHistoryData?.header?.selector;
  const employeeList = selector?.employee_list || [];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Screen Title: Centered "Shift History" */}
      <HeaderBar title={shiftHistoryData?.header?.title || 'Shift History'} showBack={false} />

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
        {/* ── 1. SELECT EMPLOYEE SECTION ── */}
        {selector?.is_visible !== false && (
          <>
            <View style={styles.employeeSectionHeaderRow}>
              <Text style={styles.employeeSectionTitle}>{selector?.title || 'SELECT EMPLOYEE'}</Text>
              <View style={styles.totalEmployeesBadge}>
                <Text style={styles.totalEmployeesBadgeText}>
                  {selector?.total_count ?? employeeList.length} Total
                </Text>
              </View>
            </View>

            {/* Selected Employee Card with Dropdown Button */}
            <TouchableOpacity
              style={styles.selectedEmployeeCard}
              activeOpacity={0.85}
              onPress={() => setIsEmployeeModalVisible(true)}
            >
              <View style={styles.employeeAvatarWrap}>
                {selectedEmployee ? (
                  selectedEmployee.photo ? (
                    <Image source={{ uri: selectedEmployee.photo }} style={styles.employeeAvatarImg} />
                  ) : (
                    <View style={styles.initialsAvatarWrap}>
                      <Text style={styles.initialsAvatarText}>
                        {selectedEmployee.initials || 'EM'}
                      </Text>
                    </View>
                  )
                ) : (
                  <View style={[styles.initialsAvatarWrap, styles.allEmployeesAvatarWrap]}>
                    <Ionicons name="people" size={17} color="#D97706" />
                  </View>
                )}
              </View>

              <Text style={styles.employeeNameText} numberOfLines={1}>
                {selectedEmployee?.name || 'All Employees'}
              </Text>

              {selectedEmployee?.code ? (
                <View style={styles.empIdBadge}>
                  <Text style={styles.empIdBadgeText}>{selectedEmployee.code}</Text>
                </View>
              ) : (
                <View style={styles.allBadge}>
                  <Text style={styles.allBadgeText}>ALL</Text>
                </View>
              )}

              <View style={styles.spacer} />

              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-down" size={15} color="#475569" />
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* ── 2. SEARCH BAR & DATE RANGE ROW ── */}
        <View style={styles.searchDateRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color="#94A3B8" style={styles.searchIcon} />
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
                style={styles.clearBtn}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateFilterButton}>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
            <Text style={styles.dateFilterText} numberOfLines={1}>
              {dateRangeText}
            </Text>
          </View>
        </View>

        {/* ── 3. FILTER PILLS (All, Paid, Unpaid) ── */}
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
                filterType === 'all' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              All Shifts ({shiftHistoryData?.filters?.tabs?.all_shifts?.count ?? 0})
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
                filterType === 'paid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Paid Shifts ({shiftHistoryData?.filters?.tabs?.paid_shifts?.count ?? 0})
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
                filterType === 'unpaid' ? styles.filterPillTextActive : styles.filterPillTextInactive,
              ]}
            >
              Unpaid Shifts ({shiftHistoryData?.filters?.tabs?.unpaid_shifts?.count ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. TOTAL SHIFT COLLECTIONS CARD ── */}
        <View style={styles.collectionsCard}>
          {/* Top Gold Gradient Accent Line */}
          <LinearGradient
            colors={[
              'rgba(251, 191, 36, 0.1)',
              '#FBBF24',
              '#F59E0B',
              '#FBBF24',
              'rgba(251, 191, 36, 0.1)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cardTopAccent}
          />

          <Text style={styles.collectionsTitle}>TOTAL SHIFT COLLECTIONS</Text>

          {/* Large Amount */}
          <View style={styles.mainAmountRow}>
            <Text style={styles.mainAmountWhole}>{wholeAmount}</Text>
            <Text style={styles.mainAmountCents}>{centsAmount}</Text>
          </View>

          {/* Dual-color ratio bar: Green (Paid) & Amber (Unpaid) */}
          <View style={styles.ratioProgressBarContainer}>
            {summary && summary.total_shift_collections > 0 ? (
              <>
                <View
                  style={[
                    styles.ratioProgressGreen,
                    { flex: Math.max(0.01, paidPercentage) },
                  ]}
                />
                <View
                  style={[
                    styles.ratioProgressAmber,
                    { flex: Math.max(0.01, 100 - paidPercentage) },
                  ]}
                />
              </>
            ) : (
              <View style={[styles.ratioProgressNeutral, { flex: 1 }]} />
            )}
          </View>

          {/* Two Metric Summary Boxes */}
          <View style={styles.metricBoxesRow}>
            {/* Box 1: Settled / Paid */}
            <View style={styles.metricBoxPaid}>
              <View style={styles.metricBoxHeaderRow}>
                <View style={styles.bulletPaid} />
                <Text style={styles.metricBoxTitle}>Settled / Paid</Text>
              </View>
              <Text style={styles.metricBoxAmountPaid}>
                {summary?.settled_paid_formatted || '$0.00'}
              </Text>
              <Text style={styles.metricBoxSubtext}>
                {summary?.settled_paid_subtitle || '0 shifts completed'}
              </Text>
            </View>

            {/* Box 2: Pending / Unpaid */}
            <View style={styles.metricBoxUnpaid}>
              <View style={styles.metricBoxHeaderRow}>
                <View style={styles.bulletUnpaid} />
                <Text style={styles.metricBoxTitle}>Pending / Unpaid</Text>
              </View>
              <Text style={styles.metricBoxAmountUnpaid}>
                {summary?.pending_unpaid_formatted || '$0.00'}
              </Text>
              <Text style={styles.metricBoxSubtext}>
                {summary?.pending_unpaid_subtitle || '0 shifts awaiting'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 5. SHIFT RECORDS SECTION ── */}
        <Text style={styles.recordsSectionTitle}>SHIFT RECORDS</Text>

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

        {/* Shift Records List */}
        {!isLoading &&
          filteredShifts.map((shift) => {
            const isUnpaid = shift.status === 'UNPAID';
            const { dateText, timeRangeText } = formatShiftRecordTime({
              start_at: shift.start_at,
              end_at: shift.end_at,
              time_range: shift.time_range,
              session_date: shift.session_date,
            });

            return (
              <TouchableOpacity
                key={String(shift.id)}
                style={[styles.shiftCard, isUnpaid && styles.shiftCardUnpaid]}
                activeOpacity={0.88}
                onPress={() => handleShiftPress(shift)}
              >
                {/* Card Header: Shift Code + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text
                    style={[styles.shiftIdText, isUnpaid && styles.shiftIdTextUnpaid]}
                    numberOfLines={1}
                  >
                    {shift.display_shift_id}
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

                {/* Date and Time Row + View Button */}
                <View style={styles.cardMiddleRow}>
                  <View style={styles.cardMiddleInfoCol}>
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

                    <Text style={styles.shiftDateRangeText}>
                      {dateText} • {timeRangeText}
                    </Text>

                    {/* Txns Badge + Total / Pending Amount */}
                    <View style={styles.txnsAndTotalRow}>
                      <View style={[styles.txnsPill, isUnpaid && styles.txnsPillUnpaid]}>
                        <Text style={[styles.txnsPillText, isUnpaid && styles.txnsPillTextUnpaid]}>
                          {shift.total_txns} Txns
                        </Text>
                      </View>

                      <Text style={styles.amountLabelText}>
                        {isUnpaid ? 'Pending: ' : 'Total: '}
                        <Text
                          style={[
                            styles.amountValueText,
                            isUnpaid && styles.pendingAmountValueText,
                          ]}
                        >
                          {shift.amount_formatted}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* View > Button */}
                  <TouchableOpacity
                    style={[styles.viewTripsButton, isUnpaid && styles.viewTripsButtonUnpaid]}
                    onPress={() => handleShiftPress(shift)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.viewTripsButtonText,
                        isUnpaid && styles.viewTripsButtonTextUnpaid,
                      ]}
                    >
                      View
                    </Text>
                    <Feather
                      name="chevron-right"
                      size={13}
                      color={isUnpaid ? '#D97706' : '#2563EB'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Breakdown Pills (Card & Tap & Go) */}
                <View style={styles.breakdownRow}>
                  {/* Card Pill */}
                  <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
                    <Ionicons
                      name="card-outline"
                      size={12}
                      color={isUnpaid ? '#B45309' : '#475569'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.breakdownLabel}>Card: </Text>
                    <Text style={styles.breakdownValue}>
                      {shift.card?.txns ?? 0} txns • {shift.card?.amount_formatted ?? '$0.00'}
                    </Text>
                  </View>

                  {/* Tap & Go Pill */}
                  <View style={[styles.breakdownPill, isUnpaid && styles.breakdownPillUnpaid]}>
                    <MaterialCommunityIcons
                      name="contactless-payment"
                      size={13}
                      color={isUnpaid ? '#B45309' : '#475569'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.breakdownLabel}>Tap & Go: </Text>
                    <Text style={styles.breakdownValue}>
                      {shift.tap_and_go?.txns ?? 0} txns • {shift.tap_and_go?.amount_formatted ?? '$0.00'}
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
            <Text style={styles.emptySubtitle}>Try adjusting your search criteria or date filter</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── EMPLOYEE SELECTOR MODAL ── */}
      <Modal
        visible={isEmployeeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEmployeeModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsEmployeeModalVisible(false)}
        >
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Employee</Text>
                <Text style={styles.modalSubtitle}>
                  Filter shifts and collections by team member
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEmployeeModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.employeeOptionsList}>
              {/* Option 1: ALL Employees */}
              <TouchableOpacity
                style={[
                  styles.employeeOptionItem,
                  selectedEmployee === null && styles.employeeOptionItemSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectEmployee(null)}
              >
                <View style={[styles.optionInitialsAvatar, styles.optionAllAvatar]}>
                  <Ionicons name="people" size={18} color="#D97706" />
                </View>

                <View style={styles.optionInfo}>
                  <View style={styles.optionNameRow}>
                    <Text style={styles.optionName}>All Employees</Text>
                  </View>

                  <View style={styles.optionMetaRow}>
                    <Text style={styles.optionEmpId}>Show shifts for all team members</Text>
                  </View>
                </View>

                {selectedEmployee === null && (
                  <Ionicons name="checkmark-circle" size={22} color="#D97706" />
                )}
              </TouchableOpacity>

              {/* Individual Employees from API */}
              {employeeList.map((employee) => {
                const isSelected = selectedEmployee?.id === employee.id;

                return (
                  <TouchableOpacity
                    key={String(employee.id)}
                    style={[
                      styles.employeeOptionItem,
                      isSelected && styles.employeeOptionItemSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectEmployee(employee)}
                  >
                    {employee.photo ? (
                      <Image source={{ uri: employee.photo }} style={styles.optionAvatar} />
                    ) : (
                      <View style={styles.optionInitialsAvatar}>
                        <Text style={styles.optionInitialsText}>{employee.initials}</Text>
                      </View>
                    )}

                    <View style={styles.optionInfo}>
                      <View style={styles.optionNameRow}>
                        <Text style={styles.optionName}>{employee.name}</Text>
                      </View>

                      <View style={styles.optionMetaRow}>
                        <Text style={styles.optionEmpId}>EMP ID: {employee.code}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#D97706" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── SHIFT SALES / TRIPS DETAILS MODAL ── */}
      <Modal
        visible={!!selectedShiftForDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedShiftForDetails(null)}
      >
        {selectedShiftForDetails && (
          <View style={styles.detailsModalRoot}>
            <View style={styles.detailsHeader}>
              <TouchableOpacity
                onPress={() => setSelectedShiftForDetails(null)}
                style={styles.detailsBackBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="chevron-back" size={24} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.detailsHeaderTitle}>Shift Sales Details</Text>
              <TouchableOpacity
                onPress={() => handleExportShiftReport(selectedShiftForDetails)}
                style={styles.detailsExportBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="share-2" size={19} color="#D97706" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.detailsScrollView}
              contentContainerStyle={styles.detailsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Shift Banner Summary */}
              <View style={styles.detailsSummaryCard}>
                <View style={styles.detailsSummaryTop}>
                  <View>
                    <Text style={styles.detailsShiftIdLabel}>SHIFT CODE</Text>
                    <Text style={styles.detailsShiftIdText}>
                      {selectedShiftForDetails.display_shift_id}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.detailsStatusBadge,
                      selectedShiftForDetails.status === 'UNPAID' &&
                        styles.detailsStatusBadgeUnpaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailsStatusText,
                        selectedShiftForDetails.status === 'UNPAID' &&
                          styles.detailsStatusTextUnpaid,
                      ]}
                    >
                      {selectedShiftForDetails.status === 'PAID'
                        ? 'PAID / SETTLED'
                        : 'UNPAID'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsMetaDivider} />

                <View style={styles.detailsMetaRow}>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>STAFF</Text>
                    <Text style={styles.detailsMetaValue}>
                      {selectedShiftForDetails.user_name || selectedEmployee?.name || 'Habibs'}
                    </Text>
                  </View>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>DATE</Text>
                    <Text style={styles.detailsMetaValue}>
                      {
                        formatShiftRecordTime({
                          start_at: selectedShiftForDetails.start_at,
                          end_at: selectedShiftForDetails.end_at,
                          time_range: selectedShiftForDetails.time_range,
                          session_date: selectedShiftForDetails.session_date,
                        }).dateText
                      }
                    </Text>
                  </View>
                  <View style={styles.detailsMetaCol}>
                    <Text style={styles.detailsMetaLabel}>TOTAL SALES</Text>
                    <Text style={styles.detailsTotalAmount}>
                      {selectedShiftForDetails.amount_formatted}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment Methods Breakdown Card */}
              <View style={styles.detailsBreakdownCard}>
                <View style={styles.detailsBreakdownCol}>
                  <View style={styles.detailsIconRow}>
                    <Ionicons name="card-outline" size={14} color="#2563EB" />
                    <Text style={styles.detailsMethodTitle}>Card Sales</Text>
                  </View>
                  <Text style={styles.detailsMethodAmount}>
                    {selectedShiftForDetails.card?.amount_formatted || '$0.00'}
                  </Text>
                  <Text style={styles.detailsMethodSub}>
                    {selectedShiftForDetails.card?.txns || 0} transactions
                  </Text>
                </View>

                <View style={styles.detailsVerticalDivider} />

                <View style={styles.detailsBreakdownCol}>
                  <View style={styles.detailsIconRow}>
                    <MaterialCommunityIcons name="contactless-payment" size={16} color="#EA580C" />
                    <Text style={styles.detailsMethodTitle}>Tap & Go</Text>
                  </View>
                  <Text style={styles.detailsMethodAmount}>
                    {selectedShiftForDetails.tap_and_go?.amount_formatted || '$0.00'}
                  </Text>
                  <Text style={styles.detailsMethodSub}>
                    {selectedShiftForDetails.tap_and_go?.txns || 0} transactions
                  </Text>
                </View>
              </View>

              {/* Shift Notes / Information */}
              <View style={styles.noTxnsCard}>
                <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                <Text style={styles.noTxnsTitle}>Shift Summary Recorded</Text>
                <Text style={styles.noTxnsSub}>
                  Total {selectedShiftForDetails.total_txns} transactions logged for this work session.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.exportFullBtn}
                activeOpacity={0.85}
                onPress={() => handleExportShiftReport(selectedShiftForDetails)}
              >
                <Feather name="download" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.exportFullBtnText}>Export Shift Audit PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },

  /* 1. Select Employee Section */
  employeeSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  employeeSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  totalEmployeesBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  totalEmployeesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  selectedEmployeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  employeeAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginRight: 9,
  },
  employeeAvatarImg: {
    width: '100%',
    height: '100%',
  },
  initialsAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allEmployeesAvatarWrap: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  initialsAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  employeeNameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
    maxWidth: 140,
  },
  empIdBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  empIdBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  allBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  allBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  spacer: {
    flex: 1,
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 2. Search & Date Filter */
  searchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 39,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 11,
    paddingHorizontal: 11,
    height: 39,
  },
  dateFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* 3. Filter Pills */
  filterPillsRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 14,
  },
  filterPill: {
    paddingVertical: 6.5,
    paddingHorizontal: 12,
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
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#64748B',
  },

  /* 4. Collections Card */
  collectionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  collectionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  mainAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  mainAmountWhole: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  mainAmountCents: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
  },
  ratioProgressBarContainer: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  ratioProgressGreen: {
    backgroundColor: '#10B981',
  },
  ratioProgressAmber: {
    backgroundColor: '#F59E0B',
  },
  ratioProgressNeutral: {
    backgroundColor: '#CBD5E1',
  },
  metricBoxesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBoxPaid: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 11,
    padding: 10,
  },
  metricBoxUnpaid: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 11,
    padding: 10,
  },
  metricBoxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  bulletPaid: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  bulletUnpaid: {
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
  metricBoxAmountPaid: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 1,
  },
  metricBoxAmountUnpaid: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 1,
  },
  metricBoxSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },

  /* 5. Records Section */
  recordsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 2,
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
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    marginBottom: 10,
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
  shiftIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  shiftIdTextUnpaid: {
    color: '#0F172A',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  paidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  paidBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.3,
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  unpaidDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
  },
  unpaidBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardMiddleInfoCol: {
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
  shiftDateRangeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  txnsAndTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txnsPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  txnsPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  txnsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  txnsPillTextUnpaid: {
    color: '#92400E',
  },
  amountLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  amountValueText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  pendingAmountValueText: {
    color: '#D97706',
  },
  viewTripsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  viewTripsButtonUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  viewTripsButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewTripsButtonTextUnpaid: {
    color: '#D97706',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  breakdownPillUnpaid: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF7',
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  breakdownValue: {
    fontSize: 10,
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

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  employeeOptionsList: {
    gap: 9,
  },
  employeeOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  employeeOptionItemSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  optionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
  optionInitialsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionAllAvatar: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  optionInitialsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  optionInfo: {
    flex: 1,
  },
  optionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  optionName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  optionEmpId: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Details Modal */
  detailsModalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailsBackBtn: {
    padding: 4,
  },
  detailsHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsExportBtn: {
    padding: 4,
  },
  detailsScrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailsScrollContent: {
    padding: 16,
  },
  detailsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
  },
  detailsSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsShiftIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  detailsShiftIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  detailsStatusBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  detailsStatusBadgeUnpaid: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  detailsStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  detailsStatusTextUnpaid: {
    color: '#92400E',
  },
  detailsMetaDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  detailsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsMetaCol: {
    flex: 1,
  },
  detailsMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 3,
  },
  detailsMetaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsTotalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  detailsBreakdownCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  detailsBreakdownCol: {
    flex: 1,
  },
  detailsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  detailsMethodTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  detailsMethodAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsMethodSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  detailsVerticalDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  noTxnsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 24,
    marginBottom: 16,
  },
  noTxnsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  noTxnsSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  exportFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportFullBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

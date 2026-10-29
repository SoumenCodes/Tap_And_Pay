import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  dashboardService,
  DashboardData,
  ActiveEmployeeItem,
} from '../../../services/dashboardService';

interface OtherBusinessDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
  empId?: string;
}

type EmployeeFilterMode = 'all' | 'on_shift' | 'off_shift';

export default function OtherBusinessDashboard({
  businessName = 'Crown Cuts',
  userName = 'Soumen Sen',
  sessionStartTime = '7:30 AM',
  empId = '93821048',
}: OtherBusinessDashboardProps) {
  const router = useRouter();
  const { showConfirm, showAlert } = useConfirmModal();

  // API State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shift & Filter state
  const [isOnShift, setIsOnShift] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<EmployeeFilterMode>('on_shift');

  useEffect(() => {
    let isMounted = true;
    dashboardService
      .getDashboard()
      .then((res) => {
        if (isMounted && res.data) {
          setDashboardData(res.data);
          setIsOnShift(Boolean(res.data.is_on_shift));
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.warn('Failed to load dashboard data:', err?.message || err);
          setErrorMessage(err?.message || 'Unable to load dashboard data.');
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
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await dashboardService.getDashboard();
      if (res.data) {
        setDashboardData(res.data);
        setIsOnShift(Boolean(res.data.is_on_shift));
      }
    } catch (err: any) {
      console.warn('Failed to refresh dashboard data:', err?.message || err);
      setErrorMessage(err?.message || 'Unable to refresh dashboard data.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Derived header data with fallback to props
  const header = dashboardData?.header;
  const displayBusinessName = header?.business_name || businessName;
  const displayUserName = header?.full_name || header?.first_name || userName;
  const displayEmpId = header?.identifier_value || empId;
  const displayStartTime = dashboardData?.start_time || sessionStartTime;
  const activeShiftCode =
    header?.active_shift_code ||
    dashboardData?.active_shift_text ||
    (isOnShift ? '--' : 'No Active Shift');

  // Employee list & counts
  const employees: ActiveEmployeeItem[] = dashboardData?.active_employees?.list || [];
  const summary = dashboardData?.active_employees?.summary;

  const onShiftCount =
    summary?.on_shift_count ??
    employees.filter((e) => (e.is_on_shift !== undefined ? e.is_on_shift : e.is_online)).length;
  const offShiftCount =
    summary?.off_shift_count ??
    employees.filter((e) => !(e.is_on_shift !== undefined ? e.is_on_shift : e.is_online)).length;
  const totalCount = summary?.total_count ?? employees.length;

  const filteredEmployees = employees.filter((e) => {
    const isEmployeeOnShift = e.is_on_shift !== undefined ? e.is_on_shift : e.is_online;
    if (filterMode === 'on_shift') return isEmployeeOnShift;
    if (filterMode === 'off_shift') return !isEmployeeOnShift;
    return true;
  });

  // Revenue metrics breakdown
  const revenue = dashboardData?.revenue;
  const totalRevFormatted = revenue?.total_amount_formatted || '$0.00';
  const totalCountText = revenue?.total_count_formatted || `${revenue?.total_count ?? 0} Txns`;

  const cardRevFormatted = revenue?.card?.amount_formatted || '$0.00';
  const cardCountText = revenue?.card?.count_formatted || `${revenue?.card?.count ?? 0} Txns`;

  const tapRevFormatted = revenue?.tap_and_go?.amount_formatted || '$0.00';
  const tapCountText = revenue?.tap_and_go?.count_formatted || `${revenue?.tap_and_go?.count ?? 0} Txns`;

  // Parse dollar and cents for total
  const splitAmount = (formatted: string) => {
    const cleaned = formatted.replace('$', '').trim();
    const parts = cleaned.split('.');
    return {
      dollars: parts[0] || '0',
      cents: parts[1] || '00',
    };
  };

  const totalSplit = splitAmount(totalRevFormatted);
  const cardSplit = splitAmount(cardRevFormatted);
  const tapSplit = splitAmount(tapRevFormatted);

  const isSaleButtonVisible =
    dashboardData?.sale_button?.is_visible !== undefined
      ? dashboardData.sale_button.is_visible
      : isOnShift;

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      showConfirm({
        title: 'End Shift',
        message: `Are you sure you want to end your current active shift (${activeShiftCode})?`,
        confirmText: 'End Shift',
        cancelText: 'Cancel',
        type: 'warning',
        icon: 'stop-circle-outline',
        onConfirm: () => {
          setIsOnShift(false);
          showAlert({
            title: 'Shift Ended',
            message: 'Shift tally submitted to records.',
            type: 'success',
            icon: 'checkmark-circle-outline',
          });
        },
      });
    } else {
      setIsOnShift(true);
      showAlert({
        title: 'Shift Started',
        message: 'Active on shift. Ready to accept sales.',
        type: 'success',
        icon: 'checkmark-circle-outline',
      });
    }
  };

  const handleNavigateToTransactions = (targetEmpId?: string) => {
    router.push({
      pathname: '/(tabs)/transactions',
      params: targetEmpId ? { empId: targetEmpId } : undefined,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title={header?.title || 'SE PAY DASHBOARD'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#D97706']}
            tintColor="#D97706"
          />
        }
      >
        {/* Error Banner */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={
              header?.banner_image_url
                ? { uri: header.banner_image_url }
                : require('../../../../assets/crown_cuts_hero.png')
            }
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Bottom-left row: Avatar + Translucent Text Badge */}
          <View style={styles.bannerBottomRow}>
            {/* Avatar Logo Box */}
            <View style={styles.avatarBox}>
              <Image
                source={
                  header?.logo_url
                    ? { uri: header.logo_url }
                    : require('../../../../assets/crown_cuts_badge_hd.png')
                }
                style={styles.avatarBadgeImage}
                resizeMode="contain"
              />
            </View>

            {/* Translucent Text Badge */}
            <View style={styles.bannerTextBadge}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {displayBusinessName}
              </Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                SHIFT: {isOnShift ? 'Active' : 'Start Shift Now!'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Welcome User Card */}
        <View style={styles.welcomeCardOuter}>
          {/* Top subtle golden gradient line */}
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

          <View style={styles.welcomeCardInner}>
            <Text style={styles.welcomeTitle}>
              Welcome, <Text style={styles.userNameText}>{displayUserName}</Text>
            </Text>

            <View style={styles.welcomeMetaRow}>
              <Text style={styles.empIdMetaLabel}>
                EMP ID: <Text style={styles.empIdHighlight}>{displayEmpId}</Text>
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.clockRow}>
                <Feather name="clock" size={12} color="#64748B" style={styles.clockIcon} />
                <Text style={styles.shiftStartText}>
                  Shift Start: {displayStartTime || '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom row: Active Shift ID + On Shift badge */}
          <View style={styles.activeShiftRow}>
            <Text style={styles.activeShiftLabel}>
              ACTIVE SHIFT: <Text style={styles.activeShiftCode}>{activeShiftCode}</Text>
            </Text>

            <View style={[styles.onShiftBadge, !isOnShift && styles.offShiftBadge]}>
              <View style={[styles.onShiftDot, !isOnShift && styles.offShiftDot]} />
              <Text style={[styles.onShiftText, !isOnShift && styles.offShiftText]}>
                {isOnShift ? 'ON SHIFT' : 'OFF SHIFT'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. CREATE SALE Quick Action Card (Gold gradient with scissors icon) */}
        {isSaleButtonVisible && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCreateSale}
            style={styles.saleCardOuter}
          >
            <LinearGradient
              colors={['#F59E0B', '#FBBF24', '#FCD34D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saleGradient}
            >
              {/* Left Scissors Icon Pill */}
              <View style={styles.scissorsIconWrap}>
                <Ionicons name="cut" size={24} color="#0F172A" />
              </View>

              {/* Text Information */}
              <View style={styles.saleTextWrap}>
                <Text style={styles.saleTitle}>CREATE SALE</Text>
                <Text style={styles.saleSubtitle}>Charge. Confirm. Done.</Text>
              </View>

              {/* Right Arrow Button */}
              <View style={styles.saleArrowWrap}>
                <Feather name="chevron-right" size={20} color="#0F172A" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 4. Revenue Card */}
        <View style={styles.revenueCardOuter}>
          <View style={styles.revenueCardHeader}>
            <View style={styles.revenueTitleRow}>
              <Text style={styles.revenueMainTitle}>Revenue </Text>
              <Text style={styles.revenueSubTitle}>
                {revenue?.timeframe_label || 'Last 7 days'}
              </Text>
            </View>
            <View style={styles.txnsCountBadge}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
              <Text style={styles.txnsCountText}>{totalCountText}</Text>
            </View>
          </View>

          <View style={styles.revenueDivider} />

          {/* 3 Metric Columns: Total, Card, Tap & Go */}
          <View style={styles.metricsRow}>
            {/* Total Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricDot, { backgroundColor: '#D97706' }]} />
                <Text style={styles.metricLabelTotal}>TOTAL</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolGold}>$</Text>
                {totalSplit.dollars}
                <Text style={styles.centsText}>.{totalSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubtext}>{totalCountText}</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Card Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="card-outline" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.metricLabelCard}>CARD</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolBlue}>$</Text>
                {cardSplit.dollars}
                <Text style={styles.centsText}>.{cardSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubtext}>{cardCountText}</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Tap & Go Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.metricLabelTap}>TAP & GO</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolOrange}>$</Text>
                {tapSplit.dollars}
                <Text style={styles.centsText}>.{tapSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubtext}>{tapCountText}</Text>
            </View>
          </View>
        </View>

        {/* 5. End / Start Shift Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={[styles.shiftButton, !isOnShift && styles.startShiftButton]}
        >
          <Feather
            name={isOnShift ? 'log-out' : 'log-in'}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.shiftButtonText}>
            {isOnShift ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 6. Active Employee Section */}
        <View style={styles.employeesSection}>
          <View style={styles.employeesHeaderRow}>
            <View style={styles.employeesTitleWrap}>
              <Text style={styles.employeesMainTitle}>Active Employee</Text>
              <TouchableOpacity
                onPress={() => setFilterMode('all')}
                activeOpacity={0.7}
                style={[
                  styles.totalEmployeesBadge,
                  filterMode === 'all' && styles.totalEmployeesBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.totalEmployeesText,
                    filterMode === 'all' && styles.totalEmployeesTextActive,
                  ]}
                >
                  {totalCount} Total
                </Text>
              </TouchableOpacity>
            </View>

            {/* Filter Toggle Pills */}
            <View style={styles.filtersWrap}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'on_shift'
                    ? styles.filterPillActiveOn
                    : styles.filterPillInactive,
                ]}
                activeOpacity={0.7}
                onPress={() => setFilterMode('on_shift')}
              >
                <View
                  style={[
                    styles.filterDot,
                    filterMode === 'on_shift' ? styles.filterDotActive : styles.filterDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.filterText,
                    filterMode === 'on_shift'
                      ? styles.filterTextActiveOn
                      : styles.filterTextInactive,
                  ]}
                >
                  On Shift {onShiftCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'off_shift'
                    ? styles.filterPillActiveOff
                    : styles.filterPillInactive,
                ]}
                activeOpacity={0.7}
                onPress={() => setFilterMode('off_shift')}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterMode === 'off_shift'
                      ? styles.filterTextActiveOff
                      : styles.filterTextInactive,
                  ]}
                >
                  Off Shift {offShiftCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Loading Indicator */}
          {isLoading && !isRefreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D97706" />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && filteredEmployees.length === 0 && (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={36} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>
                {filterMode === 'on_shift'
                  ? 'No employees on shift'
                  : filterMode === 'off_shift'
                  ? 'No employees off shift'
                  : 'No registered employees found'}
              </Text>
              <Text style={styles.emptySub}>
                Pull down to refresh or check employee roster status.
              </Text>
            </View>
          )}

          {/* Employee List Cards (Rendered dynamically strictly from API) */}
          <View style={styles.employeesList}>
            {filteredEmployees.map((employee) => {
              const initials =
                employee.initials ||
                (employee.name ? employee.name.slice(0, 2).toUpperCase() : '--');
              const isOnline = Boolean(employee.is_online);
              const revFormatted = employee.active_shift_revenue_formatted || '$0.00';
              const revParts = splitAmount(revFormatted);

              return (
                <TouchableOpacity
                  key={employee.id}
                  style={styles.employeeCard}
                  activeOpacity={0.8}
                  onPress={() => handleNavigateToTransactions(employee.emp_id)}
                >
                  {/* Avatar + Info + Shift Rev */}
                  <View style={styles.employeeTopRow}>
                    {employee.profile_photo_url ? (
                      <Image source={{ uri: employee.profile_photo_url }} style={styles.employeeAvatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.fallbackInitials}>{initials}</Text>
                      </View>
                    )}

                    <View style={styles.employeeInfoCol}>
                      <View style={styles.employeeNameRow}>
                        <Text style={styles.employeeNameText}>{employee.name}</Text>
                        <View
                          style={[
                            styles.employeeOnlinePill,
                            !isOnline && styles.employeeOfflinePill,
                          ]}
                        >
                          <View
                            style={[
                              styles.employeeStatusDot,
                              !isOnline && styles.employeeOfflineDot,
                            ]}
                          />
                          <Text
                            style={[
                              styles.employeeOnlineText,
                              !isOnline && styles.employeeOfflineText,
                            ]}
                          >
                            {employee.online_badge || (isOnline ? 'Online' : 'Offline')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.employeeEmpId}>
                        EMP ID: <Text style={styles.empIdValue}>{employee.emp_id}</Text>
                      </Text>
                    </View>

                    <View style={styles.employeeRevCol}>
                      <Text style={styles.employeeRevLabel}>ACTIVE SHIFT REV</Text>
                      <Text style={styles.employeeRevAmount}>
                        <Text style={styles.revDollarSign}>$</Text>
                        {revParts.dollars}
                        <Text style={styles.revCents}>.{revParts.cents}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Shifts Summary Row if provided */}
                  {employee.shifts && (
                    <View style={styles.employeeBottomRow}>
                      <View style={styles.shiftsRow}>
                        <Text style={styles.shiftsLabel}>Shifts:</Text>
                        <View style={styles.paidShiftsPill}>
                          <Text style={styles.paidShiftsText}>
                            {employee.shifts.paid_label || `${employee.shifts.paid || 0} Paid`}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.unpaidShiftsPill,
                            (employee.shifts.unpaid || 0) > 0 && styles.unpaidShiftsPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.unpaidShiftsText,
                              (employee.shifts.unpaid || 0) > 0 && styles.unpaidShiftsTextActive,
                            ]}
                          >
                            {employee.shifts.unpaid_label || `${employee.shifts.unpaid || 0} Unpaid`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.viewDetailsBtn}>
                        <Text style={styles.viewDetailsBtnText}>View</Text>
                        <Feather name="chevron-right" size={12} color="#2563EB" />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 28,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },

  /* 1. Hero Banner */
  bannerContainer: {
    width: '100%',
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
    backgroundColor: '#0F172A',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    padding: 3,
  },
  avatarBadgeImage: {
    width: '100%',
    height: '100%',
  },
  bannerTextBadge: {
    flexShrink: 1,
    marginLeft: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 2,
  },
  bannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#E2E8F0',
    letterSpacing: 0.1,
  },

  /* 2. Welcome Card */
  welcomeCardOuter: {
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopStripe: {
    height: 3,
    width: '100%',
  },
  welcomeCardInner: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  userNameText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  empIdMetaLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  empIdHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  metaDot: {
    marginHorizontal: 6,
    color: '#CBD5E1',
    fontSize: 10,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIcon: {
    marginRight: 4,
  },
  shiftStartText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
  },
  activeShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
  },
  activeShiftLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
    letterSpacing: 0.2,
  },
  activeShiftCode: {
    fontWeight: '800',
    color: '#B45309',
  },
  onShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  offShiftBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  onShiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  offShiftDot: {
    backgroundColor: '#DC2626',
  },
  onShiftText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  offShiftText: {
    color: '#DC2626',
  },

  /* 3. Create Sale Button */
  saleCardOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scissorsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saleTextWrap: {
    flex: 1,
  },
  saleTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  saleSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  saleArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 4. Revenue Card */
  revenueCardOuter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  revenueTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  revenueMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  revenueSubTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  txnsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  txnsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricColumn: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  metricLabelTotal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  metricLabelCard: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  metricLabelTap: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  currencySymbolGold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
  },
  currencySymbolBlue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB',
  },
  currencySymbolOrange: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  centsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  columnDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },

  /* 5. End Shift Action Button */
  shiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  startShiftButton: {
    backgroundColor: '#16A34A',
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 6. Active Employee Section */
  employeesSection: {
    marginTop: 2,
  },
  employeesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeesTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeesMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalEmployeesBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalEmployeesBadgeActive: {
    backgroundColor: '#FDE68A',
  },
  totalEmployeesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  totalEmployeesTextActive: {
    color: '#78350F',
  },
  filtersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  filterPillActiveOn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  filterPillActiveOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  filterPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterDotActive: {
    backgroundColor: '#15803D',
  },
  filterDotInactive: {
    backgroundColor: '#94A3B8',
  },
  filterText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  filterTextActiveOn: {
    color: '#166534',
  },
  filterTextActiveOff: {
    color: '#475569',
  },
  filterTextInactive: {
    color: '#64748B',
  },

  /* Employee Cards */
  employeesList: {
    gap: 10,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  employeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    marginRight: 10,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fallbackInitials: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '800',
  },
  employeeInfoCol: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  employeeNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  employeeOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  employeeOfflinePill: {
    backgroundColor: '#F1F5F9',
  },
  employeeStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#15803D',
  },
  employeeOfflineDot: {
    backgroundColor: '#94A3B8',
  },
  employeeOnlineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  employeeOfflineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  employeeEmpId: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  empIdValue: {
    color: '#D97706',
    fontWeight: '700',
  },
  employeeRevCol: {
    alignItems: 'flex-end',
  },
  employeeRevLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  employeeRevAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  revDollarSign: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  revCents: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Bottom Row in Employee Card */
  employeeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shiftsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftsLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 2,
  },
  paidShiftsPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  paidShiftsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  unpaidShiftsPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  unpaidShiftsPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  unpaidShiftsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  unpaidShiftsTextActive: {
    color: '#B45309',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
});

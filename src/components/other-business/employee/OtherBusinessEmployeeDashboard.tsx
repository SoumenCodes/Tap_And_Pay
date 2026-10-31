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
import { useAuth } from '../../../context/AuthContext';
import {
  dashboardService,
  DashboardData,
  RecentTransactionItem,
} from '../../../services/dashboardService';
import { shiftService } from '../../../services/shiftService';
import {
  formatSydneyToUserTime,
  formatSydneyShiftRange,
} from '../../../utils/dateUtils';

interface OtherBusinessEmployeeDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
  empId?: string;
}

export default function OtherBusinessEmployeeDashboard({
  businessName = '',
  userName = '',
  sessionStartTime = '',
  empId = '',
}: OtherBusinessEmployeeDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showConfirm, showAlert } = useConfirmModal();

  // API State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shift state
  const [isOnShift, setIsOnShift] = useState<boolean>(false);
  const [isShiftActionLoading, setIsShiftActionLoading] = useState<boolean>(false);

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
          console.warn('Failed to load employee dashboard:', err?.message || err);
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
      console.warn('Failed to refresh employee dashboard:', err?.message || err);
      setErrorMessage(err?.message || 'Unable to refresh dashboard data.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Header data
  const header = dashboardData?.header;
  const displayBusinessName = header?.business_name || businessName || '--';
  const displayUserName = header?.full_name || header?.first_name || userName || '--';
  const displayEmpId = header?.identifier_value || empId || '--';

  // Resolve shift start time in user's local timezone from Sydney timestamps
  const rawStartAt =
    dashboardData?.active_shift?.start_at ||
    (dashboardData as any)?.start_at ||
    shiftService.getActiveShift()?.start_at;
  const rawStartTime =
    dashboardData?.active_shift?.start_time ||
    dashboardData?.start_time ||
    shiftService.getActiveShift()?.start_time;

  const displayStartTime = isOnShift
    ? (rawStartAt ? formatSydneyToUserTime(rawStartAt) : null) ||
      (rawStartTime ? formatSydneyToUserTime(rawStartTime) : null) ||
      sessionStartTime ||
      '--'
    : '--';
  const activeShiftCode =
    dashboardData?.active_shift?.display_shift_id ||
    header?.active_shift_code ||
    dashboardData?.active_shift_text ||
    (isOnShift ? '--' : 'No Active Shift');

  // Revenue metrics breakdown
  const revenue = dashboardData?.revenue;
  const totalRevFormatted = revenue?.total_amount_formatted || '$0.00';
  const totalCountText = revenue?.total_count_formatted || `${revenue?.total_count ?? 0} Txns`;

  const cardRevFormatted = revenue?.card?.amount_formatted || '$0.00';
  const cardCountText = revenue?.card?.count_formatted || `${revenue?.card?.count ?? 0} Txns`;

  const tapRevFormatted = revenue?.tap_and_go?.amount_formatted || '$0.00';
  const tapCountText = revenue?.tap_and_go?.count_formatted || `${revenue?.tap_and_go?.count ?? 0} Txns`;

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

  // Recent transactions list
  const recentTxns: RecentTransactionItem[] =
    dashboardData?.recent_transactions?.list || [];

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = async () => {
    if (isOnShift) {
      const shiftSessionId =
        dashboardData?.active_shift?.id ||
        shiftService.getActiveShift()?.id;

      showConfirm({
        title: 'End Shift',
        message: `Are you sure you want to end your current active shift (${activeShiftCode})?`,
        confirmText: 'End Shift',
        cancelText: 'Cancel',
        type: 'warning',
        icon: 'stop-circle-outline',
        onConfirm: async () => {
          if (!shiftSessionId) {
            setIsOnShift(false);
            showAlert({
              title: 'Shift Reset',
              message: 'Active shift state refreshed.',
              type: 'info',
              icon: 'information-circle-outline',
            });
            await handleRefresh();
            return;
          }

          try {
            const userId = user?.id ? Number(user.id) : undefined;
            const res = await shiftService.endShift({
              shift_session_id: shiftSessionId,
              user_id: userId,
            });

            if (res.status) {
              setIsOnShift(false);
              const shiftTimeRange = formatSydneyShiftRange(
                res.data?.start_at,
                res.data?.end_at
              );
              showAlert({
                title: 'Shift Ended',
                message: shiftTimeRange
                  ? `Active shift ended.\nShift: ${shiftTimeRange}`
                  : res.message || 'Active shift ended. Summary submitted to records.',
                buttonText: 'OK',
                type: 'success',
                icon: 'checkmark-circle-outline',
              });
              await handleRefresh();
            } else {
              // If backend indicates already closed, synchronize client state
              if (
                res.message?.toLowerCase().includes('already ended') ||
                res.message?.toLowerCase().includes('not active')
              ) {
                setIsOnShift(false);
                const shiftTimeRange = formatSydneyShiftRange(
                  res.data?.start_at,
                  res.data?.end_at
                );
                showAlert({
                  title: 'Shift Closed',
                  message: shiftTimeRange
                    ? `${res.message}\nShift: ${shiftTimeRange}`
                    : res.message,
                  buttonText: 'OK',
                  type: 'info',
                  icon: 'information-circle-outline',
                });
                await handleRefresh();
              } else {
                showAlert({
                  title: 'End Shift Failed',
                  message: res.message || 'Unable to end shift. Please try again.',
                  buttonText: 'OK',
                  type: 'danger',
                  icon: 'alert-circle-outline',
                });
              }
            }
          } catch (err: any) {
            showAlert({
              title: 'End Shift Failed',
              message:
                err?.response?.data?.message ||
                err?.message ||
                'Unable to end shift. Please try again.',
              buttonText: 'OK',
              type: 'danger',
              icon: 'alert-circle-outline',
            });
          }
        },
      });
    } else {
      setIsShiftActionLoading(true);
      try {
        const res = await shiftService.startShift();
        if (res.status && res.data) {
          setIsOnShift(true);
          const localStartTime = formatSydneyToUserTime(
            res.data.active_shift?.start_at || res.data.active_shift?.start_time
          );
          showAlert({
            title: 'Shift Started',
            message: localStartTime
              ? `Shift started at ${localStartTime}. Ready to accept sales.`
              : res.message || 'Active on shift. Ready to accept sales.',
            buttonText: 'OK',
            type: 'success',
            icon: 'checkmark-circle-outline',
          });
          // Refresh dashboard data to sync backend shift state
          await handleRefresh();
        } else {
          showAlert({
            title: 'Start Shift Failed',
            message: res.message || 'Unable to start shift. Please try again.',
            buttonText: 'OK',
            type: 'danger',
            icon: 'alert-circle-outline',
          });
        }
      } catch (err: any) {
        showAlert({
          title: 'Start Shift Failed',
          message:
            err?.response?.data?.message ||
            err?.message ||
            'Unable to start shift. Please try again.',
          buttonText: 'OK',
          type: 'danger',
          icon: 'alert-circle-outline',
        });
      } finally {
        setIsShiftActionLoading(false);
      }
    }
  };

  const handleNavigateToTransactions = () => {
    router.push('/(tabs)/transactions');
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

        {/* 1. Combined Hero Banner & Employee Welcome Card */}
        <View style={styles.topCardContainer}>
          {/* Top Banner Image */}
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

            {/* Bottom-left overlay: Badge + translucent text badge */}
            <View style={styles.bannerBottomRow}>
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

          {/* Employee Info Section */}
          <View style={styles.welcomeInfoContainer}>
            <Text style={styles.welcomeTitle}>
              Welcome, <Text style={styles.userNameBold}>{displayUserName}</Text>
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

          {/* Active Shift Row with ON SHIFT Pill */}
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

        {/* 2. CREATE SALE Quick Action Card (Gold gradient with scissors icon) */}
        {isOnShift && (
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

        {/* 3. Revenue Card */}
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

        {/* 4. End / Start Shift Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isShiftActionLoading}
          onPress={handleToggleShift}
          style={[styles.shiftButton, !isOnShift && styles.startShiftButton]}
        >
          {isShiftActionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isOnShift ? 'exit-outline' : 'enter-outline'}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.shiftButtonText}>
                {isOnShift ? 'End Shift' : 'Start Shift'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* 5. Recent Transactions Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentSectionTitle}>
              {dashboardData?.recent_transactions?.title || 'Recent Transactions'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNavigateToTransactions}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Indicator */}
          {isLoading && !isRefreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D97706" />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && recentTxns.length === 0 && (
            <View style={styles.emptyRecentBox}>
              <Feather name="file-text" size={32} color="#CBD5E1" />
              <Text style={styles.emptyRecentTitle}>No Recent Transactions</Text>
              <Text style={styles.emptyRecentSub}>
                Transactions processed during your active shift will appear here.
              </Text>
            </View>
          )}

          {/* Transaction Cards dynamically rendered from API */}
          {recentTxns.map((txn, index) => {
            const txnCode = txn.txn_id || txn.transaction_id || `#TXN-${txn.id}`;
            const timeText =
              (txn.created_at ? formatSydneyToUserTime(txn.created_at) : null) ||
              txn.time_formatted ||
              txn.created_at ||
              '--';
            const method = (txn.payment_method || 'card').toLowerCase();
            const isTap = method.includes('tap') || method.includes('nfc');

            return (
              <TouchableOpacity
                key={txn.id || index}
                style={styles.txnCard}
                activeOpacity={0.85}
                onPress={handleNavigateToTransactions}
              >
                <View style={styles.txnLeftWrap}>
                  <Text style={styles.txnIdText}>{txnCode}</Text>
                  <Text style={styles.txnTimeText}>{timeText}</Text>
                  <View style={[styles.cardPill, isTap && styles.tapPill]}>
                    <Ionicons
                      name={isTap ? 'radio-outline' : 'card'}
                      size={10}
                      color={isTap ? '#EA580C' : '#2563EB'}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={[styles.cardPillText, isTap && styles.tapPillText]}>
                      {txn.payment_method_label || (isTap ? 'Tap & Go' : 'Card')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.txnAmount}>
                  {txn.amount_formatted || `$${txn.amount?.toFixed(2) || '0.00'}`}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  emptyRecentBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  emptyRecentTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyRecentSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  /* 1. Top Card (Banner + Welcome + Active Shift) */
  topCardContainer: {
    backgroundColor: '#FFFDF7',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
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
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    padding: 2.5,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#E2E8F0',
    letterSpacing: 0.1,
  },

  /* Welcome Info */
  welcomeInfoContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  welcomeTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  userNameBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  empIdMetaLabel: {
    fontSize: 11,
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
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  /* Active Shift Row */
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
    fontSize: 10.5,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  offShiftText: {
    color: '#DC2626',
  },

  /* 2. Create Sale Quick Action Card */
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

  /* 3. Revenue Card */
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

  /* 4. Shift Button */
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

  /* 5. Recent Transactions */
  recentSection: {
    marginTop: 2,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txnLeftWrap: {
    gap: 3,
  },
  txnIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  cardPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  tapPill: {
    backgroundColor: '#FFF7ED',
  },
  tapPillText: {
    color: '#EA580C',
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
});

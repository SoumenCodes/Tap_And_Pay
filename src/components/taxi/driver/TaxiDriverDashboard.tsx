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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { useAuth } from '../../../context/AuthContext';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import { paymentSession } from '../../../services/paymentSession';
import {
  dashboardService,
  DashboardData,
  RecentTransactionItem,
} from '../../../services/dashboardService';
import { shiftService, onShiftChange } from '../../../services/shiftService';
import { formatSydneyToUserTime, formatSydneyShiftRange } from '../../../utils/dateUtils';

interface TaxiDriverDashboardProps {
  businessName?: string;
  userName?: string;
  taxiNumber?: string;
  sessionStartTime?: string;
}

export default function TaxiDriverDashboard({
  businessName = '',
  userName = '',
  taxiNumber = '',
  sessionStartTime = '',
}: TaxiDriverDashboardProps) {
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      const res = await dashboardService.getDashboard();
      if (res?.data) {
        setDashboardData(res.data);
        setIsOnShift(Boolean(res.data.is_on_shift));
      }
    } catch (err: any) {
      console.warn('Failed to refresh dashboard data:', err?.message || err);
      setErrorMessage(err?.message || 'Unable to refresh dashboard data.');
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    dashboardService
      .getDashboard()
      .then((res) => {
        if (isMounted && res?.data) {
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
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync shift changes across the app
  useEffect(() => {
    const unsub = onShiftChange(() => {
      handleRefresh();
    });
    return () => unsub();
  }, [handleRefresh]);

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [handleRefresh])
  );

  // Header data
  const header = dashboardData?.header;
  const displayBusinessName = header?.business_name || businessName || user?.businessName || '--';
  const displayUserName = header?.full_name || header?.first_name || userName || user?.name || '--';
  const displayTaxiNumber = header?.identifier_value || taxiNumber || user?.taxiNumber || '--';

  // Compute initials for the badge
  const initials = (() => {
    const raw = displayBusinessName !== '--' ? displayBusinessName : displayUserName;
    const parts = raw.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase() || 'TD';
  })();

  // Shift Start Time
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

  // Revenue metrics
  const revenue = dashboardData?.revenue;
  const timeframeLabel = revenue?.timeframe_label || 'Last 7 days';
  const totalAmountFormatted = revenue?.total_amount_formatted || '$0.00';
  const totalCountText = revenue?.total_count_formatted || `${revenue?.total_count ?? 0} ${revenue?.unit || 'Trips'}`;

  const cardAmountFormatted = revenue?.card?.amount_formatted || '$0.00';
  const cardCountText = revenue?.card?.count_formatted || `${revenue?.card?.count ?? 0} txns`;

  const tapAmountFormatted = revenue?.tap_and_go?.amount_formatted || '$0.00';
  const tapCountText = revenue?.tap_and_go?.count_formatted || `${revenue?.tap_and_go?.count ?? 0} txns`;

  const splitAmount = (formatted: string) => {
    const cleaned = formatted.replace('$', '').trim();
    if (cleaned.includes('.')) {
      const [whole, cents] = cleaned.split('.');
      return { whole, cents: `.${cents}` };
    }
    return { whole: cleaned, cents: '.00' };
  };

  const totalSplit = splitAmount(totalAmountFormatted);
  const cardSplit = splitAmount(cardAmountFormatted);
  const tapSplit = splitAmount(tapAmountFormatted);

  // Recent trips
  const recentTripsSection =
    dashboardData?.recent_trips || dashboardData?.recent_transactions;
  const recentTrips: RecentTransactionItem[] =
    recentTripsSection?.list || [];

  const handleStartTaxiFare = () => {
    paymentSession.markPaymentCompleted();
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = async () => {
    if (isOnShift) {
      const shiftSessionId =
        dashboardData?.active_shift?.id || shiftService.getActiveShift()?.id;

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

          setIsShiftActionLoading(true);
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
                  : res.message || 'Active shift ended. Shift tally submitted to fleet dispatch.',
                buttonText: 'OK',
                type: 'success',
                icon: 'checkmark-circle-outline',
              });
              await handleRefresh();
            } else {
              if (
                res.message?.toLowerCase().includes('already ended') ||
                res.message?.toLowerCase().includes('not active') ||
                res.message?.toLowerCase().includes('no active shift')
              ) {
                setIsOnShift(false);
                showAlert({
                  title: 'Shift Status',
                  message: res.message,
                  buttonText: 'OK',
                  type: 'info',
                  icon: 'information-circle-outline',
                });
                await handleRefresh();
              } else {
                showAlert({
                  title: 'Failed to End Shift',
                  message: res.message || 'An error occurred while ending shift.',
                  buttonText: 'OK',
                  type: 'danger',
                  icon: 'alert-circle-outline',
                });
              }
            }
          } catch (err: any) {
            showAlert({
              title: 'Error',
              message: err?.message || 'Failed to communicate with shift service.',
              buttonText: 'OK',
              type: 'danger',
              icon: 'alert-circle-outline',
            });
          } finally {
            setIsShiftActionLoading(false);
          }
        },
      });
    } else {
      setIsShiftActionLoading(true);
      try {
        const res = await shiftService.startShift();

        if (res.status) {
          setIsOnShift(true);
          showAlert({
            title: 'Shift Started',
            message: `Shift #${res.data?.active_shift?.display_shift_id || ''} started successfully. Active on shift.`,
            buttonText: 'OK',
            type: 'success',
            icon: 'checkmark-circle-outline',
          });
          await handleRefresh();
        } else {
          showAlert({
            title: 'Failed to Start Shift',
            message: res.message || 'Unable to start shift.',
            buttonText: 'OK',
            type: 'danger',
            icon: 'alert-circle-outline',
          });
        }
      } catch (err: any) {
        showAlert({
          title: 'Error',
          message: err?.message || 'Failed to start shift.',
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

      {/* Header Bar with title */}
      <HeaderBar title={header?.title || 'SE PAY DASHBOARD'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
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
        {/* Error banner if present */}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* 1. Combined Hero Banner & Driver Info Card */}
        <View style={styles.topCardContainer}>
          {/* Banner */}
          <View style={styles.bannerContainer}>
            {header?.banner_image_url ? (
              <Image
                source={{ uri: header.banner_image_url }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../../../assets/elite_taxi_hero.png')}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            )}

            {/* Bottom-left row: Avatar + Translucent Text Badge */}
            <View style={styles.bannerBottomRow}>
              <View style={styles.avatarBox}>
                {Boolean(header?.logo_url || user?.logoUrl) ? (
                  <Image
                    source={{ uri: (header?.logo_url || user?.logoUrl)! }}
                    style={styles.avatarLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
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

          {/* Welcome & Shift Info Box */}
          <View style={styles.welcomeBody}>
            <View style={styles.welcomeCenterWrap}>
              <Text style={styles.welcomeTitle}>
                Welcome, <Text style={styles.welcomeNameBold}>{displayUserName}</Text>
              </Text>

              <View style={styles.welcomeMetaRow}>
                <Text style={styles.taxiMetaLabel}>
                  Taxi No.: <Text style={styles.taxiNoHighlight}>{displayTaxiNumber}</Text>
                </Text>
                {isOnShift && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <View style={styles.clockRow}>
                      <Feather name="clock" size={12} color="#64748B" style={styles.clockIcon} />
                      <Text style={styles.shiftStartText}>
                        Shift Start: {displayStartTime}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Active Shift row with ON/OFF SHIFT pill */}
            <View style={styles.activeShiftRow}>
              <Text style={styles.activeShiftLabel}>
                ACTIVE SHIFT:{' '}
                <Text style={styles.activeShiftCode}>
                  {activeShiftCode}
                </Text>
              </Text>

              <View
                style={[
                  styles.onShiftBadge,
                  !isOnShift && styles.offShiftBadge,
                ]}
              >
                <View
                  style={[
                    styles.onShiftDot,
                    !isOnShift && styles.offShiftDot,
                  ]}
                />
                <Text
                  style={[
                    styles.onShiftText,
                    !isOnShift && styles.offShiftText,
                  ]}
                >
                  {isOnShift ? 'ON SHIFT' : 'OFF SHIFT'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. TAXI FARE Golden Card (Only visible when On Shift) */}
        {isOnShift && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartTaxiFare}
            style={styles.taxiFareCard}
          >
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.taxiFareGradient}
            >
              <View style={styles.taxiFareIconBox}>
                {Boolean(user?.logoUrl || header?.logo_url) ? (
                  <Image
                    source={{ uri: (user?.logoUrl || header?.logo_url)! }}
                    style={styles.taxiLogoImage}
                    resizeMode="contain"
                  />
                ) : (
                  <MaterialCommunityIcons name="taxi" size={26} color="#0F172A" />
                )}
              </View>

              <View style={styles.taxiFareTextCol}>
                <Text style={styles.taxiFareTitle}>TAXI FARE</Text>
                <Text style={styles.taxiFareSubtitle}>Ready to charge passengers</Text>
              </View>

              <View style={styles.taxiFareArrowCircle}>
                <Feather name="chevron-right" size={20} color="#78350F" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 3. Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueTitleRow}>
              <Text style={styles.revenueMainTitle}>Revenue </Text>
              <Text style={styles.revenueSubTitle}>{timeframeLabel}</Text>
            </View>
            <View style={styles.tripsCountBadge}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
              <Text style={styles.tripsCountText}>{totalCountText}</Text>
            </View>
          </View>

          {/* 3 Metrics: Total, Card, Tap & Go */}
          <View style={styles.metricsRow}>
            {/* 1. Total */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricColorDot, { backgroundColor: '#D97706' }]} />
                <Text style={[styles.metricLabelText, { color: '#B45309' }]}>TOTAL</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarOrange}>$</Text>
                {totalSplit.whole}
                <Text style={styles.metricCents}>{totalSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubInfo}>{totalCountText}</Text>
            </View>

            {/* 2. Card */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="card" size={12} color="#2563EB" style={styles.metricCardIcon} />
                <Text style={[styles.metricLabelText, { color: '#2563EB' }]}>CARD</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarBlue}>$</Text>
                {cardSplit.whole}
                <Text style={styles.metricCents}>{cardSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubInfo}>{cardCountText}</Text>
            </View>

            {/* 3. Tap & Go */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricColorDot, { backgroundColor: '#EA580C' }]} />
                <Text style={[styles.metricLabelText, { color: '#EA580C' }]}>TAP & GO</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarAmber}>$</Text>
                {tapSplit.whole}
                <Text style={styles.metricCents}>{tapSplit.cents}</Text>
              </Text>
              <Text style={styles.metricSubInfo}>{tapCountText}</Text>
            </View>
          </View>
        </View>

        {/* 4. End / Start Shift Action Button (Black) */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isShiftActionLoading}
          onPress={handleToggleShift}
          style={styles.shiftButton}
        >
          {isShiftActionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons
                name={isOnShift ? 'logout' : 'login'}
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

        {/* 5. Recent Trips Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>
              {recentTripsSection?.title || 'Recent Trips'}
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
          {!isLoading && recentTrips.length === 0 && (
            <View style={styles.emptyRecentBox}>
              <Feather name="file-text" size={32} color="#CBD5E1" />
              <Text style={styles.emptyRecentTitle}>No Recent Trips</Text>
              <Text style={styles.emptyRecentSub}>
                Trips processed during your active shift will appear here.
              </Text>
            </View>
          )}

          {/* Trip Cards dynamically rendered */}
          {recentTrips.map((txn, index) => {
            const txnCode = txn.txn_id || txn.transaction_id || `#TXN-${txn.id}`;
            const timeText =
              (txn.date ? formatSydneyToUserTime(txn.date) : null) ||
              (txn.created_at ? formatSydneyToUserTime(txn.created_at) : null) ||
              txn.time ||
              txn.time_formatted ||
              '--';
            const method = (txn.payment_method || 'card').toLowerCase();
            const isTap = method.includes('tap') || method.includes('nfc');
            const isCash = method.includes('cash');
            const amountStr = txn.amount_formatted || (txn.amount !== undefined ? `$${Number(txn.amount).toFixed(2)}` : '$0.00');
            const split = splitAmount(amountStr);
            const pickupText = txn.pickup || txn.pickup_location || txn.route?.pickup;
            const dropoffText = txn.dropoff || txn.dropoff_location || txn.drop_location || txn.route?.dropoff;
            const hasRoute = Boolean(pickupText || dropoffText);

            return (
              <TouchableOpacity
                key={txn.id || index}
                style={styles.tripCard}
                activeOpacity={0.85}
                onPress={handleNavigateToTransactions}
              >
                <View style={styles.tripHeaderRow}>
                  <Text style={styles.tripIdText}>{txnCode}</Text>
                  <Text style={styles.tripTimeText}>{timeText}</Text>
                  <View
                    style={[
                      styles.cardPill,
                      isTap && styles.tapPill,
                      isCash && styles.cashPill,
                    ]}
                  >
                    <Ionicons
                      name={isCash ? 'cash-outline' : isTap ? 'radio-outline' : 'card'}
                      size={11}
                      color={isCash ? '#059669' : isTap ? '#EA580C' : '#2563EB'}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={[
                        styles.cardPillText,
                        isTap && styles.tapPillText,
                        isCash && styles.cashPillText,
                      ]}
                    >
                      {txn.payment_method_label || (isCash ? 'Cash' : isTap ? 'Tap & Go' : 'Card')}
                    </Text>
                  </View>
                  <View style={styles.spacer} />
                  <Text style={styles.tripAmountText}>
                    <Text style={styles.dollarOrange}>$</Text>
                    {split.whole}
                    <Text style={styles.tripCents}>{split.cents}</Text>
                  </Text>
                </View>

                {hasRoute && (
                  <View style={styles.routeContainer}>
                    {pickupText && (
                      <View style={styles.routePointRow}>
                        <View style={[styles.routeDot, { backgroundColor: '#2563EB' }]} />
                        <Text style={styles.routeAddressText}>{pickupText}</Text>
                      </View>
                    )}
                    {pickupText && dropoffText && <View style={styles.routeConnector} />}
                    {dropoffText && (
                      <View style={styles.routePointRow}>
                        <View style={[styles.routeDot, { backgroundColor: '#EA580C' }]} />
                        <Text style={styles.routeAddressText}>{dropoffText}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },

  /* 1. Combined Top Card */
  topCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  bannerTextBadge: {
    flexShrink: 1,
    marginLeft: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  bannerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FBBF24',
    marginTop: 2,
  },
  welcomeBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  welcomeCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  welcomeTitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeNameBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxiMetaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  taxiNoHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#CBD5E1',
    fontSize: 11,
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
    color: '#64748B',
  },
  activeShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  activeShiftLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  activeShiftCode: {
    fontWeight: '600',
    color: '#475569',
  },
  onShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  offShiftBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  onShiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  offShiftDot: {
    backgroundColor: '#94A3B8',
  },
  onShiftText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.3,
  },
  offShiftText: {
    color: '#64748B',
  },

  /* 2. Taxi Fare CTA Card */
  taxiFareCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  taxiFareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taxiFareIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
    padding: 4,
  },
  taxiLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  taxiFareTextCol: {
    flex: 1,
  },
  taxiFareTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  taxiFareSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#451A03',
    marginTop: 2,
  },
  taxiFareArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(254, 240, 138, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Revenue Card */
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  revenueTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  revenueMainTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  revenueSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  tripsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingTop: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricColorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  metricCardIcon: {
    marginRight: 4,
  },
  metricLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metricValueText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricDollarOrange: {
    color: '#D97706',
    fontWeight: '800',
  },
  metricDollarBlue: {
    color: '#2563EB',
    fontWeight: '800',
  },
  metricDollarAmber: {
    color: '#EA580C',
    fontWeight: '800',
  },
  metricCents: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  metricSubInfo: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* 4. Action Button (Black) */
  shiftButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 5. Recent Trips */
  recentSection: {
    marginTop: 4,
    gap: 10,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyRecentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyRecentSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  cardPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  tapPill: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  tapPillText: {
    color: '#EA580C',
  },
  cashPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  cashPillText: {
    color: '#059669',
  },
  spacer: {
    flex: 1,
  },
  tripAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dollarOrange: {
    color: '#D97706',
    fontWeight: '800',
  },
  tripCents: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  routeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 9,
  },
  routeConnector: {
    marginLeft: 3.5,
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  routeAddressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
  },
});

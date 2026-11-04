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
  ActiveDriverItem,
} from '../../../services/dashboardService';
import { shiftService, onShiftChange } from '../../../services/shiftService';
import { formatSydneyToUserTime, formatSydneyShiftRange } from '../../../utils/dateUtils';

interface TaxiBusinessDashboardProps {
  businessName?: string;
  userName?: string;
  taxiNumber?: string;
  sessionStartTime?: string;
}

export default function TaxiBusinessDashboard({
  businessName = '',
  userName = '',
  taxiNumber = '',
  sessionStartTime = '',
}: TaxiBusinessDashboardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showConfirm, showAlert } = useConfirmModal();

  // API State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Shift & Online state
  const [isOnShift, setIsOnShift] = useState<boolean>(false);
  const [isShiftActionLoading, setIsShiftActionLoading] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'on_shift' | 'off_shift'>('on_shift');

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

  // Derived Header values
  const header = dashboardData?.header;
  const displayBusinessName = header?.business_name || businessName || user?.businessName || '--';
  const displayUserName = header?.full_name || header?.first_name || userName || user?.name || '--';
  const displayIdentifier = header?.identifier_value || taxiNumber || user?.taxiNumber || user?.empId || '--';

  const initials = (() => {
    const raw = displayBusinessName || displayUserName;
    const parts = raw.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase() || 'TB';
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

  // Drivers List & Summary
  const drivers: ActiveDriverItem[] = dashboardData?.active_drivers?.list || [];
  const summary = dashboardData?.active_drivers?.summary;

  const onShiftCount =
    summary?.on_shift_count ??
    drivers.filter((d) => (d.is_on_shift !== undefined ? d.is_on_shift : d.is_online)).length;
  const offShiftCount =
    summary?.off_shift_count ??
    drivers.filter((d) => !(d.is_on_shift !== undefined ? d.is_on_shift : d.is_online)).length;
  const totalCount = summary?.total_count ?? drivers.length;

  const filteredDrivers = drivers.filter((d) => {
    const isDriverOnShift = d.is_on_shift !== undefined ? d.is_on_shift : d.is_online;
    return filterMode === 'on_shift' ? isDriverOnShift : !isDriverOnShift;
  });

  // Revenue Metrics
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
                  ? `Shift tally submitted to records.\nShift: ${shiftTimeRange}`
                  : res.message || 'Shift tally submitted to records.',
                buttonText: 'OK',
                type: 'success',
                icon: 'checkmark-circle-outline',
              });
              await handleRefresh();
            } else {
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

  const handleDriverPress = (driver: ActiveDriverItem) => {
    router.push({
      pathname: '/driver-details',
      params: { id: String(driver.id) },
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="SE PAY DASHBOARD" />

      {isLoading && !dashboardData ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading taxi dashboard...</Text>
        </View>
      ) : (
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
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* 1. Hero Banner */}
          <View style={styles.bannerContainer}>
            {header?.banner_image_url ? (
              <Image
                source={{ uri: header.banner_image_url }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.bannerImage, { backgroundColor: '#0F172A' }]} />
            )}

            {/* Bottom-left row: Avatar + Translucent Text Badge */}
            <View style={styles.bannerBottomRow}>
              <View style={styles.avatarBox}>
                {header?.logo_url ? (
                  <Image
                    source={{ uri: header.logo_url }}
                    style={styles.avatarLogoImage}
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

          {/* 2. Welcome Card */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeCenterWrap}>
              <Text style={styles.welcomeTitle}>
                Welcome, <Text style={styles.welcomeNameBold}>{displayUserName}</Text>
              </Text>

              <View style={styles.welcomeMetaRow}>
                <Text style={styles.taxiMetaLabel}>
                  Taxi No.: <Text style={styles.taxiNoHighlight}>{displayIdentifier}</Text>
                </Text>
                {isOnShift && (
                  <>
                    <Text style={styles.metaDot}>•</Text>
                    <View style={styles.clockRow}>
                      <Feather name="clock" size={13} color="#64748B" style={styles.clockIcon} />
                      <Text style={styles.shiftStartText}>
                        Shift Start: {displayStartTime}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.activeShiftRow}>
              <Text style={styles.activeShiftLabel}>
                ACTIVE SHIFT: <Text style={styles.activeShiftCode}>{activeShiftCode}</Text>
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

          {/* 3. TAXI FARE Big Golden Card (Only visible when On Shift) */}
          {isOnShift && (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleStartTaxiFare}
              style={styles.taxiFareCard}
            >
              <LinearGradient
                colors={['#F59E0B', '#FBBF24', '#FCD34D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.taxiFareGradient}
              >
                {/* Left Taxi Icon Box */}
                <View style={styles.taxiIconWrap}>
                  {Boolean(user?.logoUrl || header?.logo_url) ? (
                    <Image
                      source={{ uri: (user?.logoUrl || header?.logo_url)! }}
                      style={styles.taxiLogoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="taxi" size={28} color="#0F172A" />
                  )}
                </View>

                {/* Text Information */}
                <View style={styles.taxiFareTextWrap}>
                  <Text style={styles.taxiFareTitle}>TAXI FARE</Text>
                  <Text style={styles.taxiFareSubtitle}>Ready to charge passengers</Text>
                </View>

                {/* Right Circular Arrow */}
                <View style={styles.fareArrowCircle}>
                  <Feather name="chevron-right" size={22} color="#0F172A" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* 4. Revenue Card */}
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <View style={styles.revenueTitleRow}>
                <Text style={styles.revenueMainTitle}>Revenue </Text>
                <Text style={styles.revenueSubTitle}>{timeframeLabel}</Text>
              </View>
              <View style={styles.tripsCountBadge}>
                <Ionicons name="checkmark-circle-outline" size={17} color="#059669" />
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
                  <Text style={{ color: '#D97706', fontWeight: '800' }}>$</Text>
                  {totalSplit.whole}
                  <Text style={styles.metricCents}>{totalSplit.cents}</Text>
                </Text>
                <Text style={styles.metricSubInfo}>{totalCountText}</Text>
              </View>

              {/* 2. Card */}
              <View style={styles.metricCol}>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="card" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                  <Text style={[styles.metricLabelText, { color: '#2563EB' }]}>CARD</Text>
                </View>
                <Text style={styles.metricValueText}>
                  <Text style={{ color: '#2563EB', fontWeight: '800' }}>$</Text>
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
                  <Text style={{ color: '#EA580C', fontWeight: '800' }}>$</Text>
                  {tapSplit.whole}
                  <Text style={styles.metricCents}>{tapSplit.cents}</Text>
                </Text>
                <Text style={styles.metricSubInfo}>{tapCountText}</Text>
              </View>
            </View>
          </View>

          {/* 5. End / Start Shift Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleToggleShift}
            disabled={isShiftActionLoading}
            style={[styles.shiftButton, isShiftActionLoading && { opacity: 0.7 }]}
          >
            {isShiftActionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isOnShift ? 'logout' : 'login'}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.shiftButtonText}>
                  {isOnShift ? 'End Shift' : 'Start Shift'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* 6. Active Drivers Section */}
          <View style={styles.driversSection}>
            <View style={styles.driversHeaderRow}>
              <View style={styles.driversTitleWrap}>
                <Text style={styles.driversMainTitle}>Active Drivers</Text>
                <View style={styles.totalDriversBadge}>
                  <Text style={styles.totalDriversText}>{totalCount} Total</Text>
                </View>
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

            {/* Driver List Cards */}
            <View style={styles.driversList}>
              {filteredDrivers.length === 0 ? (
                <View style={styles.emptyDriversWrap}>
                  <Feather name="users" size={24} color="#94A3B8" />
                  <Text style={styles.emptyDriversText}>
                    {filterMode === 'on_shift'
                      ? 'No drivers currently on shift'
                      : 'No drivers currently off shift'}
                  </Text>
                </View>
              ) : (
                filteredDrivers.map((driver) => {
                  const isDriverOnline =
                    driver.is_on_shift !== undefined ? driver.is_on_shift : driver.is_online;
                  const driverInitials =
                    driver.initials ||
                    driver.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) ||
                    'DR';

                  const revFormatted = driver.active_shift_revenue_formatted || '$0.00';
                  const revSplit = splitAmount(revFormatted);

                  return (
                    <TouchableOpacity
                      key={String(driver.id)}
                      style={styles.driverCard}
                      activeOpacity={0.8}
                      onPress={() => handleDriverPress(driver)}
                    >
                      {/* Top Row: Avatar + Info + Shift Rev */}
                      <View style={styles.driverTopRow}>
                        {driver.profile_photo_url ? (
                          <Image
                            source={{ uri: driver.profile_photo_url }}
                            style={styles.driverAvatar}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.driverAvatar, styles.initialsAvatarBox]}>
                            <Text style={styles.driverInitialsText}>{driverInitials}</Text>
                          </View>
                        )}

                        <View style={styles.driverInfoCol}>
                          <View style={styles.driverNameRow}>
                            <Text style={styles.driverNameText} numberOfLines={1}>
                              {driver.name}
                            </Text>
                            <View
                              style={[
                                styles.driverOnlinePill,
                                !isDriverOnline && styles.driverOfflinePill,
                              ]}
                            >
                              <View
                                style={[
                                  styles.driverStatusDot,
                                  !isDriverOnline && styles.driverOfflineDot,
                                ]}
                              />
                              <Text
                                style={[
                                  styles.driverOnlineText,
                                  !isDriverOnline && styles.driverOfflineText,
                                ]}
                              >
                                {isDriverOnline ? 'Online' : 'Offline'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.driverPlateDC}>
                            Taxi No.:{' '}
                            <Text style={styles.plateHighlight}>{driver.taxi_no || '--'}</Text>
                            {'  |  '}DC {driver.dc_number || '--'}
                          </Text>
                        </View>

                        <View style={styles.driverRevCol}>
                          <Text style={styles.driverRevLabel}>ACTIVE SHIFT REV</Text>
                          <Text style={styles.driverRevAmount}>
                            <Text style={styles.revDollarSign}>$</Text>
                            {revSplit.whole}
                            <Text style={styles.revCents}>{revSplit.cents}</Text>
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  bannerContainer: {
    width: '100%',
    height: 146,
    borderRadius: 16,
    overflow: 'hidden',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLogoImage: {
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
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
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
  taxiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  taxiLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  taxiFareTextWrap: {
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
  fareArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(254, 240, 138, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  driversSection: {
    marginTop: 4,
  },
  driversHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  driversTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driversMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  totalDriversBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  totalDriversText: {
    color: '#92400E',
    fontSize: 9.5,
    fontWeight: '700',
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
    borderRadius: 14,
  },
  filterPillActiveOn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  filterPillActiveOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
  },
  filterPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  filterDotActive: {
    backgroundColor: '#10B981',
  },
  filterDotInactive: {
    backgroundColor: '#94A3B8',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  filterTextActiveOn: {
    color: '#065F46',
    fontWeight: '700',
  },
  filterTextActiveOff: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#64748B',
  },
  driversList: {
    gap: 10,
  },
  emptyDriversWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyDriversText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  driverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  initialsAvatarBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B45309',
  },
  driverInfoCol: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  driverNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  driverOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  driverOfflinePill: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  driverStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  driverOfflineDot: {
    backgroundColor: '#94A3B8',
  },
  driverOnlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  driverOfflineText: {
    color: '#64748B',
  },
  driverPlateDC: {
    fontSize: 10,
    color: '#64748B',
  },
  plateHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  driverRevCol: {
    alignItems: 'flex-end',
  },
  driverRevLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  driverRevAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  revDollarSign: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12,
  },
  revCents: {
    fontSize: 9.5,
    color: '#475569',
  },
});

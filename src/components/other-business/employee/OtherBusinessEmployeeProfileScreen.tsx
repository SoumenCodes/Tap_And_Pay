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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import {
  profileService,
  ProfileResponseData,
} from '../../../services/profileService';
import {
  shiftService,
  onShiftChange,
} from '../../../services/shiftService';
import { dashboardService } from '../../../services/dashboardService';
import {
  formatSydneyToUserDateTime,
  formatSydneyToUserTime,
  formatSydneyShiftRange,
} from '../../../utils/dateUtils';

export default function OtherBusinessEmployeeProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showConfirm, showAlert } = useConfirmModal();

  // Profile API State (Clean Initialization with Zero Hardcoded Mock Fallbacks)
  const [profileData, setProfileData] = useState<ProfileResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnShift, setIsOnShift] = useState(false);
  const [isShiftActionLoading, setIsShiftActionLoading] = useState(false);

  const applyProfileData = useCallback((data: ProfileResponseData) => {
    setProfileData(data);
    if (data.current_session) {
      setIsOnShift(Boolean(data.current_session.has_active_session));
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      applyProfileData(data);
    } catch (err: any) {
      console.log('Failed to fetch other business employee profile:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [applyProfileData]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      fetchProfile();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchProfile]);

  // Synchronize employee profile state when shift status is changed across the app
  useEffect(() => {
    const unsub = onShiftChange(() => {
      fetchProfile();
    });
    return () => unsub();
  }, [fetchProfile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await profileService.getProfile();
      applyProfileData(data);
    } catch (err: any) {
      console.log('Failed to refresh other business employee profile:', err.message || err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyShiftId = () => {
    const code =
      profileData?.current_session?.display_shift_id ||
      profileData?.current_session?.shift_id;
    if (code) {
      showAlert({
        title: 'Shift ID',
        message: `Active Shift ID: ${code}`,
        type: 'info',
        icon: 'information-circle-outline',
      });
    }
  };

  const handleToggleShift = async () => {
    if (isOnShift) {
      const shiftCode =
        profileData?.current_session?.display_shift_id ||
        profileData?.current_session?.session_uuid ||
        profileData?.current_session?.shift_id ||
        shiftService.getActiveShift()?.display_shift_id ||
        '--';

      const shiftSessionId =
        profileData?.current_session?.shift_id ||
        shiftService.getActiveShift()?.id;

      showConfirm({
        title: 'End Shift',
        message: `Are you sure you want to end your current active shift (${shiftCode})?`,
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
            await fetchProfile();
            return;
          }

          setIsShiftActionLoading(true);
          try {
            const userId = profileData?.user?.id ? Number(profileData.user.id) : undefined;
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
                  : res.message || 'Active shift ended. Summary submitted to records.',
                buttonText: 'OK',
                type: 'success',
                icon: 'checkmark-circle-outline',
              });
              await fetchProfile();
              dashboardService.getDashboard().catch(() => {});
            } else {
              if (
                res.message?.toLowerCase().includes('already ended') ||
                res.message?.toLowerCase().includes('not active')
              ) {
                setIsOnShift(false);
                showAlert({
                  title: 'Shift Closed',
                  message: res.message,
                  buttonText: 'OK',
                  type: 'info',
                  icon: 'information-circle-outline',
                });
                await fetchProfile();
                dashboardService.getDashboard().catch(() => {});
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
          } finally {
            setIsShiftActionLoading(false);
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
              : res.message || 'You are now on shift and ready to accept sales.',
            buttonText: 'OK',
            type: 'success',
            icon: 'checkmark-circle-outline',
          });
          await fetchProfile();
          dashboardService.getDashboard().catch(() => {});
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

  const handleLogout = () => {
    showConfirm({
      title: 'Log Out Account',
      message: 'Are you sure you want to log out from SE PAY?',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'power',
      onConfirm: async () => {
        await logout();
        router.replace('/login');
      },
    });
  };

  const user = profileData?.user;
  const session = profileData?.current_session;

  const businessName =
    user?.business_name?.trim() ||
    user?.header_business_name?.trim() ||
    user?.parent_business?.business_name?.trim() ||
    '--';
  const employeeName =
    user?.display_name ||
    (user?.first_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') ||
    '--';
  const abnText =
    user?.abn?.trim() ||
    user?.parent_business?.abn?.trim() ||
    '--';
  const phoneText =
    user?.phone_no?.trim() ||
    user?.parent_business?.phone_no?.trim() ||
    '--';
  const empIdText = user?.emp_id || user?.employee_code || '--';
  const emailText = user?.email || '--';
  const addressText =
    user?.formatted_address ||
    user?.address?.formatted ||
    user?.address?.address_line1 ||
    '--';
  const avatarUri = user?.profile_photo_url || user?.logo_url;

  // Session metrics
  const shiftId = isOnShift
    ? session?.display_shift_id ||
      session?.session_uuid ||
      (session?.shift_id ? `SH${session.shift_id}` : null) ||
      shiftService.getActiveShift()?.display_shift_id ||
      '--'
    : 'No Active Shift';
  const totalAmountStr = session?.revenue?.total_amount_formatted || '$0.00';
  const txnsLabel = session?.revenue?.transaction_label || '0 Txns';
  const cardAmountStr = session?.revenue?.card?.amount_formatted || '$0.00';
  const cardTxnsStr = session?.revenue?.card?.count_formatted || '0 Txns';
  const tapAmountStr = session?.revenue?.tap_and_go?.amount_formatted || '$0.00';
  const tapTxnsStr = session?.revenue?.tap_and_go?.count_formatted || '0 Txns';

  const cleanTotal = totalAmountStr.replace('$', '').trim();
  const [wholeTotal, centsTotal] = cleanTotal.includes('.')
    ? cleanTotal.split('.')
    : [cleanTotal, '00'];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="Profile" showBack={false} />

      <ScrollView
        style={styles.scrollView}
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
        {/* Loading Indicator */}
        {isLoading && !profileData && (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#D97706" />
          </View>
        )}

        {/* ── 1. MAIN PROFILE SUMMARY CARD ── */}
        <View style={styles.profileCard}>
          {/* Avatar with Crown Badge */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrap}>
              <Image
                source={
                  avatarUri
                    ? { uri: avatarUri }
                    : require('../../../../assets/emp_avatar_2.png')
                }
                style={styles.avatarImg}
                resizeMode="cover"
              />
              <View style={styles.crownBadgeWrap}>
                <Image
                  source={require('../../../../assets/crown_cuts_badge_hd.png')}
                  style={styles.crownBadgeImg}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Business & Employee Details */}
          <Text style={styles.brandTitle}>{businessName.toUpperCase()}</Text>
          <Text style={styles.ownerNameText}>{employeeName}</Text>

          <View style={styles.metaLinesWrap}>
            <Text style={styles.metaLineText}>
              ABN: {abnText} • PH: {phoneText}
            </Text>
            <Text style={styles.metaLineText}>
              EMP ID: <Text style={styles.empIdBold}>{empIdText}</Text>
            </Text>
            <Text style={styles.metaLineText}>{emailText}</Text>
            <Text style={styles.metaLineText}>{addressText}</Text>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              !isOnShift && styles.statusPillOff,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                !isOnShift && styles.statusDotOff,
              ]}
            />
            <Text
              style={[
                styles.statusText,
                !isOnShift && styles.statusTextOff,
              ]}
            >
              {isOnShift
                ? session?.status_badge || 'Active • On Shift'
                : 'Off Shift • Inactive'}
            </Text>
          </View>

          {/* Shift Start Duration Text */}
          <Text style={styles.shiftDurationText}>
            {isOnShift
              ? session?.started_at
                ? `Started ${formatSydneyToUserDateTime(session.started_at)}${session.duration ? ` (${session.duration})` : ''}`
                : session?.started_at_formatted
                ? `Started ${session.started_at_formatted}${session.duration ? ` (${session.duration})` : ''}`
                : 'Active • Ready for sales'
              : 'Off Shift • Standby'}
          </Text>

          {/* Active Shift ID Box */}
          <View style={styles.activeShiftIdBox}>
            <View style={styles.activeShiftIdInfo}>
              <Text style={styles.activeShiftIdLabel}>
                {session?.has_active_session ? 'Active Shift ID' : 'Shift ID'}
              </Text>
              <Text style={styles.activeShiftIdCode}>{shiftId}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyShiftBtn}
              onPress={handleCopyShiftId}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="copy-outline" size={16} color="#B45309" />
            </TouchableOpacity>
          </View>

          {/* Active Shift Txns Card */}
          <View style={styles.activeTxnsCard}>
            <View style={styles.activeTxnsHeaderRow}>
              <Text style={styles.activeTxnsLabel}>
                {session?.revenue_title || 'Session Revenue'}
              </Text>
              <View style={styles.activeTxnsCountWrap}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.activeTxnsCountText}>{txnsLabel}</Text>
              </View>
            </View>

            {/* Big Amount */}
            <View style={styles.bigAmountRow}>
              <Text style={styles.bigAmountDollar}>$</Text>
              <Text style={styles.bigAmountWhole}>{wholeTotal}</Text>
              <Text style={styles.bigAmountCents}>.{centsTotal}</Text>
            </View>

            <View style={styles.txnsDivider} />

            {/* 2 Sub-metrics: Card & Tap & Go */}
            <View style={styles.subMetricsRow}>
              {/* Card */}
              <View style={styles.subMetricCol}>
                <View style={styles.subMetricLabelRow}>
                  <Ionicons name="card-outline" size={12} color="#2563EB" />
                  <Text style={styles.subMetricTitleCard}>CARD</Text>
                </View>
                <Text style={styles.subMetricValueCard}>{cardAmountStr}</Text>
                <Text style={styles.subMetricTxns}>{cardTxnsStr}</Text>
              </View>

              <View style={styles.subMetricDivider} />

              {/* Tap & Go */}
              <View style={styles.subMetricCol}>
                <View style={styles.subMetricLabelRow}>
                  <View style={styles.bulletTap} />
                  <Text style={styles.subMetricTitleTap}>TAP & GO</Text>
                </View>
                <Text style={styles.subMetricValueTap}>{tapAmountStr}</Text>
                <Text style={styles.subMetricTxns}>{tapTxnsStr}</Text>
              </View>
            </View>
          </View>

          {/* End / Start Shift Button */}
          <TouchableOpacity
            style={[
              styles.endShiftButton,
              !isOnShift && { backgroundColor: '#16A34A' },
            ]}
            onPress={handleToggleShift}
            activeOpacity={0.85}
            disabled={isShiftActionLoading}
          >
            {isShiftActionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Feather
                name={isOnShift ? 'log-out' : 'log-in'}
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.endShiftButtonText}>
              {isShiftActionLoading
                ? isOnShift
                  ? 'Ending Shift...'
                  : 'Starting Shift...'
                : isOnShift
                ? session?.end_button_title || 'End Shift'
                : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. DYNAMIC MENU ACTION CARDS (Rendered from data.menu_options) ── */}
        <View style={styles.actionCardsList}>
          {(profileData?.menu_options || []).map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => {
                if (item.action === 'navigate_shift_history' || item.key === 'history') {
                  router.push('/(tabs)/transactions');
                } else {
                  router.push('/(tabs)/transactions');
                }
              }}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons
                  name={
                    item.key === 'history'
                      ? 'swap-horizontal'
                      : 'folder-outline'
                  }
                  size={19}
                  color="#B45309"
                />
              </View>
              <View style={styles.actionInfoCol}>
                <Text style={styles.actionTitle}>{item.title}</Text>
                <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 3. LOG OUT BUTTON ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="power" size={16} color="#DC2626" style={{ marginRight: 6 }} />
          <Text style={styles.logoutButtonText}>Log Out Account</Text>
        </TouchableOpacity>

        {/* ── 4. FOOTER: POWERED BY SE PAY ── */}
        <View style={styles.footerWrap}>
          <Text style={styles.poweredByText}>POWERED BY</Text>
          <Image
            source={require('../../../../assets/se_pay_brand_logo.png')}
            style={styles.sePayBrandLogo}
            resizeMode="contain"
          />
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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },

  /* 1. Profile Summary Card */
  profileCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 4,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    width: 68,
    height: 68,
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    backgroundColor: '#F8FAFC',
  },
  crownBadgeWrap: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    padding: 1,
  },
  crownBadgeImg: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
    marginTop: 2,
    marginBottom: 3,
  },
  ownerNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  metaLinesWrap: {
    alignItems: 'center',
    marginBottom: 10,
    gap: 3,
  },
  metaLineText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    textAlign: 'center',
  },
  empIdBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 14,
    marginBottom: 6,
    gap: 6,
  },
  statusPillOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusDotOff: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  statusTextOff: {
    color: '#64748B',
  },
  shiftDurationText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 12,
  },
  activeShiftIdBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  activeShiftIdInfo: {
    flex: 1,
  },
  activeShiftIdLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 2,
  },
  activeShiftIdCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  copyShiftBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeTxnsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  activeTxnsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTxnsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  activeTxnsCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTxnsCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  bigAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  bigAmountDollar: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D97706',
    marginRight: 2,
  },
  bigAmountWhole: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bigAmountCents: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
  },
  txnsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  subMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subMetricCol: {
    flex: 1,
  },
  subMetricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 3,
  },
  subMetricTitleCard: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  bulletTap: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  subMetricTitleTap: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.3,
  },
  subMetricValueCard: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  subMetricValueTap: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  subMetricTxns: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  subMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 8,
  },
  endShiftButton: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endShiftButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* 2. Menu Action Cards */
  actionCardsList: {
    marginBottom: 12,
    gap: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionInfoCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  actionSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
  },

  /* 3. Log Out Button */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 11,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* 4. Footer */
  footerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  poweredByText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sePayBrandLogo: {
    width: 110,
    height: 32,
  },
});

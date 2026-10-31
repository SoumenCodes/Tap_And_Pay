import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';
import {
  profileService,
  ProfileResponseData,
  BankDetailsData,
} from '../../../services/profileService';
import {
  shiftService,
  onShiftChange,
} from '../../../services/shiftService';
import { dashboardService } from '../../../services/dashboardService';
import {
  formatSubmittedDate,
  formatSydneyToUserDateTime,
  formatSydneyToUserTime,
  formatSydneyShiftRange,
} from '../../../utils/dateUtils';
import { useConfirmModal } from '../../../context/ConfirmModalContext';

export default function OtherBusinessProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { showConfirm, showAlert } = useConfirmModal();

  // Profile API State
  const [profileData, setProfileData] = useState<ProfileResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dedicated Bank Details API State
  const [bankData, setBankData] = useState<BankDetailsData | null>(null);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const [isOnShift, setIsOnShift] = useState(false);
  const [isShiftActionLoading, setIsShiftActionLoading] = useState(false);

  // Bank Details Modals
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isUpdateBankModalVisible, setIsUpdateBankModalVisible] = useState(false);

  // Current Bank Account Information
  const [accountName, setAccountName] = useState('');
  const [bsbNumber, setBsbNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Form inputs for update modal
  const [editAccountName, setEditAccountName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBsb, setEditBsb] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');

  const applyProfileData = useCallback((data: ProfileResponseData) => {
    setProfileData(data);

    if (data.user?.bank_details) {
      const bd = data.user.bank_details;
      if (bd.bank_account_name) {
        setAccountName(bd.bank_account_name);
        setEditAccountName(bd.bank_account_name);
      }
      if (bd.bsb) {
        setBsbNumber(bd.bsb);
        setEditBsb(bd.bsb);
      }
      if (bd.bank_name) {
        setEditBankName(bd.bank_name);
      }
      if (bd.masked_account_number) {
        setAccountNumber(bd.masked_account_number);
      } else if (bd.account_number) {
        setAccountNumber(`•••• •••• ${bd.account_number.slice(-4)}`);
      }
    }

    if (data.current_session) {
      setIsOnShift(Boolean(data.current_session.has_active_session));
    }
  }, []);

  // Fetch initial profile
  const fetchProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      applyProfileData(data);
    } catch (err: any) {
      console.log('Failed to fetch other business profile:', err.message || err);
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

  // Synchronize profile state when shift status is changed across the app
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
      console.log('Failed to refresh other business profile:', err.message || err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Bank Details Modal: GET /api/user/bank-details
  const handleOpenBankModal = async () => {
    setIsBankModalVisible(true);
    setIsBankLoading(true);
    try {
      const data = await profileService.getBankDetails();
      setBankData(data);

      if (data) {
        if (data.bank_account_name) {
          setAccountName(data.bank_account_name);
        }
        if (data.bsb) {
          setBsbNumber(data.bsb);
        }
        if (data.masked_account_number) {
          setAccountNumber(data.masked_account_number);
        } else if (data.account_number) {
          setAccountNumber(`•••• •••• ${data.account_number.slice(-4)}`);
        }

        if (data.has_pending_approval && data.draft_bank_details) {
          const draft = data.draft_bank_details;
          setEditAccountName(draft.bank_account_name || '');
          setEditBsb(draft.bsb || '');
          setEditAccountNumber(draft.account_number || '');
          setEditBankName(draft.bank_name || '');
        } else {
          setEditAccountName(data.bank_account_name || accountName);
          setEditBsb(data.bsb || bsbNumber);
          setEditAccountNumber(data.account_number || '');
          setEditBankName(data.bank_name || '');
        }
      }
    } catch (err: any) {
      console.log('Failed to fetch bank details:', err.message || err);
    } finally {
      setIsBankLoading(false);
    }
  };

  const handleSubmitBankUpdate = async () => {
    const trimmedName = editAccountName.trim();
    const trimmedBsb = editBsb.trim();
    const trimmedAcc = editAccountNumber.trim();
    const trimmedBank = editBankName.trim();

    if (!trimmedName || !trimmedBsb || !trimmedAcc) {
      showAlert({
        title: 'Required Fields',
        message: 'Please enter Account Name, BSB, and Account Number.',
        type: 'warning',
      });
      return;
    }

    setIsSubmittingBank(true);
    try {
      const res = await profileService.updateBankDetails({
        account_name: trimmedName,
        bsb: trimmedBsb,
        account_number: trimmedAcc,
        bank_name: trimmedBank || 'National Australia Bank',
      });

      const updated = res.data;
      if (updated) {
        setBankData((prev) => ({
          ...prev,
          has_pending_approval: true,
          approval_status: updated.approval_status || 'pending',
          draft_bank_details: {
            bank_account_name: updated.bank_account_name || trimmedName,
            bsb: updated.bsb || trimmedBsb,
            account_number: updated.account_number || trimmedAcc,
            masked_account_number:
              updated.masked_account_number || `•••• •••• ${trimmedAcc.slice(-4)}`,
            bank_name: trimmedBank || updated.bank_name || 'National Australia Bank',
            bank_badge: updated.bank_badge || 'NAB',
            submitted_ts: new Date().toISOString().slice(0, 19).replace('T', ' '),
          },
        }));
      }

      setIsUpdateBankModalVisible(false);
      showAlert({
        title: 'Request Submitted',
        message: res.message || 'Bank details submitted for approval successfully.',
        type: 'success',
      });
    } catch (err: any) {
      showAlert({
        title: 'Update Failed',
        message: err.message || 'Could not submit bank details for approval. Please try again.',
        type: 'danger',
      });
    } finally {
      setIsSubmittingBank(false);
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

  const businessName = user?.business_name || user?.header_business_name || '--';
  const ownerName =
    user?.display_name ||
    (user?.first_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '') ||
    user?.business_name ||
    '--';
  const abnText = user?.abn || '--';
  const phoneText = user?.phone_no || '--';
  const empIdText = user?.emp_id || user?.employee_code || '--';
  const emailText = user?.email || '--';
  const addressText =
    user?.formatted_address ||
    user?.address?.formatted ||
    user?.address?.address_line1 ||
    '--';
  const avatarUri = user?.logo_url || user?.profile_photo_url;

  // Session values
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

  // Parse big total into dollar, whole, cents
  const cleanTotal = totalAmountStr.replace('$', '').trim();
  const [wholeTotal, centsTotal] = cleanTotal.includes('.')
    ? cleanTotal.split('.')
    : [cleanTotal, '00'];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="Profile" />

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
                    : require('../../../../assets/emp_avatar_1.png')
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

          {/* Business & Owner Details */}
          <Text style={styles.brandTitle}>{businessName.toUpperCase()}</Text>
          <Text style={styles.ownerNameText}>{ownerName}</Text>

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
                : 'Active • Off Shift'}
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
              !isOnShift && styles.startShiftButton,
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
                if (item.action === 'navigate_bank_details' || item.key === 'bank_details') {
                  handleOpenBankModal();
                } else if (item.action === 'navigate_manage_employees' || item.key === 'manage_staff') {
                  router.push('/manage-employee');
                } else if (item.action === 'navigate_shift_history' || item.key === 'history') {
                  router.push('/(tabs)/history');
                } else {
                  router.push('/(tabs)/transactions');
                }
              }}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons
                  name={
                    item.key === 'bank_details'
                      ? 'business-outline'
                      : item.key === 'manage_staff'
                      ? 'people-outline'
                      : 'swap-horizontal'
                  }
                  size={18}
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

      {/* ── 1. BANK DETAILS BOTTOM SHEET ── */}
      <Modal
        visible={isBankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBankModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsBankModalVisible(false)}
        >
          <Pressable style={styles.bankModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalDragHandle} />

            {/* Header: Bank Badge + Title + Verified Pill + Close Button */}
            <View style={styles.bankHeaderRow}>
              <View style={styles.bankIconBadge}>
                <Ionicons name="business-outline" size={22} color="#B45309" />
              </View>

              <View style={styles.bankTitleCol}>
                <View style={styles.bankTitleVerifiedRow}>
                  <Text style={styles.bankSheetTitle}>Bank Details</Text>
                  <View
                    style={[
                      styles.verifiedPill,
                      !bankData?.is_verified && {
                        backgroundColor: '#FEF3C7',
                        borderColor: '#FDE68A',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verifiedPillText,
                        !bankData?.is_verified && { color: '#B45309' },
                      ]}
                    >
                      {bankData?.is_verified ? 'Verified' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bankSheetSubtitle}>Register account for payouts</Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtnCircle}
                onPress={() => setIsBankModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Loading Indicator for Bank Data */}
            {isBankLoading && (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#D97706" />
              </View>
            )}

            {/* Pending Draft Details Card (shown when an update request is pending approval) */}
            {bankData?.has_pending_approval && Boolean(bankData?.draft_bank_details) && (
              <View style={styles.pendingReviewCard}>
                <View style={styles.pendingReviewHeader}>
                  <View style={styles.pendingReviewIconWrap}>
                    <Ionicons name="time" size={14} color="#B45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingReviewTitle}>Pending Update Under Review</Text>
                    {Boolean(bankData.draft_bank_details?.submitted_ts) && (
                      <Text style={styles.pendingReviewSub}>
                        Submitted {formatSubmittedDate(bankData.draft_bank_details?.submitted_ts)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.draftDetailsDivider} />

                <View style={styles.draftDetailRow}>
                  <Text style={styles.draftDetailLabel}>New Account Name</Text>
                  <Text style={styles.draftDetailValue}>
                    {bankData.draft_bank_details?.bank_account_name || '--'}
                  </Text>
                </View>

                {Boolean(bankData.draft_bank_details?.bank_name) && (
                  <View style={styles.draftDetailRow}>
                    <Text style={styles.draftDetailLabel}>New Bank Name</Text>
                    <Text style={styles.draftDetailValue}>
                      {bankData.draft_bank_details?.bank_name}
                    </Text>
                  </View>
                )}

                <View style={styles.draftDetailRow}>
                  <Text style={styles.draftDetailLabel}>New BSB</Text>
                  <Text style={styles.draftDetailValue}>
                    {bankData.draft_bank_details?.bsb || '--'}
                  </Text>
                </View>

                <View style={styles.draftDetailRow}>
                  <Text style={styles.draftDetailLabel}>New Account Number</Text>
                  <Text style={styles.draftDetailValue}>
                    {bankData.draft_bank_details?.masked_account_number ||
                      (bankData.draft_bank_details?.account_number
                        ? `•••• •••• ${bankData.draft_bank_details.account_number.slice(-4)}`
                        : '--')}
                  </Text>
                </View>
              </View>
            )}

            {/* Bank Account Information Card */}
            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoHeading}>BANK ACCOUNT INFORMATION</Text>
              <View style={styles.bankInfoDivider} />

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Name</Text>
                <Text style={styles.bankInfoValue}>{accountName || '--'}</Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>BSB Number</Text>
                <View style={styles.bsbRow}>
                  <Text style={styles.bankInfoValue}>{bsbNumber || '--'}</Text>
                  <View style={styles.nabBadge}>
                    <Text style={styles.nabBadgeText}>
                      {bankData?.bank_badge || 'NAB'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Number</Text>
                <Text style={styles.bankInfoValue}>{accountNumber || '--'}</Text>
              </View>
            </View>

            {/* Update Bank Account Action */}
            <TouchableOpacity
              style={styles.updateBankRow}
              activeOpacity={0.8}
              onPress={() => {
                if (bankData?.has_pending_approval && bankData?.draft_bank_details) {
                  const draft = bankData.draft_bank_details;
                  setEditAccountName(draft.bank_account_name || '');
                  setEditBsb(draft.bsb || '');
                  setEditAccountNumber(draft.account_number || '');
                  setEditBankName(draft.bank_name || '');
                } else {
                  setEditAccountName(bankData?.bank_account_name || accountName);
                  setEditBsb(bankData?.bsb || bsbNumber);
                  setEditAccountNumber(bankData?.account_number || '');
                  setEditBankName(bankData?.bank_name || '');
                }
                setIsBankModalVisible(false);
                setIsUpdateBankModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.updateBankText}>
                {bankData?.has_pending_approval ? 'Edit Pending Bank Update' : 'Update Bank Account'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 2. REQUEST BANK DETAILS UPDATE SHEET ── */}
      <Modal
        visible={isUpdateBankModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsUpdateBankModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsUpdateBankModalVisible(false)}
        >
          <Pressable style={styles.updateModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalDragHandle} />

            {/* Warning Icon Badge */}
            <View style={styles.warningIconCircle}>
              <Ionicons name="warning-outline" size={26} color="#D97706" />
            </View>

            <Text style={styles.updateModalTitle}>
              {bankData?.has_pending_approval
                ? 'Edit Pending Update Request'
                : 'Request Bank Details Update?'}
            </Text>
            <Text style={styles.updateModalDesc}>
              {bankData?.has_pending_approval
                ? `You have a pending update request submitted${
                    bankData.draft_bank_details?.submitted_ts
                      ? ` on ${formatSubmittedDate(bankData.draft_bank_details.submitted_ts)}`
                      : ''
                  }. You can make adjustments to the draft details below and re-submit for approval.`
                : 'To protect your business payouts, changing bank account details requires security verification. Once submitted, current daily payouts will pause until the new account is verified.'}
            </Text>

            {/* New Account Details Box */}
            <View style={styles.newAccountCard}>
              <Text style={styles.newAccountHeading}>NEW ACCOUNT DETAILS</Text>
              <View style={styles.newAccountDivider} />

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetInputLabel}>ACCOUNT NAME</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={editAccountName}
                  onChangeText={setEditAccountName}
                  placeholder="e.g. Habibs"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetInputLabel}>BANK NAME</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={editBankName}
                  onChangeText={setEditBankName}
                  placeholder="e.g. National Australia Bank"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.splitSheetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetInputLabel}>BSB</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={editBsb}
                    onChangeText={setEditBsb}
                    placeholder="e.g. 082-056"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetInputLabel}>ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={editAccountNumber}
                    onChangeText={setEditAccountNumber}
                    placeholder="e.g. 123456789"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.submitUpdateBtn, isSubmittingBank && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={handleSubmitBankUpdate}
              disabled={isSubmittingBank}
            >
              {isSubmittingBank ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitUpdateBtnText}>
                  {bankData?.has_pending_approval ? 'Re-Submit for Approval' : 'Submit Request'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelUpdateBtn}
              activeOpacity={0.7}
              onPress={() => setIsUpdateBankModalVisible(false)}
              disabled={isSubmittingBank}
            >
              <Text style={styles.cancelUpdateBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  crownBadgeWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  crownBadgeImg: {
    width: 16,
    height: 16,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 6,
  },
  ownerNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 2,
  },
  metaLinesWrap: {
    marginTop: 4,
    alignItems: 'center',
    gap: 1.5,
  },
  metaLineText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  empIdBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 9,
    gap: 4,
  },
  statusPillOff: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  statusDotOff: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statusTextOff: {
    color: '#64748B',
  },
  shiftDurationText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 13,
  },

  /* Active Shift ID Box */
  activeShiftIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 10,
  },
  activeShiftIdInfo: {
    flex: 1,
  },
  activeShiftIdLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  activeShiftIdCode: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  copyShiftBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Active Shift Txns Card */
  activeTxnsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  activeTxnsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeTxnsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 4,
  },
  bigAmountWhole: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bigAmountCents: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  txnsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 9,
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
    gap: 4,
    marginBottom: 2,
  },
  subMetricTitleCard: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.2,
  },
  bulletTap: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#EA580C',
  },
  subMetricTitleTap: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EA580C',
    letterSpacing: 0.2,
  },
  subMetricValueCard: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
  },
  subMetricValueTap: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EA580C',
  },
  subMetricTxns: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  subMetricDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  /* End Shift Button */
  endShiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  startShiftButton: {
    backgroundColor: '#16A34A',
  },
  endShiftButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* 2. Action Cards List */
  actionCardsList: {
    gap: 9,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfoCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* 3. Logout Button */
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

  /* ── 1. Bank Details Sheet Styles ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  bankModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  bankIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankTitleCol: {
    flex: 1,
  },
  bankTitleVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bankSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  bankSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Pending Review Card */
  pendingReviewCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
  },
  pendingReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingReviewIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingReviewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  pendingReviewSub: {
    fontSize: 10.5,
    color: '#D97706',
    marginTop: 1,
    fontWeight: '600',
  },
  draftDetailsDivider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginVertical: 8,
  },
  draftDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  draftDetailLabel: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
  },
  draftDetailValue: {
    fontSize: 11.5,
    color: '#451A03',
    fontWeight: '700',
  },

  bankInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  bankInfoHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  bankInfoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bankInfoLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  bankInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  bsbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nabBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  nabBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  updateBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 12,
  },
  updateBankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },

  /* ── 2. Request Bank Details Update Sheet Styles ── */
  updateModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  warningIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  updateModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  updateModalDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  newAccountCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  newAccountHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  newAccountDivider: {
    height: 1,
    backgroundColor: '#FEF08A',
    marginVertical: 10,
  },
  sheetInputGroup: {
    marginBottom: 10,
  },
  sheetInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  sheetInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  splitSheetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitUpdateBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitUpdateBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelUpdateBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelUpdateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});

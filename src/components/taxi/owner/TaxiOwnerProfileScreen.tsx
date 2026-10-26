import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
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

export default function TaxiOwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Profile API State
  const [profileData, setProfileData] = useState<ProfileResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dedicated Bank Details API State
  const [bankData, setBankData] = useState<BankDetailsData | null>(null);
  const [isBankLoading, setIsBankLoading] = useState(false);

  const [isOnShift, setIsOnShift] = useState(false);

  // Bank Modals State
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isUpdateBankModalVisible, setIsUpdateBankModalVisible] = useState(false);

  // Current Bank Account Information
  const [accountName, setAccountName] = useState('');
  const [bsbNumber, setBsbNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // New Account Inputs for Update Modal
  const [editAccountName, setEditAccountName] = useState('');
  const [editBsb, setEditBsb] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');

  // Helper to apply profile data to local state
  const applyProfileData = (data: ProfileResponseData) => {
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
      if (bd.masked_account_number) {
        setAccountNumber(bd.masked_account_number);
      } else if (bd.account_number) {
        setAccountNumber(`••••  ••••  ${bd.account_number.slice(-4)}`);
      }
    }

    if (data.current_session) {
      setIsOnShift(Boolean(data.current_session.has_active_session));
    }
  };

  // Initial load via GET /api/user/profile
  useEffect(() => {
    let isMounted = true;

    profileService
      .getProfile()
      .then((data) => {
        if (!isMounted) return;
        applyProfileData(data);
      })
      .catch((err) => {
        console.log('Failed to fetch taxi owner profile:', err.message || err);
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

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await profileService.getProfile();
      applyProfileData(data);
    } catch (err: any) {
      console.log('Failed to refresh taxi owner profile:', err.message || err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dedicated Bank Details Fetcher: GET /api/user/bank-details
  const handleOpenBankModal = async () => {
    setIsBankModalVisible(true);
    setIsBankLoading(true);
    try {
      const data = await profileService.getBankDetails();
      setBankData(data);

      if (data) {
        if (data.bank_account_name) {
          setAccountName(data.bank_account_name);
          setEditAccountName(data.bank_account_name);
        }
        if (data.bsb) {
          setBsbNumber(data.bsb);
          setEditBsb(data.bsb);
        }
        if (data.masked_account_number) {
          setAccountNumber(data.masked_account_number);
        } else if (data.account_number) {
          setAccountNumber(`••••  ••••  ${data.account_number.slice(-4)}`);
        }
      }
    } catch (err: any) {
      console.log('Failed to fetch bank details from API:', err.message || err);
    } finally {
      setIsBankLoading(false);
    }
  };

  const u = profileData?.user;
  const session = profileData?.current_session;

  const userName =
    u?.display_name ||
    `${u?.first_name || ''} ${u?.last_name || ''}`.trim() ||
    user.name ||
    '';
  const taxiNumber = u?.taxi_no || user.taxiNumber || '';
  const dcNumber = u?.dc_number || '';
  const abn = u?.abn || '';
  const phone = u?.phone_no || '';
  const email = u?.email || '';
  const activeShiftId =
    session?.display_shift_id ||
    session?.shift_id ||
    '--';

  const shiftStatusText =
    session?.status_badge || (isOnShift ? 'Active • On Shift' : 'Active • Off Shift');
  const shiftStartTimeText = session?.started_at_formatted
    ? `Started ${session.started_at_formatted}${session.duration ? ` (${session.duration})` : ''}`
    : 'No active shift session';

  // Revenue values
  const rev = session?.revenue;
  const totalAmount = rev?.total_amount ?? 0;
  const integerPart = Math.floor(totalAmount).toLocaleString();
  const decimalPart = (totalAmount % 1).toFixed(2).split('.')[1] || '00';
  const transactionLabel = rev?.transaction_label || '0 Trips';

  const cardAmountVal =
    rev?.card?.amount != null ? Math.floor(rev.card.amount).toString() : '0';
  const cardAmountDec =
    rev?.card?.amount != null
      ? `.${(rev.card.amount % 1).toFixed(2).split('.')[1] || '00'}`
      : '.00';
  const cardCountText = rev?.card?.count_formatted || '0 Txns';

  const tapAmountVal =
    rev?.tap_and_go?.amount != null
      ? Math.floor(rev.tap_and_go.amount).toString()
      : '0';
  const tapAmountDec =
    rev?.tap_and_go?.amount != null
      ? `.${(rev.tap_and_go.amount % 1).toFixed(2).split('.')[1] || '00'}`
      : '.00';
  const tapCountText = rev?.tap_and_go?.count_formatted || '0 Txns';

  const handleCopyShiftId = () => {
    Alert.alert('Active Shift ID', `${activeShiftId}\nCopied to clipboard.`);
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      Alert.alert(
        'End Shift',
        `Are you sure you want to end your current active shift (${activeShiftId})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Shift',
            style: 'destructive',
            onPress: () => {
              setIsOnShift(false);
              Alert.alert('Shift Ended', 'Shift tally submitted to records.');
            },
          },
        ]
      );
    } else {
      setIsOnShift(true);
      Alert.alert('Shift Started', `Logged into taxi ${taxiNumber}. Active on shift.`);
    }
  };

  const handleConfirmBankUpdate = () => {
    setIsUpdateBankModalVisible(false);
    Alert.alert(
      'Bank Update Requested',
      'Your request to update bank account details has been submitted for fleet administrator approval. Daily payouts will pause until verified.',
      [
        {
          text: 'OK',
          onPress: () => {
            setAccountName(editAccountName);
            setBsbNumber(editBsb);
            setAccountNumber(`••••  ••••  ${editAccountNumber.slice(-4)}`);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out Account',
      'Are you sure you want to log out from SE PAY?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar: Centered Title, No Back Button */}
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
        {/* Loading Indicator for Initial Fetch */}
        {isLoading && !profileData && (
          <View style={{ paddingVertical: 12, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#D97706" />
          </View>
        )}

        {/* ── MAIN GOLDEN-BORDERED PROFILE CARD ── */}
        <View style={styles.profileCard}>
          {/* Driver Avatar with Gold Border (No Emblem Badge) */}
          <View style={styles.avatarContainer}>
            <Image
              source={
                u?.profile_photo_url || u?.logo_url
                  ? { uri: u.profile_photo_url || u.logo_url }
                  : require('../../../../assets/emp_avatar_2.png')
              }
              style={styles.avatarImage}
            />
          </View>

          {/* Owner/Driver Name */}
          <Text style={styles.driverNameText}>{userName || '--'}</Text>

          {/* Business Name from API */}
          {Boolean(u?.business_name) && (
            <Text style={styles.bizNameText}>{u?.business_name}</Text>
          )}

          {/* ABN & Contact Meta */}
          <Text style={styles.metaLine}>
            ABN: {abn || '--'} • PH: {phone || '--'}
          </Text>
          <Text style={styles.metaLine}>
            TAXI NO.: <Text style={styles.metaBold}>{taxiNumber || '--'}</Text>
            {Boolean(dcNumber) && <>   DC: <Text style={styles.metaBold}>{dcNumber}</Text></>}
            {Boolean(u?.dl_number) && <>   DL: <Text style={styles.metaBold}>{u?.dl_number}</Text></>}
          </Text>
          {Boolean(email) && <Text style={styles.emailLine}>{email}</Text>}
          {Boolean(u?.address?.formatted) && (
            <Text style={styles.addressLine} numberOfLines={1}>
              {u?.address?.formatted}
            </Text>
          )}

          {/* Shift Status Badge */}
          {isOnShift ? (
            <View style={styles.statusPillActive}>
              <View style={styles.statusDotActive} />
              <Text style={styles.statusTextActive}>{shiftStatusText}</Text>
            </View>
          ) : (
            <View style={styles.statusPillInactive}>
              <View style={styles.statusDotInactive} />
              <Text style={styles.statusTextInactive}>{shiftStatusText}</Text>
            </View>
          )}

          <Text style={styles.shiftStartTimeText}>{shiftStartTimeText}</Text>

          {/* ── Active Shift ID Box ── */}
          <View style={styles.shiftIdBox}>
            <View style={styles.shiftIdTextCol}>
              <Text style={styles.shiftIdLabel}>Active Shift ID</Text>
              <Text style={styles.shiftIdValue}>{activeShiftId}</Text>
            </View>

            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopyShiftId}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color="#D97706" />
            </TouchableOpacity>
          </View>

          {/* ── Active Shift Txns Box ── */}
          <View style={styles.shiftTxnsBox}>
            <View style={styles.txnsHeaderRow}>
              <Text style={styles.txnsLabel}>
                {session?.revenue_title || 'Active Shift Txns'}
              </Text>
              <View style={styles.tripsBadge}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.tripsBadgeText}>{transactionLabel}</Text>
              </View>
            </View>

            {/* Total Fare Row */}
            <View style={styles.fareAmountRow}>
              <Text style={styles.fareDollar}>$ </Text>
              <Text style={styles.fareInteger}>{integerPart}</Text>
              <Text style={styles.fareDec}>.{decimalPart}</Text>
            </View>

            <View style={styles.cardInnerDivider} />

            {/* Breakdown (Card vs Tap & Go) */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <Ionicons name="card-outline" size={11} color="#2563EB" />
                  <Text style={styles.cardMethodTitle}>CARD</Text>
                </View>
                <View style={styles.breakdownAmountRow}>
                  <Text style={styles.breakdownDollarBlue}>$</Text>
                  <Text style={styles.breakdownAmountVal}>{cardAmountVal}</Text>
                  <Text style={styles.breakdownDec}>{cardAmountDec}</Text>
                </View>
                <Text style={styles.breakdownSub}>{cardCountText}</Text>
              </View>

              <View style={styles.verticalColDivider} />

              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <View style={styles.tapDot} />
                  <Text style={styles.tapMethodTitle}>TAP & GO</Text>
                </View>
                <View style={styles.breakdownAmountRow}>
                  <Text style={styles.breakdownDollarAmber}>$</Text>
                  <Text style={styles.breakdownAmountVal}>{tapAmountVal}</Text>
                  <Text style={styles.breakdownDec}>{tapAmountDec}</Text>
                </View>
                <Text style={styles.breakdownSub}>{tapCountText}</Text>
              </View>
            </View>
          </View>

          {/* ── End/Start Shift Button (Black) ── */}
          <TouchableOpacity
            style={[
              styles.endShiftBtn,
              !isOnShift && styles.startShiftBtn,
            ]}
            onPress={handleToggleShift}
            activeOpacity={0.85}
          >
            <Feather
              name={isOnShift ? 'log-out' : 'log-in'}
              size={17}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.endShiftBtnText}>
              {session?.end_button_title || (isOnShift ? 'End Shift' : 'Start Shift')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── DYNAMIC MENU OPTIONS (from API data.menu_options) ── */}
        {(profileData?.menu_options || []).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => {
              if (item.action === 'navigate_bank_details' || item.key === 'bank_details') {
                handleOpenBankModal();
              } else {
                router.push('/(tabs)/transactions');
              }
            }}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons
                name={item.key === 'bank_details' ? 'business-outline' : 'swap-horizontal'}
                size={20}
                color="#D97706"
              />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSub}>{item.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ))}

        {/* ── LOG OUT ACCOUNT BUTTON ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="power" size={17} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>

        {/* ── FOOTER: POWERED BY SE PAY ── */}
        <View style={styles.footerWrap}>
          <Text style={styles.poweredByLabel}>POWERED BY</Text>
          <Image
            source={require('../../../../assets/se_pay_brand_logo.png')}
            style={styles.sePayFooterLogo}
            resizeMode="contain"
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── 1. BANK DETAILS BOTTOM SHEET (Exact Match with Taxi Business Owner) ── */}
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

            {/* Header: Bank Badge + Verified + Close Button */}
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
                      !(bankData?.is_verified ?? u?.is_verified ?? true) && {
                        backgroundColor: '#F1F5F9',
                        borderColor: '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verifiedPillText,
                        !(bankData?.is_verified ?? u?.is_verified ?? true) && {
                          color: '#64748B',
                        },
                      ]}
                    >
                      {(bankData?.is_verified ?? u?.is_verified ?? true)
                        ? 'Verified'
                        : 'Pending'}
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

            {/* Loading Indicator for Bank Details */}
            {isBankLoading && !bankData && (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#D97706" />
              </View>
            )}

            {/* Bank Account Information Card */}
            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoHeading}>BANK ACCOUNT INFORMATION</Text>
              <View style={styles.bankInfoDivider} />

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Name</Text>
                <Text style={styles.bankInfoValue}>
                  {bankData?.bank_account_name || accountName || '--'}
                </Text>
              </View>

              {Boolean(bankData?.bank_name || u?.bank_details?.bank_name) && (
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoLabel}>Bank Name</Text>
                  <Text style={styles.bankInfoValue}>
                    {bankData?.bank_name || u?.bank_details?.bank_name}
                  </Text>
                </View>
              )}

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>BSB Number</Text>
                <View style={styles.bsbRow}>
                  <Text style={styles.bankInfoValue}>
                    {bankData?.bsb || bsbNumber || '--'}
                  </Text>
                  {Boolean(
                    bankData?.bank_badge ||
                      (bankData?.bank_name || u?.bank_details?.bank_name)
                  ) && (
                    <View style={styles.nabBadge}>
                      <Text style={styles.nabBadgeText}>
                        {bankData?.bank_badge ||
                          ((bankData?.bank_name || u?.bank_details?.bank_name)?.includes(
                            'National Australia Bank'
                          ) ||
                          (bankData?.bank_name || u?.bank_details?.bank_name)?.includes('NAB')
                            ? 'NAB'
                            : (bankData?.bank_name || u?.bank_details?.bank_name)
                                ?.slice(0, 4)
                                ?.toUpperCase())}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Number</Text>
                <Text style={styles.bankInfoValue}>
                  {bankData?.masked_account_number ||
                    (bankData?.account_number
                      ? `••••  ••••  ${bankData.account_number.slice(-4)}`
                      : null) ||
                    accountNumber ||
                    '--'}
                </Text>
              </View>

              {Boolean(
                bankData?.payout_payment_method || u?.bank_details?.payout_payment_method
              )}
              {(bankData?.payout_payment_method || u?.bank_details?.payout_payment_method) && (
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoLabel}>Payout Method</Text>
                  <Text style={[styles.bankInfoValue, { textTransform: 'capitalize' }]}>
                    {bankData?.payout_payment_method ||
                      u?.bank_details?.payout_payment_method}
                  </Text>
                </View>
              )}
            </View>

            {/* Update Bank Account Action */}
            <TouchableOpacity
              style={styles.updateBankRow}
              activeOpacity={0.8}
              onPress={() => {
                setIsBankModalVisible(false);
                setIsUpdateBankModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
              <Text style={styles.updateBankText}>Update Bank Account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 2. REQUEST BANK DETAILS UPDATE SHEET (Exact Match with Taxi Business Owner) ── */}
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

            <Text style={styles.updateModalTitle}>Request Bank Details Update?</Text>
            <Text style={styles.updateModalDesc}>
              To protect your payouts, changing bank account details requires approval from your fleet administrator. Once submitted, current daily payouts will pause until the new account is verified.
            </Text>

            {/* New Account Details Box with gold border */}
            <View style={styles.newAccountCard}>
              <Text style={styles.newAccountHeading}>NEW ACCOUNT DETAILS</Text>
              <View style={styles.newAccountDivider} />

              <View style={styles.sheetInputGroup}>
                <Text style={styles.sheetInputLabel}>ACCOUNT NAME</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={editAccountName}
                  onChangeText={setEditAccountName}
                  placeholder="Account Name"
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
                    placeholder="000-000"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetInputLabel}>ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={editAccountNumber}
                    onChangeText={setEditAccountNumber}
                    placeholder="Account Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons: Black with gold text, and Cancel */}
            <TouchableOpacity
              style={styles.confirmSubmitBtn}
              onPress={handleConfirmBankUpdate}
              activeOpacity={0.88}
            >
              <Text style={styles.confirmSubmitBtnText}>Confirm & Submit</Text>
              <Ionicons name="arrow-forward" size={17} color="#FBBF24" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.updateCancelBtn}
              onPress={() => setIsUpdateBankModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.updateCancelBtnText}>Cancel</Text>
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },

  /* Main Profile Card */
  profileCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 2,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 13,
    backgroundColor: '#0F172A',
  },
  driverNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bizNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 6,
  },
  metaLine: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 3,
  },
  metaBold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  emailLine: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 3,
  },
  addressLine: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  /* Shift Status Pills */
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 6,
    gap: 6,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  statusPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 6,
    gap: 6,
  },
  statusDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  statusTextInactive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  shiftStartTimeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 12,
  },

  /* Active Shift ID Box */
  shiftIdBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shiftIdTextCol: {
    flex: 1,
  },
  shiftIdLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  shiftIdValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Active Shift Txns Box */
  shiftTxnsBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  txnsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  txnsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tripsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  fareAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  fareDollar: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
  },
  fareInteger: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  fareDec: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  cardInnerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cardMethodTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.3,
  },
  tapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  tapMethodTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
    letterSpacing: 0.3,
  },
  breakdownAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  breakdownDollarBlue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  breakdownDollarAmber: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#EA580C',
  },
  breakdownAmountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownDec: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  breakdownSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  verticalColDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  /* End / Start Shift Button */
  endShiftBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  startShiftBtn: {
    backgroundColor: '#16A34A',
  },
  endShiftBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Action Cards (Past Shift Records & Bank Details) */
  actionCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  /* Log Out Button */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Footer */
  footerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  poweredByLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sePayFooterLogo: {
    width: 80,
    height: 24,
  },

  /* Modal Backdrop & Drag Handle */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDragHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },

  /* ── 1. Bank Details Sheet Styles ── */
  bankModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
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
  },
  bankSheetTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  bankSheetSubtitle: {
    fontSize: 11,
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
  bankInfoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bankInfoHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  bankInfoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  bankInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  bankInfoLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  bankInfoValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bsbRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nabBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  nabBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  updateBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 6,
  },
  updateBankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },

  /* ── 2. Request Bank Details Update Sheet Styles ── */
  updateModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  warningIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
  },
  updateModalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 12,
  },
  updateModalDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  newAccountCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#FDE047',
    borderRadius: 16,
    padding: 14,
    marginVertical: 14,
  },
  newAccountHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.6,
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
    height: 44,
    paddingHorizontal: 12,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  splitSheetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FBBF24',
  },
  updateCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  updateCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';

export default function OtherBusinessProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isOnShift, setIsOnShift] = useState(true);

  // Bank Details Bottom Sheet Modals
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isUpdateBankModalVisible, setIsUpdateBankModalVisible] = useState(false);

  // Bank Account State (pre-populated with realistic Australian merchant details)
  const [accountName, setAccountName] = useState('Crown Cuts Pty Ltd');
  const [bsbNumber, setBsbNumber] = useState('063-000');
  const [accountNumber, setAccountNumber] = useState('1098 7654');

  // Form inputs for update modal
  const [editAccountName, setEditAccountName] = useState('Crown Cuts Pty Ltd');
  const [editBsb, setEditBsb] = useState('063-000');
  const [editAccountNumber, setEditAccountNumber] = useState('1098 7654');

  const businessName = user.businessName || 'CROWN CUTS';
  const userName = user.name || 'Soumen Sen';
  const shiftId = '26102026/93821048/537384';

  const handleCopyShiftId = () => {
    Alert.alert('Shift ID Copied', `Active Shift ID: ${shiftId}`);
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      Alert.alert(
        'End Shift',
        `Are you sure you want to end your current active shift (${shiftId})? Total sales ($485.00) will be submitted for settlement.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Shift',
            style: 'destructive',
            onPress: () => {
              setIsOnShift(false);
              Alert.alert('Shift Ended', 'Active shift ended. Summary submitted to records.');
            },
          },
        ]
      );
    } else {
      setIsOnShift(true);
      Alert.alert('Shift Started', 'You are now on shift and ready to accept sales.');
    }
  };

  const handlePastShiftRecords = () => {
    router.push('/(tabs)/transactions');
  };

  const handleManageEmployee = () => {
    router.push('/manage-employee');
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

  const handleSubmitBankUpdate = () => {
    if (!editAccountName.trim() || !editBsb.trim() || !editAccountNumber.trim()) {
      Alert.alert('Required Fields', 'Please fill in all bank details.');
      return;
    }

    setAccountName(editAccountName.trim());
    setBsbNumber(editBsb.trim());
    setAccountNumber(editAccountNumber.trim());

    setIsUpdateBankModalVisible(false);
    Alert.alert(
      'Update Request Submitted',
      'Your request to update bank account details has been submitted for verification. Daily payouts will resume once verified.'
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. MAIN PROFILE SUMMARY CARD (Matching Screenshot 1) ── */}
        <View style={styles.profileCard}>
          {/* Avatar with Crown Badge */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../../../assets/emp_avatar_1.png')}
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
          <Text style={styles.ownerNameText}>{userName}</Text>

          <View style={styles.metaLinesWrap}>
            <Text style={styles.metaLineText}>
              ABN: 62 458 123 800 • PH: 0400 555 320
            </Text>
            <Text style={styles.metaLineText}>
              EMP ID: <Text style={styles.empIdBold}>93821048</Text>
            </Text>
            <Text style={styles.metaLineText}>soumen_crowncuts@testmail.com.au</Text>
            <Text style={styles.metaLineText}>
              Suite 4, 120 Collins Street, Melbourne VIC
            </Text>
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
              {isOnShift ? 'Active • On Shift' : 'Off Shift • Inactive'}
            </Text>
          </View>

          {/* Shift Start Duration Text */}
          <Text style={styles.shiftDurationText}>
            Started 26 Oct 2026 | 07:30 AM (8h 45m)
          </Text>

          {/* Active Shift ID Box */}
          <View style={styles.activeShiftIdBox}>
            <View style={styles.activeShiftIdInfo}>
              <Text style={styles.activeShiftIdLabel}>Active Shift ID</Text>
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
              <Text style={styles.activeTxnsLabel}>Active Shift Txns</Text>
              <View style={styles.activeTxnsCountWrap}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.activeTxnsCountText}>14 Txns</Text>
              </View>
            </View>

            {/* Big Amount */}
            <View style={styles.bigAmountRow}>
              <Text style={styles.bigAmountDollar}>$</Text>
              <Text style={styles.bigAmountWhole}>485</Text>
              <Text style={styles.bigAmountCents}>.00</Text>
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
                <Text style={styles.subMetricValueCard}>$320.00</Text>
                <Text style={styles.subMetricTxns}>9 Txns</Text>
              </View>

              <View style={styles.subMetricDivider} />

              {/* Tap & Go */}
              <View style={styles.subMetricCol}>
                <View style={styles.subMetricLabelRow}>
                  <View style={styles.bulletTap} />
                  <Text style={styles.subMetricTitleTap}>TAP & GO</Text>
                </View>
                <Text style={styles.subMetricValueTap}>$165.00</Text>
                <Text style={styles.subMetricTxns}>5 Txns</Text>
              </View>
            </View>
          </View>

          {/* End Shift Button */}
          <TouchableOpacity
            style={[
              styles.endShiftButton,
              !isOnShift && styles.startShiftButton,
            ]}
            onPress={handleToggleShift}
            activeOpacity={0.85}
          >
            <Feather
              name={isOnShift ? 'log-out' : 'log-in'}
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.endShiftButtonText}>
              {isOnShift ? 'End Shift' : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 2. MENU ACTION CARDS (Past Shift Records, Manage Employee, Bank Details) ── */}
        <View style={styles.actionCardsList}>
          {/* 1. Past Shift Records */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handlePastShiftRecords}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="swap-horizontal" size={19} color="#B45309" />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Past Shift Records</Text>
              <Text style={styles.actionSubtitle}>View your previous shift history</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. Manage Employee */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleManageEmployee}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Feather name="user" size={17} color="#B45309" />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Manage Employee</Text>
              <Text style={styles.actionSubtitle}>Add and manage your team</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. Bank Details (Wiring the bank details section) */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setIsBankModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="business-outline" size={18} color="#B45309" />
            </View>
            <View style={styles.actionInfoCol}>
              <Text style={styles.actionTitle}>Bank Details</Text>
              <Text style={styles.actionSubtitle}>Manage your bank account details</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
          </TouchableOpacity>
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
                  <View style={styles.verifiedPill}>
                    <Text style={styles.verifiedPillText}>Verified</Text>
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

            {/* Bank Account Information Card */}
            <View style={styles.bankInfoBox}>
              <Text style={styles.bankInfoHeading}>BANK ACCOUNT INFORMATION</Text>
              <View style={styles.bankInfoDivider} />

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Name</Text>
                <Text style={styles.bankInfoValue}>{accountName}</Text>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>BSB Number</Text>
                <View style={styles.bsbRow}>
                  <Text style={styles.bankInfoValue}>{bsbNumber}</Text>
                  <View style={styles.nabBadge}>
                    <Text style={styles.nabBadgeText}>NAB</Text>
                  </View>
                </View>
              </View>

              <View style={styles.bankInfoRow}>
                <Text style={styles.bankInfoLabel}>Account Number</Text>
                <Text style={styles.bankInfoValue}>{accountNumber}</Text>
              </View>
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

            <Text style={styles.updateModalTitle}>Request Bank Details Update?</Text>
            <Text style={styles.updateModalDesc}>
              To protect your business payouts, changing bank account details requires security verification. Once submitted, current daily payouts will pause until the new account is verified.
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
                  placeholder="Crown Cuts Pty Ltd"
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
                    placeholder="063-000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetInputLabel}>ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.sheetInput}
                    value={editAccountNumber}
                    onChangeText={setEditAccountNumber}
                    placeholder="1098 7654"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.submitUpdateBtn}
              activeOpacity={0.85}
              onPress={handleSubmitBankUpdate}
            >
              <Text style={styles.submitUpdateBtnText}>Submit Request</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelUpdateBtn}
              activeOpacity={0.7}
              onPress={() => setIsUpdateBankModalVisible(false)}
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

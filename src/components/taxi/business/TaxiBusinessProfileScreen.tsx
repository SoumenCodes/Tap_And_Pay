import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';

export default function TaxiBusinessProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const businessName = user.businessName || 'Elite Taxi Service';
  const userName = user.name || 'Lovedeep Khangura';
  const taxiNumber = user.taxiNumber || 'M6061';
  const dcNumber = '58745896';
  const abn = '62 458 123 800';
  const phone = '0400 555 320';
  const email = 'lovedeep_khangura@testmail.com.au';
  const activeShiftId = '26102026/M6061/537384';

  const [isOnShift, setIsOnShift] = useState(true);

  // Bank Modals State
  const [isBankModalVisible, setIsBankModalVisible] = useState(false);
  const [isUpdateBankModalVisible, setIsUpdateBankModalVisible] = useState(false);

  // Current Bank Account Information
  const [accountName, setAccountName] = useState('Lovedeep Khangura');
  const [bsbNumber, setBsbNumber] = useState('083 - 004');
  const [accountNumber, setAccountNumber] = useState('••••  ••••  4821');

  // New Account Inputs for Update Modal
  const [editAccountName, setEditAccountName] = useState('Lovedeep Singh Khangura');
  const [editBsb, setEditBsb] = useState('063-123');
  const [editAccountNumber, setEditAccountNumber] = useState('1098 7654');

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
              Alert.alert('Shift Ended', 'Shift tally submitted to fleet dispatch.');
            },
          },
        ]
      );
    } else {
      setIsOnShift(true);
      Alert.alert('Shift Started', `Logged into vehicle ${taxiNumber}. Active on shift.`);
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

      {/* Header Bar: Centered Title, No back button */}
      <HeaderBar title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── MAIN PROFILE CARD ── */}
        <View style={styles.profileCard}>
          {/* Avatar with Overlapping Taxi Emblem Badge */}
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../../../assets/emp_avatar_1.png')}
              style={styles.avatarImage}
            />
            <View style={styles.taxiEmblemBadge}>
              <Image
                source={require('../../../../assets/taxi-logo.png')}
                style={styles.taxiEmblemImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Business & Driver Name */}
          <Text style={styles.bizCategoryText}>
            {businessName.toUpperCase()}
          </Text>
          <Text style={styles.driverNameText}>{userName}</Text>

          {/* ABN & Contact Meta */}
          <Text style={styles.metaLine}>
            ABN: {abn} • PH: {phone}
          </Text>
          <Text style={styles.metaLine}>
            TAXI NO.: <Text style={styles.metaBold}>{taxiNumber}</Text>
            {'   '}DC: <Text style={styles.metaBold}>{dcNumber}</Text>
          </Text>
          <Text style={styles.emailLine}>{email}</Text>

          {/* Shift Status Badge */}
          {isOnShift ? (
            <View style={styles.statusPillActive}>
              <View style={styles.statusDotActive} />
              <Text style={styles.statusTextActive}>Active • On Shift</Text>
            </View>
          ) : (
            <View style={styles.statusPillInactive}>
              <View style={styles.statusDotInactive} />
              <Text style={styles.statusTextInactive}>Off Shift</Text>
            </View>
          )}

          <Text style={styles.shiftStartTimeText}>
            Started 26 Oct 2026 | 07:30 AM (8h 45m)
          </Text>

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
              <Text style={styles.txnsLabel}>Active Shift Txns</Text>
              <View style={styles.tripsBadge}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.tripsBadgeText}>14 Trips</Text>
              </View>
            </View>

            {/* Total Fare Row */}
            <View style={styles.fareAmountRow}>
              <Text style={styles.fareDollar}>$ </Text>
              <Text style={styles.fareInteger}>485</Text>
              <Text style={styles.fareDec}>.00</Text>
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
                  <Text style={styles.breakdownAmountVal}>320</Text>
                  <Text style={styles.breakdownDec}>.00</Text>
                </View>
                <Text style={styles.breakdownSub}>9 Txns</Text>
              </View>

              <View style={styles.verticalColDivider} />

              <View style={styles.breakdownCol}>
                <View style={styles.breakdownLabelRow}>
                  <Ionicons name="flash-outline" size={11} color="#D97706" />
                  <Text style={styles.tapMethodTitle}>TAP & GO</Text>
                </View>
                <View style={styles.breakdownAmountRow}>
                  <Text style={styles.breakdownDollarAmber}>$</Text>
                  <Text style={styles.breakdownAmountVal}>165</Text>
                  <Text style={styles.breakdownDec}>.00</Text>
                </View>
                <Text style={styles.breakdownSub}>5 Txns</Text>
              </View>
            </View>
          </View>

          {/* ── End Shift Button ── */}
          <TouchableOpacity
            style={[
              styles.endShiftBtn,
              !isOnShift && styles.startShiftBtn,
            ]}
            onPress={handleToggleShift}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isOnShift ? 'log-out-outline' : 'log-in-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.endShiftBtnText}>
              {isOnShift ? 'End Shift' : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ACTION ROWS ── */}
        <View style={styles.menuGroup}>
          {/* 1. Past Shift Records */}
          <TouchableOpacity
            style={styles.menuItemCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="swap-horizontal" size={20} color="#D97706" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Past Shift Records</Text>
              <Text style={styles.menuSubText}>View your previous shift history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 2. Manage Driver */}
          <TouchableOpacity
            style={styles.menuItemCard}
            activeOpacity={0.7}
            onPress={() => router.push('/manage-driver')}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Manage Driver</Text>
              <Text style={styles.menuSubText}>Add and manage drivers</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* 3. Bank Details */}
          <TouchableOpacity
            style={styles.menuItemCard}
            activeOpacity={0.7}
            onPress={() => setIsBankModalVisible(true)}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="business-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitleText}>Bank Details</Text>
              <Text style={styles.menuSubText}>Manage your bank account details</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── LOG OUT ACCOUNT BUTTON ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="power" size={18} color="#DC2626" style={{ marginRight: 6 }} />
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

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ── 1. BANK DETAILS BOTTOM SHEET (Matching Image 1) ── */}
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

      {/* ── 2. REQUEST BANK DETAILS UPDATE SHEET (Matching Image 2) ── */}
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
                  placeholder="Lovedeep Singh Khangura"
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
                    placeholder="063-123"
                    placeholderTextColor="#94A3B8"
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    backgroundColor: '#F1F5F9',
  },
  taxiEmblemBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxiEmblemImage: {
    width: 17,
    height: 17,
  },
  bizCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
    marginTop: 6,
    textAlign: 'center',
  },
  driverNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
  metaLine: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  metaBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  emailLine: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  statusPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusTextActive: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  statusPillInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  statusDotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  statusTextInactive: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  shiftStartTimeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Active Shift ID Box */
  shiftIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    marginTop: 14,
  },
  shiftIdTextCol: {
    flex: 1,
  },
  shiftIdLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  shiftIdValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Active Shift Txns Box */
  shiftTxnsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginTop: 10,
  },
  txnsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tripsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  fareAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 6,
  },
  fareDollar: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
  },
  fareInteger: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  fareDec: {
    fontSize: 18,
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
  verticalColDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cardMethodTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  tapMethodTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  breakdownAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  breakdownDollarBlue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563EB',
  },
  breakdownDollarAmber: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#D97706',
  },
  breakdownAmountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownDec: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  breakdownSub: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },

  /* End Shift Button */
  endShiftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    width: '100%',
    marginTop: 14,
    gap: 8,
  },

  endShiftBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Menu Items */
  menuGroup: {
    gap: 10,
    marginBottom: 10,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubText: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* Logout Button */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 14,
    height: 48,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Footer */
  footerWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  poweredByLabel: {
    fontSize: 9.5,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sePayFooterLogo: {
    width: 110,
    height: 32,
  },

  /* Modal Backdrop */
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

  /* ── 1. Bank Details Sheet Styles (Image 1) ── */
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

  /* ── 2. Request Bank Details Update Sheet Styles (Image 2) ── */
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
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 48,
    marginTop: 10,
  },
  updateCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
});

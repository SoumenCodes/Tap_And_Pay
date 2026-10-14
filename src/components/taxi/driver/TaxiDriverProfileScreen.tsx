import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';

export default function TaxiDriverProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOnShift, setIsOnShift] = useState(true);

  const businessName = user.businessName || 'Elite Taxi Service';
  const userName = user.name || 'Harpreet Singh';
  const taxiNumber = user.taxiNumber || 'M6022';
  const dcNumber = '58745896';
  const abn = '62 458 123 800';
  const phone = '0400 555 320';
  const email = 'harpreet_singh@testmail.com.au';
  const activeShiftId = `26102026/${taxiNumber}/537384`;

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
              source={require('../../../../assets/emp_avatar_2.png')}
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
                  <View style={styles.tapDot} />
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

          {/* ── End Shift Button (Black) ── */}
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
              {isOnShift ? 'End Shift' : 'Start Shift'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── ACTION CARD: Past Shift Records ── */}
        <TouchableOpacity
          style={styles.pastRecordsCard}
          activeOpacity={0.75}
          onPress={() => router.push('/(tabs)/transactions')}
        >
          <View style={styles.pastRecordsIconWrap}>
            <Ionicons name="swap-horizontal" size={20} color="#D97706" />
          </View>
          <View style={styles.pastRecordsTextCol}>
            <Text style={styles.pastRecordsTitle}>Past Shift Records</Text>
            <Text style={styles.pastRecordsSub}>View your previous shift history</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

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
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#0F172A',
  },
  taxiEmblemBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    padding: 2,
  },
  taxiEmblemImage: {
    width: '100%',
    height: '100%',
  },
  bizCategoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.6,
    marginBottom: 3,
    marginTop: 6,
  },
  driverNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
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
    marginBottom: 8,
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
    marginTop: 2,
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
    marginTop: 2,
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

  /* Past Shift Records Card */
  pastRecordsCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  pastRecordsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pastRecordsTextCol: {
    flex: 1,
  },
  pastRecordsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pastRecordsSub: {
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
});

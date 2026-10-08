import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import HeaderBar from '../common/HeaderBar';

export default function OtherBusinessProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(true);

  const businessName = user.businessName || 'Crown Cuts';
  const userName = user.name || 'Soumen';
  const businessAddress = user.businessAddress || 'Suite 4, 120 Collins Street, Melbourne VIC';

  const handleEndSession = () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end the current trading session? Total collections ($485.00) will be submitted for settlement.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            setIsSessionActive(false);
            Alert.alert('Session Ended', 'Trading session ended successfully. Summary archived to session records.');
          },
        },
      ]
    );
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    Alert.alert('Session Started', 'New trading session started successfully.');
  };

  const handlePastSessionRecords = () => {
    router.push('/(tabs)/transactions');
  };

  const handleManageEmployee = () => {
    router.push('/manage-employee');
  };

  const handleBankDetails = () => {
    Alert.alert(
      'Bank Details',
      'Settlement Account:\n• Institution: Commonwealth Bank\n• Account Name: Crown Cuts Pty Ltd\n• BSB: 063-000\n• Account No: •••• 4892\n• Payout Schedule: Daily (Direct Deposit)',
      [{ text: 'Close' }]
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

      {/* Common Header Bar */}
      <HeaderBar title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Profile Summary Card */}
        <View style={styles.profileCard}>
          {/* Avatar with Verified Badge */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('../../../assets/crown_cuts_badge_hd.png')}
                style={styles.avatarImage}
                resizeMode="contain"
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Business & Merchant Details */}
          <Text style={styles.brandTitle}>{businessName}</Text>
          <Text style={styles.ownerTitle}>{userName}&apos;s Business</Text>

          <View style={styles.metaInfoWrap}>
            <Text style={styles.metaLine}>ABN: 62 458 123 800 • PH: 0400 555 320</Text>
            <Text style={styles.metaLine}>soumen_crowncuts@testmail.com</Text>
            <Text style={styles.metaLine}>{businessAddress}</Text>
          </View>

          {/* Active / Inactive Status Pill */}
          <View style={styles.statusPillContainer}>
            {isSessionActive ? (
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.inactivePill}>
                <View style={styles.inactiveDot} />
                <Text style={styles.inactiveText}>Session Ended</Text>
              </View>
            )}
          </View>

          {/* Session Duration / Start Timestamp */}
          <Text style={styles.sessionTimestamp}>
            Started 26 Oct 2026 | 07:30 AM (8h 45m)
          </Text>

          {/* Inner Session Revenue Card */}
          <View style={styles.revenueCard}>
            {/* Top row: Label + Txn Count */}
            <View style={styles.revenueHeaderRow}>
              <Text style={styles.revenueLabel}>Session Revenue</Text>
              <View style={styles.txnBadge}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                <Text style={styles.txnBadgeText}>14 Txns</Text>
              </View>
            </View>

            {/* Big Amount Row */}
            <View style={styles.amountDisplayRow}>
              <Text style={styles.amountCurrency}>$</Text>
              <Text style={styles.amountInteger}> 485</Text>
              <Text style={styles.amountDecimals}>.00</Text>
            </View>

            {/* 2 Stats Columns: Card & Tap & Go */}
            <View style={styles.statsRow}>
              {/* Card Stat */}
              <View style={styles.statColumn}>
                <View style={styles.statHeaderRow}>
                  <Ionicons name="card-outline" size={13} color="#2563EB" />
                  <Text style={styles.cardStatTitle}>CARD</Text>
                </View>
                <View style={styles.statAmountRow}>
                  <Text style={styles.cardStatCurrency}>$</Text>
                  <Text style={styles.cardStatInteger}>320</Text>
                  <Text style={styles.cardStatDecimals}>.00</Text>
                </View>
                <Text style={styles.statSubtext}>9 Txns</Text>
              </View>

              {/* Tap & Go Stat */}
              <View style={styles.statColumn}>
                <View style={styles.statHeaderRow}>
                  <View style={styles.tapDot} />
                  <Text style={styles.tapStatTitle}>TAP & GO</Text>
                </View>
                <View style={styles.statAmountRow}>
                  <Text style={styles.tapStatCurrency}>$</Text>
                  <Text style={styles.tapStatInteger}>165</Text>
                  <Text style={styles.tapStatDecimals}>.00</Text>
                </View>
                <Text style={styles.statSubtext}>5 Txns</Text>
              </View>
            </View>
          </View>

          {/* End / Resume Session CTA Button */}
          {isSessionActive ? (
            <TouchableOpacity
              style={styles.endSessionBtn}
              onPress={handleEndSession}
              activeOpacity={0.88}
            >
              <Feather name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.endSessionText}>End Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.endSessionBtn, { backgroundColor: '#10B981' }]}
              onPress={handleStartSession}
              activeOpacity={0.88}
            >
              <Feather name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.endSessionText}>Start New Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Menu Cards */}
        {/* 1. Past Session Records */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handlePastSessionRecords}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <Ionicons name="swap-horizontal" size={20} color="#D97706" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>Past Session Records</Text>
            <Text style={styles.menuSub}>View your previous shift history</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 2. Manage Employee */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handleManageEmployee}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <MaterialCommunityIcons name="badge-account-outline" size={20} color="#D97706" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>Manage Employee</Text>
            <Text style={styles.menuSub}>Manage your team</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 3. Bank Details */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={handleBankDetails}
          activeOpacity={0.8}
        >
          <View style={styles.menuIconWrap}>
            <MaterialCommunityIcons name="bank-outline" size={20} color="#D97706" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>Bank Details</Text>
            <Text style={styles.menuSub}>Manage your bank account details</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Log Out Account Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="power-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>

        {/* Footer Branding */}
        <View style={styles.footerBranding}>
          <Text style={styles.poweredByText}>
            POWERED BY <Text style={styles.brandNameText}>SE PAY</Text>
          </Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 46,
    height: 46,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  ownerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  metaInfoWrap: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 3,
  },
  metaLine: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusPillContainer: {
    marginBottom: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  activeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  inactivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  inactiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  inactiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  sessionTimestamp: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  revenueCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  revenueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  txnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txnBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  amountDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  amountCurrency: {
    fontSize: 28,
    fontWeight: '800',
    color: '#D97706',
  },
  amountInteger: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  amountDecimals: {
    fontSize: 20,
    fontWeight: '700',
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statColumn: {
    flex: 1,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cardStatTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  tapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EA580C',
  },
  tapStatTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  statAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardStatCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardStatInteger: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardStatDecimals: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tapStatCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EA580C',
  },
  tapStatInteger: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EA580C',
  },
  tapStatDecimals: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  endSessionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  endSessionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FEF08A',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  footerBranding: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  poweredByText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  brandNameText: {
    color: '#0050B6',
    fontWeight: '800',
  },
});

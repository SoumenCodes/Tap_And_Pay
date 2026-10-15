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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

interface OtherBusinessEmployeeDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
  empId?: string;
}

export default function OtherBusinessEmployeeDashboard({
  businessName = 'Crown Cuts',
  userName = 'Liam Hemsworth',
  sessionStartTime = '7:30 AM',
  empId = '93822048',
}: OtherBusinessEmployeeDashboardProps) {
  const router = useRouter();
  const [isOnShift, setIsOnShift] = useState(true);

  const activeShiftId = '26062021/93821048/537384';

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      Alert.alert(
        'End Shift',
        `Are you sure you want to end your current active shift (${activeShiftId})? Total sales ($485.00) will be submitted to records.`,
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
      Alert.alert('Shift Started', 'Active on shift. Ready to accept sales.');
    }
  };

  const handleNavigateToTransactions = () => {
    router.push('/(tabs)/transactions');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="SE PAY DASHBOARD" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Combined Hero Banner & Employee Welcome Card */}
        <View style={styles.topCardContainer}>
          {/* Top Banner Image with Barber Salon & Crown Cuts */}
          <View style={styles.bannerContainer}>
            <Image
              source={require('../../../../assets/crown_cuts_hero.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            {/* Bottom-left overlay: Crown cuts gold badge + translucent text badge */}
            <View style={styles.bannerBottomRow}>
              <View style={styles.avatarBox}>
                <Image
                  source={require('../../../../assets/crown_cuts_badge_hd.png')}
                  style={styles.avatarBadgeImage}
                  resizeMode="contain"
                />
              </View>

              {/* Translucent Text Badge (matching Other Business) */}
              <View style={styles.bannerTextBadge}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {businessName}
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
              Welcome, <Text style={styles.userNameBold}>{userName}</Text>
            </Text>

            <View style={styles.welcomeMetaRow}>
              <Text style={styles.empIdMetaLabel}>
                EMP ID: <Text style={styles.empIdHighlight}>{empId}</Text>
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.clockRow}>
                <Feather name="clock" size={12} color="#64748B" style={styles.clockIcon} />
                <Text style={styles.shiftStartText}>Shift Start: {sessionStartTime}</Text>
              </View>
            </View>
          </View>

          {/* Active Shift Row with ON SHIFT Pill */}
          <View style={styles.activeShiftRow}>
            <Text style={styles.activeShiftLabel}>
              ACTIVE SHIFT: <Text style={styles.activeShiftCode}>{activeShiftId}</Text>
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

        {/* 3. Revenue Card: Last 7 days */}
        <View style={styles.revenueCardOuter}>
          <View style={styles.revenueCardHeader}>
            <View style={styles.revenueTitleRow}>
              <Text style={styles.revenueMainTitle}>Revenue </Text>
              <Text style={styles.revenueSubTitle}>Last 7 days</Text>
            </View>
            <View style={styles.txnsCountBadge}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
              <Text style={styles.txnsCountText}>14 Txns</Text>
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
                <Text style={styles.currencySymbolGold}>$</Text>485
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>9 Txns</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Card Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="card-outline" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.metricLabelCard}>CARD</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolBlue}>$</Text>320
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>2 Txns</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Tap & Go Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.metricLabelTap}>TAP & GO</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolOrange}>$</Text>165
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>7 Txns</Text>
            </View>
          </View>
        </View>

        {/* 4. End / Start Shift Action Button (Black) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={styles.shiftButton}
        >
          <Ionicons
            name={isOnShift ? 'exit-outline' : 'enter-outline'}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.shiftButtonText}>
            {isOnShift ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 5. Recent Transactions Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentSectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNavigateToTransactions}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Card 1 */}
          <TouchableOpacity
            style={styles.txnCard}
            activeOpacity={0.85}
            onPress={handleNavigateToTransactions}
          >
            <View style={styles.txnLeftWrap}>
              <Text style={styles.txnIdText}>#TXN-984210</Text>
              <Text style={styles.txnTimeText}>04:45 PM</Text>
              <View style={styles.cardPill}>
                <Ionicons name="card" size={10} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.cardPillText}>Card</Text>
              </View>
            </View>

            <Text style={styles.txnAmount}>
              <Text style={styles.currencySymbolGold}>$</Text>106
              <Text style={styles.centsText}>.00</Text>
            </Text>
          </TouchableOpacity>

          {/* Transaction Card 2 */}
          <TouchableOpacity
            style={styles.txnCard}
            activeOpacity={0.85}
            onPress={handleNavigateToTransactions}
          >
            <View style={styles.txnLeftWrap}>
              <Text style={styles.txnIdText}>#TXN-987541</Text>
              <Text style={styles.txnTimeText}>05:58 PM</Text>
              <View style={styles.cardPill}>
                <Ionicons name="card" size={10} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.cardPillText}>Card</Text>
              </View>
            </View>

            <Text style={styles.txnAmount}>
              <Text style={styles.currencySymbolGold}>$</Text>85
              <Text style={styles.centsText}>.00</Text>
            </Text>
          </TouchableOpacity>
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
    padding: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
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
  welcomeInfoContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 15.5,
    color: '#334155',
    fontWeight: '400',
    marginBottom: 4,
    textAlign: 'center',
  },
  userNameBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empIdMetaLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  empIdHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  metaDot: {
    color: '#CBD5E1',
    marginHorizontal: 6,
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
    fontWeight: '500',
  },
  activeShiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FEFCE8',
    borderTopWidth: 1,
    borderTopColor: '#FEF08A',
  },
  activeShiftLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeShiftCode: {
    fontWeight: '600',
    color: '#475569',
  },
  onShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  offShiftBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  onShiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  offShiftDot: {
    backgroundColor: '#94A3B8',
  },
  onShiftText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.3,
  },
  offShiftText: {
    color: '#64748B',
  },

  /* 2. CREATE SALE Quick Action Card */
  saleCardOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  saleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scissorsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  saleTextWrap: {
    flex: 1,
  },
  saleTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  saleSubtitle: {
    fontSize: 11.5,
    fontStyle: 'italic',
    color: '#78350F',
    marginTop: 2,
    fontWeight: '600',
  },
  saleArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
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
    shadowOpacity: 0.03,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  revenueSubTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  txnsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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

  /* 4. End Shift Action Button */
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
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 5. Recent Transactions Section */
  recentSection: {
    marginTop: 2,
    marginBottom: 8,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txnLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 11.5,
    color: '#64748B',
    marginLeft: 8,
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  cardPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
});

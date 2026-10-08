import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

interface OtherBusinessDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
}

export default function OtherBusinessDashboard({
  businessName = 'Crown Cuts',
  businessAddress = 'Suite 4, 120 Collins Street, Melbourne VIC',
  userName = 'Soumen',
  sessionStartTime = '7:30 AM',
}: OtherBusinessDashboardProps) {
  const router = useRouter();

  // Session & Online state (defaults to Online as shown in Figma 76:12635)
  const [isOnline, setIsOnline] = useState(true);

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleSession = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="SE PAY DASHBOARD" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Crown Cuts Barber Salon Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../../../assets/crown_cuts_hero.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Bottom-left row: Avatar + Translucent Text Badge */}
          <View style={styles.bannerBottomRow}>
            {/* Avatar Logo Box */}
            <View style={styles.avatarBox}>
              <Image
                source={require('../../../../assets/crown_cuts_badge_hd.png')}
                style={styles.avatarBadgeImage}
                resizeMode="contain"
              />
            </View>

            {/* Translucent Text Badge */}
            <View style={styles.bannerTextBadge}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {businessName}
              </Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                {businessAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Welcome User Card */}
        <View style={styles.welcomeCardOuter}>
          {/* Top subtle golden gradient line */}
          <LinearGradient
            colors={[
              'rgba(251, 191, 36, 0)',
              '#FBBF24',
              '#F59E0B',
              '#FBBF24',
              'rgba(251, 191, 36, 0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.cardTopStripe}
          />

          <View style={styles.welcomeCardInner}>
            <Text style={styles.welcomeTitle}>
              Welcome, <Text style={styles.userNameText}>{userName}</Text>
            </Text>

            <View style={styles.welcomeMetaRow}>
              <View style={styles.sessionStartWrap}>
                <Feather name="clock" size={14} color="#64748B" />
                <Text style={styles.sessionStartTime}>
                  Session Start: {sessionStartTime}
                </Text>
              </View>

              {/* Online / Offline Status Pill Badge (Clickable toggle) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleToggleSession}
                style={[
                  styles.statusBadge,
                  isOnline ? styles.onlineBadge : styles.offlineBadge,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    isOnline ? styles.onlineDot : styles.offlineDot,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isOnline ? styles.onlineText : styles.offlineText,
                  ]}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. CREATE SALE Quick Action Card (Gold gradient with scissors icon) */}
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
              <Ionicons name="cut" size={26} color="#0F172A" />
            </View>

            {/* Text Information */}
            <View style={styles.saleTextWrap}>
              <Text style={styles.saleTitle}>CREATE SALE</Text>
              <Text style={styles.saleSubtitle}>Charge. Confirm. Done.</Text>
            </View>

            {/* Right Arrow Button */}
            <View style={styles.saleArrowWrap}>
              <Feather name="chevron-right" size={22} color="#0F172A" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. Today's Revenue Card */}
        <View style={styles.revenueCardOuter}>
          <View style={styles.revenueCardHeader}>
            <Text style={styles.revenueTitle}>Today&apos;s Revenue</Text>
            <View style={styles.txnsCountBadge}>
              <Feather name="check-circle" size={14} color="#065F46" />
              <Text style={styles.txnsCountText}>9 Txns</Text>
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
                <Feather name="credit-card" size={12} color="#0284C7" />
                <Text style={styles.metricLabelCard}>CARD</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolBlue}>$</Text>320
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>2 txns</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Tap & Go Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={13}
                  color="#D97706"
                />
                <Text style={styles.metricLabelTap}>TAP & GO</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolGold}>$</Text>165
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>7 txns</Text>
            </View>
          </View>
        </View>

        {/* 5. End Session / Start Session Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleSession}
          style={styles.sessionActionBtn}
        >
          <Ionicons
            name={isOnline ? 'exit-outline' : 'log-in-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.sessionActionText}>
            {isOnline ? 'End Session' : 'Start Session'}
          </Text>
        </TouchableOpacity>

        {/* 6. Recent Transactions Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transaction Item 1 */}
        <View style={styles.txnCard}>
          <View style={styles.txnRow}>
            <Text style={styles.txnIdText}>#TXN-984210</Text>
            <Text style={styles.txnTimeText}>04:45 PM</Text>
            <View style={styles.cardMethodBadge}>
              <Feather name="credit-card" size={11} color="#0284C7" />
              <Text style={styles.cardMethodText}>Card</Text>
            </View>
            <View style={styles.txnSpacer} />
            <Text style={styles.txnAmount}>
              <Text style={styles.txnCurrency}>$</Text>106
              <Text style={styles.txnCents}>.00</Text>
            </Text>
          </View>
        </View>

        {/* Recent Transaction Item 2 */}
        <View style={styles.txnCard}>
          <View style={styles.txnRow}>
            <Text style={styles.txnIdText}>#TXN-987541</Text>
            <Text style={styles.txnTimeText}>05:58 PM</Text>
            <View style={styles.cardMethodBadge}>
              <Feather name="credit-card" size={11} color="#0284C7" />
              <Text style={styles.cardMethodText}>Card</Text>
            </View>
            <View style={styles.txnSpacer} />
            <Text style={styles.txnAmount}>
              <Text style={styles.txnCurrency}>$</Text>85
              <Text style={styles.txnCents}>.00</Text>
            </Text>
          </View>
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
    paddingHorizontal: 20,
    gap: 16,
  },
  bannerContainer: {
    width: '100%',
    height: 154,
    borderRadius: 20,
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
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarBadgeImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 16,
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
  welcomeCardOuter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    overflow: 'hidden',
    shadowColor: '#C59B27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
  },
  cardTopStripe: {
    height: 3,
    width: '100%',
  },
  welcomeCardInner: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#0F172A',
  },
  userNameText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionStartWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionStartTime: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  onlineBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  offlineBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineDot: {
    backgroundColor: '#10B981',
  },
  offlineDot: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineText: {
    color: '#065F46',
  },
  offlineText: {
    color: '#991B1B',
  },
  saleCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  scissorsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleTextWrap: {
    flex: 1,
    gap: 2,
  },
  saleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  saleSubtitle: {
    fontSize: 13,
    color: '#1E293B',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  saleArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCardOuter: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  revenueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  txnsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  columnDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricLabelTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  metricLabelCard: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  metricLabelTap: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  currencySymbolGold: {
    color: '#D97706',
    fontSize: 16,
    fontWeight: '700',
  },
  currencySymbolBlue: {
    color: '#0284C7',
    fontSize: 16,
    fontWeight: '700',
  },
  centsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sessionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sessionActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txnIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 12,
    color: '#64748B',
  },
  cardMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  txnSpacer: {
    flex: 1,
  },
  txnAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  txnCurrency: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '700',
  },
  txnCents: {
    fontSize: 12,
    color: '#64748B',
  },
});


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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

interface TaxiDriverDashboardProps {
  businessName?: string;
  userName?: string;
  taxiNumber?: string;
  sessionStartTime?: string;
}

export default function TaxiDriverDashboard({
  businessName = 'Elite Taxi Fleet',
  userName = 'Gurpreet Singh',
  taxiNumber = 'M6061',
  sessionStartTime = '7:30 AM',
}: TaxiDriverDashboardProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  const handleStartTaxiFare = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    setIsOnline((prev) => {
      const next = !prev;
      Alert.alert(
        next ? 'Shift Started' : 'Shift Ended',
        next
          ? 'You are now Online and ready to accept passenger taxi fares.'
          : 'Your shift has ended. Total fare collections submitted to fleet records.'
      );
      return next;
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar title="SE PAY DASHBOARD" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Elite Taxi Fleet Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../../../assets/elite_taxi_hero.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Bottom-left row: Avatar + Translucent Text Badge */}
          <View style={styles.bannerBottomRow}>
            {/* Avatar Logo Box with ET Initials */}
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>ET</Text>
            </View>

            {/* Translucent Text Badge */}
            <View style={styles.bannerTextBadge}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                {businessName}
              </Text>
              <Text style={styles.bannerSubtitle} numberOfLines={1}>
                SHIFT: {isOnline ? 'Active' : 'Start Shift Now!'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Welcome Driver Card */}
        <View style={styles.welcomeCardOuter}>
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
            <View style={styles.titleRow}>
              <Text style={styles.welcomeTitle}>Welcome, {userName}</Text>
              <View style={styles.driverBadge}>
                <Ionicons name="car-outline" size={13} color="#D97706" />
                <Text style={styles.driverBadgeText}>Driver • {taxiNumber}</Text>
              </View>
            </View>

            <View style={styles.welcomeMetaRow}>
              <View style={styles.sessionStartWrap}>
                <Feather name="clock" size={14} color="#64748B" />
                <Text style={styles.sessionStartTime}>
                  Session Start: {sessionStartTime}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.shiftStatusPill,
                  isOnline ? styles.shiftOnline : styles.shiftOffline,
                ]}
                activeOpacity={0.8}
                onPress={handleToggleShift}
              >
                <View
                  style={[
                    styles.statusDot,
                    isOnline ? styles.dotOnline : styles.dotOffline,
                  ]}
                />
                <Text
                  style={[
                    styles.shiftStatusText,
                    isOnline ? styles.onlineText : styles.offlineText,
                  ]}
                >
                  {isOnline ? 'Active Shift' : 'Start Shift'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. Primary Start Taxi Fare CTA */}
        <TouchableOpacity
          style={styles.fareButtonOuter}
          activeOpacity={0.88}
          onPress={handleStartTaxiFare}
        >
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fareButtonGradient}
          >
            <View style={styles.fareIconCircle}>
              <MaterialCommunityIcons name="taxi" size={24} color="#FBBF24" />
            </View>
            <View style={styles.fareTextCol}>
              <Text style={styles.fareTitle}>Start Taxi Fare</Text>
              <Text style={styles.fareSubtitle}>Tap to enter amount & accept payment</Text>
            </View>
            <Feather name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. Shift Revenue Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsHeaderTitle}>Shift Fare Earnings</Text>
          <View style={styles.statsAmountRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.mainAmount}>285</Text>
            <Text style={styles.centsText}>.50</Text>
            <View style={styles.tripsCountBadge}>
              <Ionicons name="checkmark-done" size={13} color="#16A34A" />
              <Text style={styles.tripsCountText}>8 Trips</Text>
            </View>
          </View>

          <View style={styles.chipsRow}>
            <View style={styles.statChip}>
              <Feather name="credit-card" size={12} color="#0284C7" />
              <Text style={styles.statChipLabel}>Card: $190.00 (5)</Text>
            </View>
            <View style={styles.statChip}>
              <MaterialCommunityIcons name="contactless-payment" size={14} color="#16A34A" />
              <Text style={styles.statChipLabel}>Tap: $95.50 (3)</Text>
            </View>
          </View>
        </View>

        {/* 5. Recent Shift Rides Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Recent Rides</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/transactions')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Ride Card 1 */}
        <View style={styles.txnCard}>
          <View style={styles.txnRow}>
            <Text style={styles.txnIdText}>#TRIP-849201</Text>
            <Text style={styles.txnTimeText}>10:14 AM</Text>
            <View style={styles.cardMethodBadge}>
              <MaterialCommunityIcons name="contactless-payment" size={13} color="#16A34A" />
              <Text style={styles.cardMethodText}>Tap & Go</Text>
            </View>
            <View style={styles.txnSpacer} />
            <Text style={styles.txnAmount}>
              <Text style={styles.txnCurrency}>$</Text>42
              <Text style={styles.txnCents}>.50</Text>
            </Text>
          </View>
        </View>

        {/* Recent Ride Card 2 */}
        <View style={styles.txnCard}>
          <View style={styles.txnRow}>
            <Text style={styles.txnIdText}>#TRIP-849188</Text>
            <Text style={styles.txnTimeText}>09:30 AM</Text>
            <View style={styles.cardMethodBadge}>
              <Feather name="credit-card" size={11} color="#0284C7" />
              <Text style={styles.cardMethodText}>Card</Text>
            </View>
            <View style={styles.txnSpacer} />
            <Text style={styles.txnAmount}>
              <Text style={styles.txnCurrency}>$</Text>68
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    borderColor: 'rgba(251, 191, 36, 0.4)',
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
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    gap: 4,
  },
  driverBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
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
    color: '#64748B',
    fontWeight: '500',
  },
  shiftStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
  },
  shiftOnline: {
    backgroundColor: '#DCFCE7',
  },
  shiftOffline: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOnline: {
    backgroundColor: '#16A34A',
  },
  dotOffline: {
    backgroundColor: '#DC2626',
  },
  shiftStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  onlineText: {
    color: '#166534',
  },
  offlineText: {
    color: '#991B1B',
  },
  fareButtonOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  fareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  fareIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareTextCol: {
    flex: 1,
    gap: 2,
  },
  fareTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  fareSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 10,
  },
  statsHeaderTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 4,
  },
  mainAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
  },
  centsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 10,
  },
  tripsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  tripsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  txnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txnIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  cardMethodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  txnSpacer: {
    flex: 1,
  },
  txnAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  txnCurrency: {
    color: '#D97706',
  },
  txnCents: {
    color: '#94A3B8',
  },
});

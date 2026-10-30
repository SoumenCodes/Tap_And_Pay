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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';

interface TaxiOwnerDashboardProps {
  businessName?: string;
  userName?: string;
  taxiNumber?: string;
  sessionStartTime?: string;
}

export default function TaxiOwnerDashboard({
  businessName = '',
  userName = '',
  taxiNumber = '',
  sessionStartTime = '',
}: TaxiOwnerDashboardProps) {
  const router = useRouter();
  const { showConfirm, showAlert } = useConfirmModal();
  const [isOnShift, setIsOnShift] = useState(true);

  // Compute initials for the badge (e.g. "Harpreet Singh Taxi Service" -> "HS")
  const initials = (() => {
    const parts = (businessName || userName).trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (businessName || userName).slice(0, 2).toUpperCase();
  })();

  const handleStartTaxiFare = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      showConfirm({
        title: 'End Shift',
        message:
          'Are you sure you want to end your current active shift? Total fare collections ($485.00) will be submitted to records.',
        confirmText: 'End Shift',
        cancelText: 'Cancel',
        type: 'warning',
        icon: 'stop-circle-outline',
        onConfirm: () => {
          setIsOnShift(false);
          showAlert({
            title: 'Shift Ended',
            message: 'Shift tally submitted to records.',
            type: 'success',
            icon: 'checkmark-circle-outline',
          });
        },
      });
    } else {
      setIsOnShift(true);
      showAlert({
        title: 'Shift Started',
        message: `Logged into taxi ${taxiNumber}. Active on shift.`,
        type: 'success',
        icon: 'checkmark-circle-outline',
      });
    }
  };

  const handleNavigateToTransactions = () => {
    router.push('/(tabs)/transactions');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar with back arrow */}
      <HeaderBar title="SE PAY DASHBOARD" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Combined Hero Banner & Owner Info Card */}
        <View style={styles.topCardContainer}>
          {/* Banner with Cityscape and Taxi */}
          <View style={styles.bannerContainer}>
            <Image
              source={require('../../../../assets/elite_taxi_hero.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />

            {/* Bottom-left branding: Initials Avatar + Business Name */}
            <View style={styles.bannerBottomRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>

              <View style={styles.bannerTextBadge}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {businessName}
                </Text>
              </View>
            </View>
          </View>

          {/* Welcome & Shift Info Box */}
          <View style={styles.welcomeBody}>
            <View style={styles.welcomeCenterWrap}>
              <Text style={styles.welcomeTitle}>
                Welcome, <Text style={styles.welcomeNameBold}>{userName}</Text>
              </Text>

              <View style={styles.welcomeMetaRow}>
                <Text style={styles.taxiMetaLabel}>
                  Taxi No.: <Text style={styles.taxiNoHighlight}>{taxiNumber}</Text>
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <View style={styles.clockRow}>
                  <Feather name="clock" size={12} color="#64748B" style={styles.clockIcon} />
                  <Text style={styles.shiftStartText}>
                    Shift Start: {isOnShift ? (sessionStartTime || '--') : '--'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Active Shift row with ON/OFF SHIFT pill */}
            <View style={styles.activeShiftRow}>
              <Text style={styles.activeShiftLabel}>
                ACTIVE SHIFT:{' '}
                <Text style={styles.activeShiftCode}>
                  26062021/{taxiNumber}/537384
                </Text>
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
        </View>

        {/* 2. TAXI FARE Golden Card (Only visible when On Shift) */}
        {isOnShift && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartTaxiFare}
            style={styles.taxiFareCard}
          >
            <LinearGradient
              colors={['#FBBF24', '#F59E0B']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.taxiFareGradient}
            >
              <View style={styles.taxiFareIconBox}>
                <MaterialCommunityIcons name="taxi" size={26} color="#0F172A" />
              </View>

              <View style={styles.taxiFareTextCol}>
                <Text style={styles.taxiFareTitle}>TAXI FARE</Text>
                <Text style={styles.taxiFareSubtitle}>Ready to charge passengers</Text>
              </View>

              <View style={styles.taxiFareArrowCircle}>
                <Feather name="chevron-right" size={20} color="#78350F" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 3. Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueTitleRow}>
              <Text style={styles.revenueMainTitle}>Revenue </Text>
              <Text style={styles.revenueSubTitle}>Last 7 days</Text>
            </View>
            <View style={styles.tripsCountBadge}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#059669" />
              <Text style={styles.tripsCountText}>14 Trips</Text>
            </View>
          </View>

          {/* 3 Metrics: Total, Card, Tap & Go */}
          <View style={styles.metricsRow}>
            {/* 1. Total */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricColorDot, { backgroundColor: '#D97706' }]} />
                <Text style={[styles.metricLabelText, { color: '#B45309' }]}>TOTAL</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarOrange}>$</Text>485
                <Text style={styles.metricCents}>.00</Text>
              </Text>
              <Text style={styles.metricSubInfo}>14 Trips</Text>
            </View>

            {/* 2. Card */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="card" size={12} color="#2563EB" style={styles.metricCardIcon} />
                <Text style={[styles.metricLabelText, { color: '#2563EB' }]}>CARD</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarBlue}>$</Text>320
                <Text style={styles.metricCents}>.00</Text>
              </Text>
              <Text style={styles.metricSubInfo}>9 txns</Text>
            </View>

            {/* 3. Tap & Go */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricColorDot, { backgroundColor: '#EA580C' }]} />
                <Text style={[styles.metricLabelText, { color: '#EA580C' }]}>TAP & GO</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={styles.metricDollarAmber}>$</Text>165
                <Text style={styles.metricCents}>.00</Text>
              </Text>
              <Text style={styles.metricSubInfo}>5 txns</Text>
            </View>
          </View>
        </View>

        {/* 4. End / Start Shift Action Button (Black) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={styles.shiftButton}
        >
          <MaterialCommunityIcons
            name={isOnShift ? 'logout' : 'login'}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.shiftButtonText}>
            {isOnShift ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 5. Recent Trips Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>Recent Trips</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNavigateToTransactions}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Trip Card 1 */}
          <TouchableOpacity
            style={styles.tripCard}
            activeOpacity={0.85}
            onPress={handleNavigateToTransactions}
          >
            <View style={styles.tripHeaderRow}>
              <Text style={styles.tripIdText}>#TXN-984210</Text>
              <Text style={styles.tripTimeText}>04:45 PM</Text>
              <View style={styles.cardPill}>
                <Ionicons name="card" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.cardPillText}>Card</Text>
              </View>
              <View style={styles.spacer} />
              <Text style={styles.tripAmountText}>
                <Text style={styles.dollarOrange}>$</Text>106
                <Text style={styles.tripCents}>.00</Text>
              </Text>
            </View>

            <View style={styles.routeContainer}>
              {/* Pickup */}
              <View style={styles.routePointRow}>
                <View style={[styles.routeDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.routeAddressText}>St. Jude Medical Centre</Text>
              </View>
              {/* Connector */}
              <View style={styles.routeConnector} />
              {/* Dropoff */}
              <View style={styles.routePointRow}>
                <View style={[styles.routeDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.routeAddressText}>42 Richmond Road</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Trip Card 2 */}
          <TouchableOpacity
            style={styles.tripCard}
            activeOpacity={0.85}
            onPress={handleNavigateToTransactions}
          >
            <View style={styles.tripHeaderRow}>
              <Text style={styles.tripIdText}>#TXN-987541</Text>
              <Text style={styles.tripTimeText}>05:58 PM</Text>
              <View style={styles.cardPill}>
                <Ionicons name="card" size={11} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.cardPillText}>Card</Text>
              </View>
              <View style={styles.spacer} />
              <Text style={styles.tripAmountText}>
                <Text style={styles.dollarOrange}>$</Text>85
                <Text style={styles.tripCents}>.00</Text>
              </Text>
            </View>

            <View style={styles.routeContainer}>
              {/* Pickup */}
              <View style={styles.routePointRow}>
                <View style={[styles.routeDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.routeAddressText}>Melbourne Airport 2</Text>
              </View>
              {/* Connector */}
              <View style={styles.routeConnector} />
              {/* Dropoff */}
              <View style={styles.routePointRow}>
                <View style={[styles.routeDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.routeAddressText}>Great Central Hotel</Text>
              </View>
            </View>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },

  /* 1. Combined Top Card */
  topCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
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
    fontSize: 17,
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
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  welcomeBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  welcomeCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  welcomeTitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeNameBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxiMetaLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  taxiNoHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  metaDot: {
    marginHorizontal: 8,
    color: '#CBD5E1',
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
  },
  activeShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  activeShiftLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  activeShiftCode: {
    fontWeight: '600',
    color: '#475569',
  },
  onShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  offShiftBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  onShiftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  offShiftDot: {
    backgroundColor: '#94A3B8',
  },
  onShiftText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.3,
  },
  offShiftText: {
    color: '#64748B',
  },

  /* 2. Taxi Fare CTA Card */
  taxiFareCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  taxiFareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taxiFareIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taxiFareTextCol: {
    flex: 1,
  },
  taxiFareTitle: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  taxiFareSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#451A03',
    marginTop: 2,
  },
  taxiFareArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(254, 240, 138, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 3. Revenue Card */
  revenueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  revenueTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  revenueMainTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  revenueSubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  tripsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingTop: 12,
  },
  metricCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricColorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  metricCardIcon: {
    marginRight: 4,
  },
  metricLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metricValueText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricDollarOrange: {
    color: '#D97706',
    fontWeight: '800',
  },
  metricDollarBlue: {
    color: '#2563EB',
    fontWeight: '800',
  },
  metricDollarAmber: {
    color: '#EA580C',
    fontWeight: '800',
  },
  metricCents: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  metricSubInfo: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },

  /* 4. Action Button (Black) */
  shiftButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 5. Recent Trips */
  recentSection: {
    marginTop: 4,
    gap: 10,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 8,
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  cardPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  spacer: {
    flex: 1,
  },
  tripAmountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dollarOrange: {
    color: '#D97706',
    fontWeight: '800',
  },
  tripCents: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  routeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  routePointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 9,
  },
  routeConnector: {
    marginLeft: 3.5,
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  routeAddressText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
  },
});

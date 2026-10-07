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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TaxiDashboard() {
  const insets = useSafeAreaInsets();

  // Shift & Online state (defaults to Offline & Start Shift)
  const [isOnline, setIsOnline] = useState(false);

  const handleStartTaxiFare = () => {
    console.log('Navigate to Taxi Fare');
  };

  const handleToggleShift = () => {
    setIsOnline((prev) => !prev);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: Math.max(insets.top, 24) + 8,
          },
        ]}
      >
        <Text style={styles.headerTitle}>SE PAY DASHBOARD</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Elite Taxi Service Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../../assets/elite_taxi_hero.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* 2. Welcome Driver Card */}
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
            <Text style={styles.welcomeTitle}>Welcome, Lovedeep Khangura</Text>

            <View style={styles.driverInfoRow}>
              <Text style={styles.driverMetaText}>
                Taxi No.: <Text style={styles.taxiNumberText}>M6061</Text>
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <View style={styles.shiftStartWrap}>
                <Feather name="clock" size={13} color={colors.text.muted} />
                <Text style={styles.shiftStartTime}>Shift Start: 7:30 AM</Text>
              </View>
            </View>

            {/* Online / Offline Status Pill Badge (Clickable toggle) */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleToggleShift}
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

        {/* 3. TAXI FARE Quick Action Card (Gold gradient banner with taxi icon & arrow) */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleStartTaxiFare}
          style={styles.taxiFareCardOuter}
        >
          <LinearGradient
            colors={['#F59E0B', '#FBBF24', '#FCD34D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.taxiFareGradient}
          >
            {/* Left Taxi Icon Pill */}
            <View style={styles.taxiIconWrap}>
              <MaterialCommunityIcons name="taxi" size={26} color="#0F172A" />
            </View>

            {/* Text Information */}
            <View style={styles.taxiFareTextWrap}>
              <Text style={styles.taxiFareTitle}>TAXI FARE</Text>
              <Text style={styles.taxiFareSubtitle}>
                Ready to charge passengers
              </Text>
            </View>

            {/* Right Arrow Button */}
            <View style={styles.fareArrowWrap}>
              <Feather name="chevron-right" size={22} color="#0F172A" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 4. Today's Revenue Card */}
        <View style={styles.revenueCardOuter}>
          <View style={styles.revenueCardHeader}>
            <Text style={styles.revenueTitle}>Today&apos;s Revenue</Text>
            <View style={styles.tripsCountBadge}>
              <Feather name="check-circle" size={13} color="#10B981" />
              <Text style={styles.tripsCountText}>14 Trips</Text>
            </View>
          </View>

          <View style={styles.revenueDivider} />

          {/* 3 Metric Columns: Total, Card, Tap & Go */}
          <View style={styles.metricsRow}>
            {/* Total Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.metricLabel}>TOTAL</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolGold}>$</Text>485
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>14 Trips</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Card Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Feather name="credit-card" size={12} color="#0284C7" />
                <Text style={[styles.metricLabel, { color: '#0284C7' }]}>CARD</Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolBlue}>$</Text>320
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>9 txns</Text>
            </View>

            <View style={styles.columnDivider} />

            {/* Tap & Go Column */}
            <View style={styles.metricColumn}>
              <View style={styles.metricLabelRow}>
                <Feather name="zap" size={12} color="#D97706" />
                <Text style={[styles.metricLabel, { color: '#D97706' }]}>
                  TAP & GO
                </Text>
              </View>
              <Text style={styles.metricValue}>
                <Text style={styles.currencySymbolGold}>$</Text>165
                <Text style={styles.centsText}>.00</Text>
              </Text>
              <Text style={styles.metricSubtext}>5 txns</Text>
            </View>
          </View>
        </View>

        {/* 5. Start / End Shift Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={styles.shiftActionBtn}
        >
          <Feather
            name={'log-out'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.shiftActionText}>
            {isOnline ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 6. Recent Trips Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Trip Item 1 */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripIdText}>#TXN-984210</Text>
            <Text style={styles.tripTimeText}>04:45 PM</Text>
            <View style={styles.methodTag}>
              <Feather name="credit-card" size={11} color="#0284C7" />
              <Text style={styles.methodTagText}>Card</Text>
            </View>
            <View style={styles.tripSpacer} />
            <Text style={styles.tripAmount}>
              <Text style={styles.tripCurrency}>$</Text>106
              <Text style={styles.tripCents}>.00</Text>
            </Text>
          </View>

          {/* Location route route dots & addresses */}
          <View style={styles.routeContainer}>
            <View style={styles.routeLineColumn}>
              <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.routeConnector} />
              <View style={[styles.routeDot, { backgroundColor: '#F59E0B' }]} />
            </View>
            <View style={styles.addressColumn}>
              <Text style={styles.addressText} numberOfLines={1}>
                St. Jude Medical Centre
              </Text>
              <Text style={styles.addressText} numberOfLines={1}>
                42 Richmond Road
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Trip Item 2 */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.tripIdText}>#TXN-987541</Text>
            <Text style={styles.tripTimeText}>05:58 PM</Text>
            <View style={styles.methodTag}>
              <Feather name="credit-card" size={11} color="#0284C7" />
              <Text style={styles.methodTagText}>Card</Text>
            </View>
            <View style={styles.tripSpacer} />
            <Text style={styles.tripAmount}>
              <Text style={styles.tripCurrency}>$</Text>85
              <Text style={styles.tripCents}>.00</Text>
            </Text>
          </View>

          {/* Location route route dots & addresses */}
          <View style={styles.routeContainer}>
            <View style={styles.routeLineColumn}>
              <View style={[styles.routeDot, { backgroundColor: '#3B82F6' }]} />
              <View style={styles.routeConnector} />
              <View style={[styles.routeDot, { backgroundColor: '#F59E0B' }]} />
            </View>
            <View style={styles.addressColumn}>
              <Text style={styles.addressText} numberOfLines={1}>
                Melbourne Airport 2
              </Text>
              <Text style={styles.addressText} numberOfLines={1}>
                Great Central Hotel
              </Text>
            </View>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 28,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  bannerContainer: {
    width: '100%',
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
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
    alignItems: 'center',
    gap: 10,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverMetaText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  taxiNumberText: {
    color: '#D97706',
    fontWeight: '700',
  },
  dotSeparator: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  shiftStartWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftStartTime: {
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
  taxiFareCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  taxiFareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  taxiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxiFareTextWrap: {
    flex: 1,
    gap: 2,
  },
  taxiFareTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  taxiFareSubtitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  fareArrowWrap: {
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
  tripsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tripsCountText: {
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
  metricLabel: {
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
  shiftActionBtn: {
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
  shiftActionText: {
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
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  tripTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  tripSpacer: {
    flex: 1,
  },
  tripAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  tripCurrency: {
    color: '#D97706',
    fontSize: 14,
    fontWeight: '700',
  },
  tripCents: {
    fontSize: 12,
    color: '#64748B',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  routeLineColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#CBD5E1',
    marginVertical: 2,
  },
  addressColumn: {
    flex: 1,
    gap: 8,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
  },
});

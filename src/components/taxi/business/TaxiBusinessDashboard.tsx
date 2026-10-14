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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

interface DriverItem {
  id: string;
  name: string;
  taxiNo: string;
  dcNumber: string;
  isOnline: boolean;
  activeShiftRev: string;
  paidShifts: number;
  unpaidShifts: number;
  avatar: any;
}

const MOCK_DRIVERS: DriverItem[] = [
  {
    id: 'drv_01',
    name: 'Lovedeep Khangura',
    taxiNo: 'M6061',
    dcNumber: '93821048',
    isOnline: true,
    activeShiftRev: '108.00',
    paidShifts: 2,
    unpaidShifts: 0,
    avatar: require('../../../../assets/emp_avatar_1.png'),
  },
  {
    id: 'drv_02',
    name: 'Harpreet Singh',
    taxiNo: 'M6022',
    dcNumber: '58745896',
    isOnline: true,
    activeShiftRev: '127.00',
    paidShifts: 1,
    unpaidShifts: 1,
    avatar: require('../../../../assets/emp_avatar_2.png'),
  },
  {
    id: 'drv_03',
    name: 'David Miller',
    taxiNo: 'M6088',
    dcNumber: '59187425',
    isOnline: true,
    activeShiftRev: '54.00',
    paidShifts: 1,
    unpaidShifts: 0,
    avatar: require('../../../../assets/emp_avatar_4.png'),
  },
  {
    id: 'drv_04',
    name: 'Navjot Sandhu',
    taxiNo: 'M6015',
    dcNumber: '44102938',
    isOnline: false,
    activeShiftRev: '0.00',
    paidShifts: 3,
    unpaidShifts: 0,
    avatar: require('../../../../assets/emp_avatar_3.png'),
  },
];

interface TaxiBusinessDashboardProps {
  businessName?: string;
  userName?: string;
  taxiNumber?: string;
  sessionStartTime?: string;
}

export default function TaxiBusinessDashboard({
  businessName = 'Elite Taxi Service',
  userName = 'Lovedeep Khangura',
  taxiNumber = 'M6061',
  sessionStartTime = '7:30 AM',
}: TaxiBusinessDashboardProps) {
  const router = useRouter();

  // Shift & Online state (defaults to on shift)
  const [isOnShift, setIsOnShift] = useState(true);
  const [filterMode, setFilterMode] = useState<'on_shift' | 'off_shift'>('on_shift');

  const onShiftCount = MOCK_DRIVERS.filter((d) => d.isOnline).length;
  const offShiftCount = MOCK_DRIVERS.filter((d) => !d.isOnline).length;

  const filteredDrivers = MOCK_DRIVERS.filter((d) =>
    filterMode === 'on_shift' ? d.isOnline : !d.isOnline
  );

  const handleStartTaxiFare = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    Alert.alert(
      isOnShift ? 'End Shift' : 'Start Shift',
      isOnShift
        ? 'Are you sure you want to end your current active shift? Total fares ($485.00) will be submitted to records.'
        : 'Start a new active shift for vehicle ' + taxiNumber + '?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOnShift ? 'End Shift' : 'Start Shift',
          style: isOnShift ? 'destructive' : 'default',
          onPress: () => setIsOnShift((prev) => !prev),
        },
      ]
    );
  };

  const handleViewDriver = (driver: DriverItem) => {
    Alert.alert(
      driver.name,
      `Taxi Plate: ${driver.taxiNo}\nDriver Credential: DC ${driver.dcNumber}\nStatus: ${driver.isOnline ? 'Online (Active Shift)' : 'Offline'}\nActive Shift Revenue: $${driver.activeShiftRev}\nPaid Shifts: ${driver.paidShifts}\nUnpaid Shifts: ${driver.unpaidShifts}`,
      [{ text: 'Close' }]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar without back icon */}
      <HeaderBar title="SE PAY DASHBOARD" />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hero Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../../../assets/elite_taxi_hero.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* Bottom-left row: Avatar + Translucent Text Badge */}
          <View style={styles.bannerBottomRow}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>ET</Text>
            </View>

            {/* Translucent Text Badge */}
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

        {/* 2. Welcome Card */}
        <View style={styles.welcomeCard}>
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
                <Feather name="clock" size={13} color="#64748B" style={styles.clockIcon} />
                <Text style={styles.shiftStartText}>Shift Start: {sessionStartTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.activeShiftRow}>
            <Text style={styles.activeShiftLabel}>
              ACTIVE SHIFT: <Text style={styles.activeShiftCode}>26062021/M6061/537384</Text>
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

        {/* 3. TAXI FARE Big Golden Card (Only visible when On Shift) */}
        {isOnShift && (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleStartTaxiFare}
            style={styles.taxiFareCard}
          >
            <LinearGradient
              colors={['#F59E0B', '#FBBF24', '#FCD34D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.taxiFareGradient}
            >
              {/* Left Taxi Icon Box */}
              <View style={styles.taxiIconWrap}>
                <MaterialCommunityIcons name="taxi" size={28} color="#0F172A" />
              </View>

              {/* Text Information */}
              <View style={styles.taxiFareTextWrap}>
                <Text style={styles.taxiFareTitle}>TAXI FARE</Text>
                <Text style={styles.taxiFareSubtitle}>Ready to charge passengers</Text>
              </View>

              {/* Right Circular Arrow */}
              <View style={styles.fareArrowCircle}>
                <Feather name="chevron-right" size={22} color="#0F172A" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 4. Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueTitleRow}>
              <Text style={styles.revenueMainTitle}>Revenue </Text>
              <Text style={styles.revenueSubTitle}>Last 7 days</Text>
            </View>
            <View style={styles.tripsCountBadge}>
              <Ionicons name="checkmark-circle-outline" size={17} color="#059669" />
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
                <Text style={{ color: '#D97706', fontWeight: '800' }}>$</Text>485
                <Text style={styles.metricCents}>.00</Text>
              </Text>
              <Text style={styles.metricSubInfo}>14 Trips</Text>
            </View>

            {/* 2. Card */}
            <View style={styles.metricCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="card" size={13} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={[styles.metricLabelText, { color: '#2563EB' }]}>CARD</Text>
              </View>
              <Text style={styles.metricValueText}>
                <Text style={{ color: '#2563EB', fontWeight: '800' }}>$</Text>320
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
                <Text style={{ color: '#EA580C', fontWeight: '800' }}>$</Text>165
                <Text style={styles.metricCents}>.00</Text>
              </Text>
              <Text style={styles.metricSubInfo}>5 txns</Text>
            </View>
          </View>
        </View>

        {/* 5. End Shift Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={styles.shiftButton}
        >
          <MaterialCommunityIcons
            name={isOnShift ? 'logout' : 'login'}
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.shiftButtonText}>
            {isOnShift ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 6. Active Drivers Section */}
        <View style={styles.driversSection}>
          <View style={styles.driversHeaderRow}>
            <View style={styles.driversTitleWrap}>
              <Text style={styles.driversMainTitle}>Active Drivers</Text>
              <View style={styles.totalDriversBadge}>
                <Text style={styles.totalDriversText}>4 Total</Text>
              </View>
            </View>

            {/* Filter Toggle Pills */}
            <View style={styles.filtersWrap}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'on_shift'
                    ? styles.filterPillActiveOn
                    : styles.filterPillInactive,
                ]}
                activeOpacity={0.7}
                onPress={() => setFilterMode('on_shift')}
              >
                <View
                  style={[
                    styles.filterDot,
                    filterMode === 'on_shift' ? styles.filterDotActive : styles.filterDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.filterText,
                    filterMode === 'on_shift'
                      ? styles.filterTextActiveOn
                      : styles.filterTextInactive,
                  ]}
                >
                  On Shift {onShiftCount}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterMode === 'off_shift'
                    ? styles.filterPillActiveOff
                    : styles.filterPillInactive,
                ]}
                activeOpacity={0.7}
                onPress={() => setFilterMode('off_shift')}
              >
                <Text
                  style={[
                    styles.filterText,
                    filterMode === 'off_shift'
                      ? styles.filterTextActiveOff
                      : styles.filterTextInactive,
                  ]}
                >
                  Off Shift {offShiftCount}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Driver List Cards */}
          <View style={styles.driversList}>
            {filteredDrivers.map((driver) => (
              <View key={driver.id} style={styles.driverCard}>
                {/* Top Row: Avatar + Info + Shift Rev */}
                <View style={styles.driverTopRow}>
                  <Image source={driver.avatar} style={styles.driverAvatar} />

                  <View style={styles.driverInfoCol}>
                    <View style={styles.driverNameRow}>
                      <Text style={styles.driverNameText}>{driver.name}</Text>
                      <View
                        style={[
                          styles.driverOnlinePill,
                          !driver.isOnline && styles.driverOfflinePill,
                        ]}
                      >
                        <View
                          style={[
                            styles.driverStatusDot,
                            !driver.isOnline && styles.driverOfflineDot,
                          ]}
                        />
                        <Text
                          style={[
                            styles.driverOnlineText,
                            !driver.isOnline && styles.driverOfflineText,
                          ]}
                        >
                          {driver.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.driverPlateDC}>
                      Taxi No.: <Text style={styles.plateHighlight}>{driver.taxiNo}</Text>
                      {'  |  '}DC {driver.dcNumber}
                    </Text>
                  </View>

                  <View style={styles.driverRevCol}>
                    <Text style={styles.driverRevLabel}>ACTIVE SHIFT REV</Text>
                    <Text style={styles.driverRevAmount}>
                      <Text style={styles.revDollarSign}>$</Text>
                      {driver.activeShiftRev.split('.')[0]}
                      <Text style={styles.revCents}>.{driver.activeShiftRev.split('.')[1] || '00'}</Text>
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Shifts & View Button */}
                <View style={styles.driverBottomRow}>
                  <Text style={styles.shiftsLabel}>Shifts:</Text>

                  {/* Paid Shifts badge */}
                  <View style={styles.paidShiftsBadge}>
                    <Text style={styles.paidShiftsText}>
                      Paid: {driver.paidShifts} {driver.paidShifts === 1 ? 'Shift' : 'Shifts'}
                    </Text>
                  </View>

                  {/* Unpaid Shifts badge */}
                  {driver.unpaidShifts > 0 ? (
                    <View style={styles.unpaidShiftsActiveBadge}>
                      <Text style={styles.unpaidShiftsActiveText}>
                        Unpaid: {driver.unpaidShifts} {driver.unpaidShifts === 1 ? 'Shift' : 'Shifts'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unpaidShiftsZeroBadge}>
                      <Text style={styles.unpaidShiftsZeroText}>Unpaid: 0</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }} />

                  {/* View > Button */}
                  <TouchableOpacity
                    style={styles.viewButton}
                    activeOpacity={0.7}
                    onPress={() => handleViewDriver(driver)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                    <Feather name="chevron-right" size={13} color="#2563EB" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  bannerContainer: {
    width: '100%',
    height: 146,
    borderRadius: 16,
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
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
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
  taxiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taxiFareTextWrap: {
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
  fareArrowCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(254, 240, 138, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  driversSection: {
    marginTop: 4,
  },
  driversHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  driversTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driversMainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 8,
  },
  totalDriversBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  totalDriversText: {
    color: '#92400E',
    fontSize: 9.5,
    fontWeight: '700',
  },
  filtersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  filterPillActiveOn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  filterPillActiveOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
  },
  filterPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  filterDotActive: {
    backgroundColor: '#10B981',
  },
  filterDotInactive: {
    backgroundColor: '#94A3B8',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  filterTextActiveOn: {
    color: '#065F46',
    fontWeight: '700',
  },
  filterTextActiveOff: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterTextInactive: {
    color: '#64748B',
  },
  driversList: {
    gap: 10,
  },
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  driverTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#F1F5F9',
  },
  driverInfoCol: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  driverNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  driverOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  driverOfflinePill: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  driverStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  driverOfflineDot: {
    backgroundColor: '#94A3B8',
  },
  driverOnlineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  driverOfflineText: {
    color: '#64748B',
  },
  driverPlateDC: {
    fontSize: 10,
    color: '#64748B',
  },
  plateHighlight: {
    color: '#D97706',
    fontWeight: '700',
  },
  driverRevCol: {
    alignItems: 'flex-end',
  },
  driverRevLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  driverRevAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  revDollarSign: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 12,
  },
  revCents: {
    fontSize: 9.5,
    color: '#475569',
  },
  driverBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: 6,
  },
  shiftsLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  paidShiftsBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  paidShiftsText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#047857',
  },
  unpaidShiftsActiveBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  unpaidShiftsActiveText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#B45309',
  },
  unpaidShiftsZeroBadge: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  unpaidShiftsZeroText: {
    fontSize: 9.5,
    fontWeight: '500',
    color: '#64748B',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  viewButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
});

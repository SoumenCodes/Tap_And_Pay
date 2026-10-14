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

interface OtherBusinessDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
  empId?: string;
}

interface EmployeeShiftData {
  id: string;
  name: string;
  empId: string;
  avatar: any;
  isOnline: boolean;
  isOnShift: boolean;
  activeShiftRev: string;
  paidShiftsCount: number;
  unpaidShiftsCount: number;
  isCurrentUser?: boolean;
}

const MOCK_SALON_EMPLOYEES: EmployeeShiftData[] = [
  {
    id: 'emp_01',
    name: 'Soumen Sen',
    empId: '93821048',
    avatar: require('../../../../assets/emp_avatar_1.png'),
    isOnline: true,
    isOnShift: true,
    activeShiftRev: '108.00',
    paidShiftsCount: 2,
    unpaidShiftsCount: 0,
    isCurrentUser: true,
  },
  {
    id: 'emp_02',
    name: 'Liam Hemsworth',
    empId: '93822048',
    avatar: require('../../../../assets/emp_avatar_2.png'),
    isOnline: true,
    isOnShift: true,
    activeShiftRev: '127.00',
    paidShiftsCount: 1,
    unpaidShiftsCount: 1,
  },
  {
    id: 'emp_04',
    name: 'Jack Robinson',
    empId: '93823048',
    avatar: require('../../../../assets/emp_avatar_4.png'),
    isOnline: true,
    isOnShift: true,
    activeShiftRev: '54.00',
    paidShiftsCount: 1,
    unpaidShiftsCount: 0,
  },
  {
    id: 'emp_03',
    name: 'Sarah Jenkins',
    empId: '93824048',
    avatar: require('../../../../assets/emp_avatar_3.png'),
    isOnline: false,
    isOnShift: false,
    activeShiftRev: '0.00',
    paidShiftsCount: 3,
    unpaidShiftsCount: 0,
  },
];

type EmployeeFilterMode = 'all' | 'on_shift' | 'off_shift';

export default function OtherBusinessDashboard({
  businessName = 'Crown Cuts',
  userName = 'Soumen Sen',
  sessionStartTime = '7:30 AM',
  empId = '93821048',
}: OtherBusinessDashboardProps) {
  const router = useRouter();

  const [isOnShift, setIsOnShift] = useState(true);
  const [filterMode, setFilterMode] = useState<EmployeeFilterMode>('on_shift');

  const onShiftCount = MOCK_SALON_EMPLOYEES.filter((e) => e.isOnShift).length;
  const offShiftCount = MOCK_SALON_EMPLOYEES.filter((e) => !e.isOnShift).length;
  const totalCount = MOCK_SALON_EMPLOYEES.length;

  const filteredEmployees = MOCK_SALON_EMPLOYEES.filter((e) => {
    if (filterMode === 'on_shift') return e.isOnShift;
    if (filterMode === 'off_shift') return !e.isOnShift;
    return true;
  });

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleShift = () => {
    if (isOnShift) {
      Alert.alert(
        'End Shift',
        'Are you sure you want to end your current active shift (26062021/93821048/537384)?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Shift',
            style: 'destructive',
            onPress: () => {
              setIsOnShift(false);
              Alert.alert('Shift Ended', 'Shift tally submitted to records.');
            },
          },
        ]
      );
    } else {
      setIsOnShift(true);
      Alert.alert('Shift Started', 'Active on shift. Ready to accept sales.');
    }
  };

  const handleNavigateToTransactions = (empId?: string) => {
    router.push({
      pathname: '/(tabs)/transactions',
      params: empId ? { empId } : undefined,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title="SE PAY DASHBOARD"

      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
                SHIFT: {isOnShift ? 'Active' : 'Start Shift Now!'}
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

          {/* Bottom row: Active Shift ID + On Shift badge */}
          <View style={styles.activeShiftRow}>
            <Text style={styles.activeShiftLabel}>
              ACTIVE SHIFT: <Text style={styles.activeShiftCode}>26062021/93821048/537384</Text>
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

        {/* 4. Revenue Card: Last 7 days */}
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

        {/* 5. End Shift Action Button (Black) */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleToggleShift}
          style={[
            styles.shiftButton,
            !isOnShift && styles.startShiftButton,
          ]}
        >
          <Feather
            name={isOnShift ? 'log-out' : 'log-in'}
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.shiftButtonText}>
            {isOnShift ? 'End Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>

        {/* 6. Active Employee Section */}
        <View style={styles.employeesSection}>
          <View style={styles.employeesHeaderRow}>
            <View style={styles.employeesTitleWrap}>
              <Text style={styles.employeesMainTitle}>Active Employee</Text>
              <TouchableOpacity
                onPress={() => setFilterMode('all')}
                activeOpacity={0.7}
                style={[
                  styles.totalEmployeesBadge,
                  filterMode === 'all' && styles.totalEmployeesBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.totalEmployeesText,
                    filterMode === 'all' && styles.totalEmployeesTextActive,
                  ]}
                >
                  {totalCount} Total
                </Text>
              </TouchableOpacity>
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

          {/* Employee List Cards */}
          <View style={styles.employeesList}>
            {filteredEmployees.map((employee) => (
              <TouchableOpacity
                key={employee.id}
                style={[
                  styles.employeeCard,
                  employee.isCurrentUser && styles.employeeCardCurrent,
                ]}
                activeOpacity={0.8}
                onPress={() => handleNavigateToTransactions(employee.empId)}
              >
                {/* Avatar + Info + Shift Rev */}
                <View style={styles.employeeTopRow}>
                  <Image source={employee.avatar} style={styles.employeeAvatar} />

                  <View style={styles.employeeInfoCol}>
                    <View style={styles.employeeNameRow}>
                      <Text style={styles.employeeNameText}>{employee.name}</Text>
                      <View
                        style={[
                          styles.employeeOnlinePill,
                          !employee.isOnline && styles.employeeOfflinePill,
                        ]}
                      >
                        <View
                          style={[
                            styles.employeeStatusDot,
                            !employee.isOnline && styles.employeeOfflineDot,
                          ]}
                        />
                        <Text
                          style={[
                            styles.employeeOnlineText,
                            !employee.isOnline && styles.employeeOfflineText,
                          ]}
                        >
                          {employee.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.employeeEmpId}>
                      EMP ID: <Text style={styles.empIdValue}>{employee.empId}</Text>
                    </Text>
                  </View>

                  <View style={styles.employeeRevCol}>
                    <Text style={styles.employeeRevLabel}>ACTIVE SHIFT REV</Text>
                    <Text style={styles.employeeRevAmount}>
                      <Text style={styles.revDollarSign}>$</Text>
                      {employee.activeShiftRev.split('.')[0]}
                      <Text style={styles.revCents}>
                        .{employee.activeShiftRev.split('.')[1] || '00'}
                      </Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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

  /* 1. Hero Banner */
  bannerContainer: {
    width: '100%',
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
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
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    padding: 3,
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

  /* 2. Welcome Card */
  welcomeCardOuter: {
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopStripe: {
    height: 3,
    width: '100%',
  },
  welcomeCardInner: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  welcomeTitle: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '400',
    marginBottom: 4,
  },
  userNameText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  welcomeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '700',
    color: '#0F172A',
  },
  activeShiftCode: {
    fontWeight: '600',
    color: '#334155',
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

  /* 3. CREATE SALE Quick Action Card */
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

  /* 4. Revenue Card */
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

  /* 5. End Shift Action Button */
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
  startShiftButton: {
    backgroundColor: '#16A34A',
  },
  shiftButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* 6. Active Employee Section */
  employeesSection: {
    marginTop: 2,
  },
  employeesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  employeesTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  employeesMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalEmployeesBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totalEmployeesBadgeActive: {
    backgroundColor: '#FDE68A',
  },
  totalEmployeesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  totalEmployeesTextActive: {
    color: '#78350F',
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
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  filterPillActiveOn: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  filterPillActiveOff: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  filterPillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterDotActive: {
    backgroundColor: '#15803D',
  },
  filterDotInactive: {
    backgroundColor: '#94A3B8',
  },
  filterText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  filterTextActiveOn: {
    color: '#166534',
  },
  filterTextActiveOff: {
    color: '#475569',
  },
  filterTextInactive: {
    color: '#64748B',
  },

  /* Employee Cards */
  employeesList: {
    gap: 10,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  employeeCardCurrent: {
    borderColor: '#FBBF24',
    borderWidth: 1.2,
    backgroundColor: '#FFFDF9',
  },
  employeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    marginRight: 10,
  },
  employeeInfoCol: {
    flex: 1,
  },
  employeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  employeeNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  employeeOnlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  employeeOfflinePill: {
    backgroundColor: '#F1F5F9',
  },
  employeeStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#15803D',
  },
  employeeOfflineDot: {
    backgroundColor: '#94A3B8',
  },
  employeeOnlineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#166534',
  },
  employeeOfflineText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  employeeEmpId: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  empIdValue: {
    color: '#D97706',
    fontWeight: '700',
  },
  employeeRevCol: {
    alignItems: 'flex-end',
  },
  employeeRevLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  employeeRevAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  revDollarSign: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  revCents: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Bottom Row in Employee Card */
  employeeBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shiftsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftsLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginRight: 2,
  },
  paidShiftsPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  paidShiftsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  unpaidShiftsPill: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  unpaidShiftsPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  unpaidShiftsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  unpaidShiftsTextActive: {
    color: '#B45309',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
});

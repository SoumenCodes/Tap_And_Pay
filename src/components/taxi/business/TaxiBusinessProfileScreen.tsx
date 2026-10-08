import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';

export default function TaxiBusinessProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const businessName = user.businessName || 'Elite Taxi Fleet';
  const userName = user.name || 'Lovedeep Khangura (Fleet Admin)';

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
      <HeaderBar title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Profile Summary Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrap}>
              <Text style={styles.initialsText}>ET</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={18} color="#2563EB" />
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>FLEET OPERATOR & ADMIN</Text>
          </View>
          <Text style={styles.businessTitle}>{businessName}</Text>
          <Text style={styles.fleetInfo}>Licensed Dispatch Network • 12 Active Cabs</Text>

          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>$3,420</Text>
              <Text style={styles.statLabel}>Fleet Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>12</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: '#059669' }]}>10 Active</Text>
              <Text style={styles.statLabel}>Shifts Live</Text>
            </View>
          </View>
        </View>

        {/* Fleet Administration Tools */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Fleet Management</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="bar-chart-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Fleet Shift Records & Audit</Text>
                <Text style={styles.menuSub}>Consolidated driver shifts and meter reports</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Driver Roster',
                  '12 Active Drivers Registered:\n• Gurpreet Singh (M6061) - Shift Active\n• Harpreet Gill (M4022) - Shift Active\n• Navjot Sandhu (M3188) - On Break\n+ 9 more drivers'
                )
              }
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="people-outline" size={18} color="#D97706" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Drivers & Roster Assignment</Text>
                <Text style={styles.menuSub}>Assign vehicles to driver shifts</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Fleet Settlement',
                  'Commercial Settlement Account:\nNational Australia Bank (NAB)\nEntity: Elite Taxi Fleet Services Pty Ltd\nBSB: 083-170\nAccount: •••• 3901\nDirect BACS Settlement Schedule: Daily 11:59 PM'
                )
              }
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="business-outline" size={18} color="#059669" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Fleet Payout & Settlement Account</Text>
                <Text style={styles.menuSub}>Commercial merchant banking</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Logout */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>App & Account</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert('Support', 'Fleet Priority Line: 1300 ELITE TAXI')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                <Feather name="headphones" size={18} color="#475569" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Fleet Enterprise Support</Text>
                <Text style={styles.menuSub}>24/7 dedicated dispatch help</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.lastMenuItem]}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="log-out" size={18} color="#DC2626" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Log Out</Text>
                <Text style={styles.menuSub}>Switch account or logout</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  initialsText: {
    color: '#FBBF24',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleBadgeText: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  businessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  fleetInfo: {
    fontSize: 11,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextBox: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});

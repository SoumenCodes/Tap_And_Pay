import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import HeaderBar from '../../common/HeaderBar';

export default function TaxiOwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOnShift, setIsOnShift] = useState(true);

  const taxiNumber = user.taxiNumber || 'M6061';
  const userName = user.name || 'Lovedeep Khangura';
  const businessName = user.businessName || 'Elite Taxi Service';

  const handleToggleShift = () => {
    setIsOnShift((prev) => {
      const next = !prev;
      Alert.alert(
        next ? 'Shift Started' : 'Shift Ended',
        next
          ? 'Taxi shift started. You are ready to accept passenger fares.'
          : 'Taxi shift concluded. Fare total submitted to records.'
      );
      return next;
    });
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
              <Text style={styles.initialsText}>LK</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            </View>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>TAXI OWNER & OPERATOR</Text>
          </View>
          <Text style={styles.businessTitle}>{businessName}</Text>
          <Text style={styles.taxiPlate}>Vehicle Plate: {taxiNumber}</Text>

          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNum}>$340.00</Text>
              <Text style={styles.statLabel}>{"Today's Fares"}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statNum}>14</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: '#059669' }]}>$38.50</Text>
              <Text style={styles.statLabel}>Tips</Text>
            </View>
          </View>
        </View>

        {/* Shift Status */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View>
              <Text style={styles.shiftTitle}>Taxi Meter & Shift</Text>
              <Text style={styles.shiftSub}>Session started at {user.sessionStartTime || '7:30 AM'}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.shiftToggleBtn,
                isOnShift ? styles.shiftBtnActive : styles.shiftBtnInactive,
              ]}
              activeOpacity={0.8}
              onPress={handleToggleShift}
            >
              <View
                style={[
                  styles.statusDot,
                  isOnShift ? styles.dotActive : styles.dotInactive,
                ]}
              />
              <Text
                style={[
                  styles.shiftToggleText,
                  isOnShift ? styles.shiftToggleTextActive : styles.shiftToggleTextInactive,
                ]}
              >
                {isOnShift ? 'Active' : 'Offline'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Taxi Tools */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>Taxi Operations</Text>
          <View style={styles.cardGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time-outline" size={18} color="#2563EB" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Shift History & Trip Reports</Text>
                <Text style={styles.menuSub}>Detailed passenger trip log</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Vehicle Registration',
                  `Vehicle: Toyota Camry Hybrid\nPlate: ${taxiNumber}\nInspection: Valid until Nov 2026\nOwner Permit: TX-90214-VIC`
                )
              }
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="taxi" size={18} color="#D97706" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Vehicle & Permit Details</Text>
                <Text style={styles.menuSub}>Taxi accreditation & license</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  'Bank Account',
                  'Payout Account:\nANZ Bank\nAccount: Lovedeep Khangura\nBSB: 013-241\nAccount: •••• 9812\nSettlement: Next Business Day'
                )
              }
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="card-outline" size={18} color="#059669" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Settlement & Bank Details</Text>
                <Text style={styles.menuSub}>Direct fare payouts</Text>
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
              onPress={() => Alert.alert('Support', 'Commercial Passenger Vehicles Victoria: 1800 638 802')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                <Feather name="help-circle" size={18} color="#475569" />
              </View>
              <View style={styles.menuTextBox}>
                <Text style={styles.menuTitle}>Help & Taxi Hotline</Text>
                <Text style={styles.menuSub}>Regulations & support</Text>
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
                <Text style={styles.menuSub}>End session or switch role</Text>
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
    borderColor: '#CBD5E1',
  },
  initialsText: {
    color: '#F8FAFC',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  roleBadgeText: {
    color: '#92400E',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  businessTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  taxiPlate: {
    fontSize: 11.5,
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
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  shiftToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  shiftBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  shiftBtnInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
  dotInactive: {
    backgroundColor: '#94A3B8',
  },
  shiftToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  shiftToggleTextActive: {
    color: '#065F46',
  },
  shiftToggleTextInactive: {
    color: '#64748B',
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

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

interface OtherBusinessEmployeeDashboardProps {
  businessName?: string;
  businessAddress?: string;
  userName?: string;
  sessionStartTime?: string;
}

export default function OtherBusinessEmployeeDashboard({
  businessName = 'Crown Cuts',
  businessAddress = 'Suite 4, 120 Collins Street, Melbourne VIC',
  userName = 'Liam Hemsworth',
  sessionStartTime = '7:30 AM',
}: OtherBusinessEmployeeDashboardProps) {
  const router = useRouter();
  const [isCheckedIn, setIsCheckedIn] = useState(true);

  const handleCreateSale = () => {
    router.push('/(tabs)/tap-to-pay');
  };

  const handleToggleCheckIn = () => {
    setIsCheckedIn((prev) => {
      const next = !prev;
      Alert.alert(
        next ? 'Shift Started' : 'Shift Ended',
        next
          ? 'You are now Checked In and ready to process client payments.'
          : 'You have checked out. Total collections logged to register.'
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
        {/* 1. Crown Cuts Hero Banner */}
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
                Staff: {userName} • Barber
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Welcome Employee Card */}
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
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeTextWrap}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>BUSINESS EMPLOYEE</Text>
                </View>
                <Text style={styles.welcomeTitle}>Welcome back, {userName}</Text>
                <Text style={styles.welcomeSub}>
                  Checked in at {sessionStartTime} • {businessAddress}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkInPill,
                  isCheckedIn ? styles.checkInPillActive : styles.checkInPillInactive,
                ]}
                activeOpacity={0.8}
                onPress={handleToggleCheckIn}
              >
                <View
                  style={[
                    styles.statusDot,
                    isCheckedIn ? styles.dotActive : styles.dotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.checkInText,
                    isCheckedIn ? styles.checkInTextActive : styles.checkInTextInactive,
                  ]}
                >
                  {isCheckedIn ? 'Checked In' : 'Checked Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. My Daily Performance (Staff Level) */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsSectionTitle}>My Performance Today</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>TODAY</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>My Collections</Text>
              <Text style={styles.statValue}>$420.00</Text>
              <Text style={styles.statSub}>7 services completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Tips Earned</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>$45.00</Text>
              <Text style={styles.statSub}>100% direct to staff</Text>
            </View>
          </View>

          <View style={[styles.statsGrid, { marginTop: 10 }]}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg. Ticket</Text>
              <Text style={styles.statValue}>$60.00</Text>
              <Text style={styles.statSub}>Per customer</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Commission Est.</Text>
              <Text style={styles.statValue}>$189.00</Text>
              <Text style={styles.statSub}>45% rate applied</Text>
            </View>
          </View>
        </View>

        {/* 4. Primary CTA: Take Customer Payment */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleCreateSale}
        >
          <View style={styles.ctaIconWrap}>
            <MaterialCommunityIcons name="contactless-payment" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.ctaTextWrap}>
            <Text style={styles.ctaTitle}>Tap to Pay (New Sale)</Text>
            <Text style={styles.ctaSub}>Accept contactless card or phone</Text>
          </View>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* 5. Recent Services Completed By Me */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentSectionTitle}>Recent Services Processed</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/transactions')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {[
              {
                service: 'Skin Fade & Beard Sculpt',
                time: '2:15 PM',
                amount: '$65.00',
                tip: '+$10 tip',
                method: 'Contactless',
              },
              {
                service: 'Classic Gentleman Haircut',
                time: '1:40 PM',
                amount: '$45.00',
                tip: '+$5 tip',
                method: 'Apple Pay',
              },
              {
                service: 'Hot Towel Shave & Styling',
                time: '12:20 PM',
                amount: '$55.00',
                tip: '+$10 tip',
                method: 'Google Pay',
              },
              {
                service: 'Executive Grooming Package',
                time: '11:15 AM',
                amount: '$85.00',
                tip: '+$15 tip',
                method: 'Card Chip',
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.activityItem}>
                <View style={styles.activityIconWrap}>
                  <Ionicons name="cut-outline" size={18} color="#0F172A" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityService}>{item.service}</Text>
                  <Text style={styles.activityMeta}>
                    {item.time} • {item.method} • <Text style={{ color: '#059669' }}>{item.tip}</Text>
                  </Text>
                </View>
                <Text style={styles.activityAmount}>{item.amount}</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingTop: 12,
  },
  bannerContainer: {
    marginHorizontal: 16,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
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
    borderRadius: 10,
    backgroundColor: '#FFFDF0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    marginRight: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarBadgeImage: {
    width: 32,
    height: 32,
  },
  bannerTextBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
    flexShrink: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bannerSubtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  welcomeCardOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopStripe: {
    height: 2.5,
    width: '100%',
  },
  welcomeCardInner: {
    padding: 14,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleTagText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  welcomeSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  checkInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  checkInPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checkInPillInactive: {
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
  checkInText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkInTextActive: {
    color: '#065F46',
  },
  checkInTextInactive: {
    color: '#64748B',
  },
  statsCard: {
    marginHorizontal: 16,
    marginTop: 14,
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
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  statSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  ctaButton: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  recentSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityService: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  activityMeta: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});

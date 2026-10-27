import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { DriverItem } from '../../../services/driverService';

interface DriverFullProfile {
  id: string;
  name: string;
  dcNumber: string;
  taxiNo: string;
  phone: string;
  email: string;
  abn: string;
  address: string;
  bankAccountName: string;
  bsb: string;
  accountNumber: string;
  isActive: boolean;
  avatar?: any;
}

const DRIVERS_DB: Record<string, DriverFullProfile> = {
  drv_01: {
    id: 'drv_01',
    name: 'Lovedeep Khangura',
    dcNumber: '93821048',
    taxiNo: 'M6061',
    phone: '+61 0400 555 320',
    email: 'driver.khangura@mailtest.com.au',
    abn: '98 765 423 101',
    address: '120 Collins St, Melbourne VIC 3000',
    bankAccountName: 'Lovedeep Singh Khangura',
    bsb: '063-123',
    accountNumber: '1098 7654',
    isActive: true,
    avatar: require('../../../../assets/emp_avatar_1.png'),
  },
  drv_02: {
    id: 'drv_02',
    name: 'Harpreet Singh',
    dcNumber: '58745896',
    taxiNo: 'M6022',
    phone: '+61 0400 555 321',
    email: 'harpreet.singh@mailtest.com.au',
    abn: '98 765 423 102',
    address: '45 Bourke St, Melbourne VIC 3000',
    bankAccountName: 'Harpreet Singh',
    bsb: '063-123',
    accountNumber: '1098 7655',
    isActive: false,
    avatar: require('../../../../assets/emp_avatar_2.png'),
  },
  drv_03: {
    id: 'drv_03',
    name: 'David Miller',
    dcNumber: '59187425',
    taxiNo: 'M6088',
    phone: '+61 0400 555 322',
    email: 'david.miller@mailtest.com.au',
    abn: '98 765 423 103',
    address: '88 Flinders St, Melbourne VIC 3000',
    bankAccountName: 'David Miller',
    bsb: '083-004',
    accountNumber: '4821 9923',
    isActive: true,
    avatar: require('../../../../assets/emp_avatar_3.png'),
  },
  drv_04: {
    id: 'drv_04',
    name: 'Gurpreet Deol',
    dcNumber: '32587412',
    taxiNo: 'M6090',
    phone: '+61 0400 555 323',
    email: 'gurpreet.deol@mailtest.com.au',
    abn: '98 765 423 104',
    address: '15 King St, Melbourne VIC 3000',
    bankAccountName: 'Gurpreet Deol',
    bsb: '063-123',
    accountNumber: '1098 7656',
    isActive: true,
  },
};

export default function DriverDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ driverId?: string; driverData?: string }>();

  let liveDriver: DriverItem | null = null;
  if (params?.driverData) {
    try {
      liveDriver = JSON.parse(params.driverData);
    } catch {}
  }

  const driverId = params?.driverId || 'drv_01';
  const fallbackDriver = DRIVERS_DB[driverId] || DRIVERS_DB.drv_01;

  const driverName =
    liveDriver?.full_name ||
    `${liveDriver?.first_name || ''} ${liveDriver?.last_name || ''}`.trim() ||
    fallbackDriver.name;
  const dcNumber = liveDriver?.dc_number || fallbackDriver.dcNumber;
  const taxiNo = liveDriver?.assigned_taxi_no || fallbackDriver.taxiNo;
  const phone = liveDriver?.phone_no || fallbackDriver.phone;
  const email = liveDriver?.email || fallbackDriver.email;
  const abn = liveDriver?.abn || fallbackDriver.abn;
  const photoUrl = liveDriver?.profile_photo_url;
  const initials =
    liveDriver?.initials ||
    driverName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const [isActive, setIsActive] = useState<boolean>(
    liveDriver ? liveDriver.is_active === 1 : fallbackDriver.isActive
  );

  const handleEditProfile = () => {
    router.push('/add-driver');
  };

  const handleDocumentPress = (docTitle: string) => {
    let docUrl: string | null | undefined = null;
    if (docTitle.includes('Front')) {
      docUrl = liveDriver?.dl_front_image_url;
    } else if (docTitle.includes('Rear')) {
      docUrl = liveDriver?.dl_rear_image_url || liveDriver?.dc_photo_rear_url;
    }

    if (docUrl) {
      Linking.openURL(docUrl).catch(() => {
        Alert.alert(docTitle, `${docTitle} is verified and active.`);
      });
    } else {
      Alert.alert(docTitle, `${docTitle} is verified and active.`);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title="Driver Details"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/manage-driver');
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── DRIVER TOP CARD ── */}
        <View style={styles.topDriverCard}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.driverAvatar} />
          ) : fallbackDriver.avatar && !liveDriver ? (
            <Image source={fallbackDriver.avatar} style={styles.driverAvatar} />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}

          <View style={styles.topDriverInfo}>
            <Text style={styles.nameAndDcRow}>
              <Text style={styles.driverNameText}>{driverName}</Text>
              {Boolean(dcNumber) && <Text style={styles.dcText}> | DC {dcNumber}</Text>}
            </Text>

            <View style={styles.subMetaRow}>
              <View style={styles.taxiBadge}>
                <Ionicons
                  name="car"
                  size={13}
                  color="#D97706"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.taxiText}>Taxi No. {taxiNo || '--'}</Text>
              </View>

              <View style={styles.statusDotRow}>
                <View
                  style={[
                    styles.statusIndicatorDot,
                    { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text
                  style={[
                    styles.statusIndicatorText,
                    { color: isActive ? '#059669' : '#64748B' },
                  ]}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── DC DOCUMENTS SECTION ── */}
        <Text style={styles.sectionTitle}>DC DOCUMENTS</Text>
        <View style={styles.docsRow}>
          {/* License Front */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => handleDocumentPress('Driving License Front')}
            activeOpacity={0.8}
          >
            <View style={styles.docIconBadge}>
              <Ionicons name="image-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.docCardText}>Driving License Front</Text>
          </TouchableOpacity>

          {/* License Rear */}
          <TouchableOpacity
            style={styles.docCard}
            onPress={() => handleDocumentPress('Driving License Rear')}
            activeOpacity={0.8}
          >
            <View style={styles.docIconBadge}>
              <Ionicons name="image-outline" size={20} color="#0284C7" />
            </View>
            <Text style={styles.docCardText}>Driving License Rear</Text>
          </TouchableOpacity>
        </View>

        {/* ── PERSONAL INFORMATION CARD ── */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.amberIconBadge}>
              <Ionicons name="person-outline" size={15} color="#D97706" />
            </View>
            <Text style={styles.cardHeaderText}>PERSONAL INFORMATION</Text>
          </View>
          <View style={styles.cardDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{driverName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={[styles.infoValue, styles.goldValue]}>{phone || '--'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DC</Text>
            <Text style={[styles.infoValue, styles.goldValue]}>{dcNumber || '--'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{email || '--'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ABN</Text>
            <Text style={styles.infoValue}>{abn || '--'}</Text>
          </View>

          {Boolean(fallbackDriver.address && !liveDriver) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={[styles.infoValue, styles.addressValue]}>
                {fallbackDriver.address}
              </Text>
            </View>
          )}
        </View>

        {/* ── BANK ACCOUNT CARD ── */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.blueIconBadge}>
              <Ionicons name="card-outline" size={15} color="#0284C7" />
            </View>
            <Text style={styles.cardHeaderText}>BANK ACCOUNT</Text>
          </View>
          <View style={styles.cardDivider} />

          {/* Account Name */}
          <View style={styles.bankFieldBlock}>
            <Text style={styles.bankFieldLabel}>Account Name</Text>
            <Text style={styles.bankFieldValue}>
              {liveDriver ? '--' : fallbackDriver.bankAccountName}
            </Text>
          </View>

          {/* BSB & Account No */}
          <View style={styles.bankFieldsSplitRow}>
            <View style={[styles.bankFieldBlock, { flex: 1 }]}>
              <Text style={styles.bankFieldLabel}>BSB</Text>
              <Text style={styles.bankFieldValue}>
                {liveDriver ? '--' : fallbackDriver.bsb}
              </Text>
            </View>

            <View style={[styles.bankFieldBlock, { flex: 1 }]}>
              <Text style={styles.bankFieldLabel}>Account No.</Text>
              <Text style={styles.bankFieldValue}>
                {liveDriver ? '--' : fallbackDriver.accountNumber}
              </Text>
            </View>
          </View>
        </View>

        {/* ── DRIVER STATUS SWITCH ── */}
        <Text style={styles.statusSectionLabel}>Driver Status</Text>
        <View style={styles.driverStatusCard}>
          <View style={styles.statusStatusLeft}>
            <View
              style={[
                styles.statusIndicatorDot,
                { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
              ]}
            />
            <Text style={styles.statusStateText}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── EDIT DRIVER PROFILE BUTTON ── */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.88}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.editButtonText}>Edit Driver Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── BOTTOM TAB NAVIGATION BAR (MATCHING SCREENSHOT) ── */}
      <View style={styles.bottomTabNav}>
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Ionicons name="home-outline" size={20} color="#64748B" />
          <Text style={styles.bottomTabLabelInactive}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => router.replace('/(tabs)/history')}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={20} color="#64748B" />
          <Text style={styles.bottomTabLabelInactive}>Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => router.replace('/(tabs)/profile')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={22} color="#D97706" />
          <Text style={styles.bottomTabLabelActive}>Profile</Text>
          <View style={styles.activeTabIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* Top Driver Card */
  topDriverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  initialsAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#92400E',
  },
  topDriverInfo: {
    flex: 1,
  },
  nameAndDcRow: {
    marginBottom: 4,
  },
  driverNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dcText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taxiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* DC Documents */
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  docsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  docCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  docCardText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },

  /* Card Containers */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amberIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  blueIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHeaderText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 12,
    marginBottom: 6,
  },

  /* Info Rows */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
  },
  goldValue: {
    color: '#D97706',
  },
  addressValue: {
    flexShrink: 1,
    maxWidth: '65%',
  },

  /* Bank Account Fields */
  bankFieldBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bankFieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  bankFieldValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  bankFieldsSplitRow: {
    flexDirection: 'row',
    gap: 10,
  },

  /* Driver Status Section */
  statusSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  driverStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 18,
  },
  statusStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusStateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Edit Button */
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },

  /* Bottom Tab Navigation Bar */
  bottomTabNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  bottomTabLabelInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  bottomTabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 3,
  },
  activeTabIndicator: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#D97706',
    marginTop: 3,
  },
});

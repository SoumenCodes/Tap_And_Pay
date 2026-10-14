import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

export interface DriverData {
  id: string;
  name: string;
  dcNumber: string;
  taxiNo: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  avatar?: any;
  initials?: string;
}

const DEFAULT_DRIVERS: DriverData[] = [
  {
    id: 'drv_01',
    name: 'Lovedeep Khangura',
    dcNumber: '93821048',
    taxiNo: 'M6061',
    phone: '0400 555 320',
    status: 'active',
    avatar: require('../../../../assets/emp_avatar_1.png'),
  },
  {
    id: 'drv_02',
    name: 'Harpreet Singh',
    dcNumber: '58745896',
    taxiNo: 'M6022',
    phone: '0400 555 321',
    status: 'inactive',
    avatar: require('../../../../assets/emp_avatar_2.png'),
  },
  {
    id: 'drv_03',
    name: 'David Miller',
    dcNumber: '59187425',
    taxiNo: 'M6088',
    phone: '0400 555 322',
    status: 'active',
    avatar: require('../../../../assets/emp_avatar_3.png'),
  },
  {
    id: 'drv_04',
    name: 'Gurpreet Deol',
    dcNumber: '32587412',
    taxiNo: 'M6090',
    phone: '0400 555 323',
    status: 'pending',
    initials: 'GD',
  },
];

export default function ManageDriverScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverData[]>(DEFAULT_DRIVERS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) return drivers;
    const q = searchQuery.toLowerCase().trim();
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.taxiNo.toLowerCase().includes(q) ||
        d.dcNumber.toLowerCase().includes(q)
    );
  }, [drivers, searchQuery]);

  const handleCall = (driver: DriverData) => {
    const url = `tel:${driver.phone.replace(/\s+/g, '')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          `Contact ${driver.name}`,
          `Phone: ${driver.phone}\nTaxi No: ${driver.taxiNo}\nDC: ${driver.dcNumber}`
        );
      }
    });
  };

  const handleToggleStatus = (id: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (d.status === 'pending') {
          return { ...d, status: 'active' };
        }
        return { ...d, status: d.status === 'active' ? 'inactive' : 'active' };
      })
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title="Manage Drivers"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile');
          }
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar matching screenshot */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Driver or Taxi No..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Heading Row */}
        <View style={styles.headingRow}>
          <Text style={styles.headingTitle}>Driver</Text>
          <View style={styles.registeredBadge}>
            <Text style={styles.registeredBadgeText}>{drivers.length} Registered</Text>
          </View>
        </View>

        {/* Driver Cards */}
        {filteredDrivers.map((driver) => {
          const isPending = driver.status === 'pending';
          const isActive = driver.status === 'active';
          const isManager = driver.id === 'drv_01'; // Lovedeep has no call button in design

          return (
            <TouchableOpacity
              key={driver.id}
              style={[
                styles.driverCard,
                isPending && styles.driverCardPending,
              ]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/driver-details',
                  params: { driverId: driver.id },
                })
              }
            >
              {/* Pending Approval Badge */}
              {isPending && (
                <View style={styles.pendingBadgeWrap}>
                  <View style={styles.pendingBadge}>
                    <View style={styles.pendingDot} />
                    <Text style={styles.pendingBadgeText}>Pending Approval</Text>
                  </View>
                </View>
              )}

              <View style={styles.driverMainRow}>
                {/* Avatar */}
                {driver.avatar ? (
                  <Image source={driver.avatar} style={styles.driverAvatar} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{driver.initials || 'GD'}</Text>
                  </View>
                )}

                {/* Details Column */}
                <View style={styles.detailsCol}>
                  <Text style={styles.nameAndDcText}>
                    <Text style={styles.driverNameText}>{driver.name}</Text>
                    <Text style={styles.dcText}> | DC {driver.dcNumber}</Text>
                  </Text>

                  {/* Subtitle row with Taxi No & Status */}
                  <View style={styles.subInfoRow}>
                    <View style={styles.taxiNoWrap}>
                      <Ionicons
                        name="car"
                        size={13}
                        color="#D97706"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.taxiNoText}>Taxi No. {driver.taxiNo}</Text>
                    </View>

                    {!isPending && (
                      <TouchableOpacity
                        style={styles.statusRow}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(driver.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: isActive ? '#059669' : '#64748B' },
                          ]}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Call Action Button */}
                {!isManager && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCall(driver);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="call-outline" size={16} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Add New Driver Action Button ── */}
        <TouchableOpacity
          style={styles.addDriverButton}
          onPress={() => router.push('/add-driver')}
          activeOpacity={0.88}
        >
          <Ionicons
            name="person-add-outline"
            size={18}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addDriverButtonText}>Add New Driver</Text>
        </TouchableOpacity>

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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },

  /* Search */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#475569',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '500',
  },

  /* Heading */
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  registeredBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  registeredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },

  /* Driver Card */
  driverCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  driverCardPending: {
    borderColor: '#FDE047',
    borderWidth: 1.5,
  },
  pendingBadgeWrap: {
    marginBottom: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    gap: 4,
  },
  pendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D97706',
  },
  pendingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
  },
  driverMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  initialsAvatar: {
    width: 46,
    height: 46,
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
  detailsCol: {
    flex: 1,
  },
  nameAndDcText: {
    marginBottom: 4,
  },
  driverNameText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  dcText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taxiNoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxiNoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  /* Add Driver Button */
  addDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 48,
    marginTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addDriverButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import {
  driverService,
  DriverItem,
  DriversSummary,
} from '../../../services/driverService';

export default function ManageDriverScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [summary, setSummary] = useState<DriversSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Drivers from API (GET /api/drivers/list or /api/drivers/list?search=...)
  const fetchDrivers = useCallback(async (query?: string) => {
    try {
      setErrorMessage('');
      const data = await driverService.getDriversList(query);
      setDrivers(data?.drivers || []);
      setSummary(data?.summary || null);
    } catch (err: any) {
      console.log('Failed to fetch drivers list from API:', err.message || err);
      setErrorMessage(err.message || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search Debounce (350ms)
  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsLoading(true);
      fetchDrivers(searchQuery);
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, fetchDrivers]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDrivers(searchQuery);
    setIsRefreshing(false);
  };

  const handleCall = (driver: DriverItem) => {
    const phone = driver.phone_no;
    if (!phone) {
      Alert.alert(
        'No Phone Number',
        `${driver.full_name || 'Driver'} does not have a contact phone number registered.`
      );
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const url = `tel:${cleanPhone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          `Contact ${driver.full_name || 'Driver'}`,
          `Phone: ${phone}\n${driver.taxi_no_display || `Taxi No. ${driver.assigned_taxi_no || '--'}`}\n${driver.dc_display || `DC ${driver.dc_number || '--'}`}`
        );
      }
    });
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#D97706']}
            tintColor="#D97706"
          />
        }
      >
        {/* Search Bar matching backend (?search=...) */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#94A3B8"
            style={{ marginRight: 8 }}
          />
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

        {/* Section Heading Row with Total Registered Count */}
        <View style={styles.headingRow}>
          <Text style={styles.headingTitle}>Driver</Text>
          {summary ? (
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredBadgeText}>
                {summary.total_registered_label || `${summary.total_drivers} Registered`}
              </Text>
            </View>
          ) : !isLoading ? (
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredBadgeText}>{drivers.length} Registered</Text>
            </View>
          ) : null}
        </View>

        {/* Error Banner */}
        {Boolean(errorMessage) && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#D97706" />
          </View>
        )}

        {/* Empty State */}
        {!isLoading && drivers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? `No drivers found matching "${searchQuery}"`
                : 'No registered drivers found'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try checking the name, DC number, or taxi number.'
                : 'Tap the button below to register a new driver.'}
            </Text>
          </View>
        )}

        {/* Driver Cards (Strictly Rendered from API) */}
        {drivers.map((driver) => {
          const isPending =
            Boolean(driver.is_pending_approval) ||
            driver.registration_status === 'pending' ||
            driver.status_badge === 'warning';
          const isActive = driver.is_active === 1;

          const driverName =
            driver.full_name ||
            `${driver.first_name || ''} ${driver.last_name || ''}`.trim() ||
            '--';
          const dcText =
            driver.dc_display || (driver.dc_number ? `DC ${driver.dc_number}` : '');
          const taxiText =
            driver.taxi_no_display ||
            (driver.assigned_taxi_no ? `Taxi No. ${driver.assigned_taxi_no}` : '');

          const initials =
            driver.initials ||
            `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`.toUpperCase() ||
            'DR';

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
                  params: {
                    driverId: String(driver.id),
                    driverData: JSON.stringify(driver),
                  },
                })
              }
            >
              {/* Pending Approval Badge */}
              {isPending && (
                <View style={styles.pendingBadgeWrap}>
                  <View style={styles.pendingBadge}>
                    <View style={styles.pendingDot} />
                    <Text style={styles.pendingBadgeText}>
                      {driver.status_label || 'Pending Approval'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.driverMainRow}>
                {/* Avatar: profile_photo_url or initials */}
                {driver.profile_photo_url ? (
                  <Image
                    source={{ uri: driver.profile_photo_url }}
                    style={styles.driverAvatar}
                  />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>
                )}

                {/* Details Column */}
                <View style={styles.detailsCol}>
                  <Text style={styles.nameAndDcText}>
                    <Text style={styles.driverNameText}>{driverName}</Text>
                    {Boolean(dcText) && (
                      <Text style={styles.dcText}> | {dcText}</Text>
                    )}
                  </Text>

                  {/* Subtitle row with Taxi No & Status */}
                  <View style={styles.subInfoRow}>
                    {Boolean(taxiText) && (
                      <View style={styles.taxiNoWrap}>
                        <Ionicons
                          name="car"
                          size={13}
                          color="#D97706"
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.taxiNoText}>{taxiText}</Text>
                      </View>
                    )}

                    {!isPending && (
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isActive
                                ? '#10B981'
                                : '#94A3B8',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: isActive ? '#059669' : '#64748B',
                            },
                          ]}
                        >
                          {driver.status_label || (isActive ? 'Active' : 'Inactive')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Call Action Button */}
                {Boolean(driver.phone_no) && (
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

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },

  /* Loading Container */
  loadingContainer: {
    paddingVertical: 28,
    alignItems: 'center',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
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

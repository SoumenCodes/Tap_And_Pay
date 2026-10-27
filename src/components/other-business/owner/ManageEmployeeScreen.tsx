import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import {
  employeeService,
  EmployeeListItem,
  EmployeesSummary,
} from '../../../services/employeeService';

export default function ManageEmployeeScreen() {
  const router = useRouter();

  // Employee API State (Zero Hardcoded Fallbacks)
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [summary, setSummary] = useState<EmployeesSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevSearchRef = useRef<string>(searchQuery);

  const fetchEmployees = useCallback(async (query?: string) => {
    try {
      setErrorMessage(null);
      const data = await employeeService.getEmployeesList(query);
      setEmployees(data?.employees || []);
      setSummary(data?.summary || null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load employees. Please check network connection.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh whenever screen comes into focus (e.g. after adding an employee)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const timer = setTimeout(() => {
        if (!isMounted) return;
        fetchEmployees(searchQuery);
      }, 0);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }, [fetchEmployees, searchQuery])
  );

  // Search Debounce (350ms) for typing queries
  useEffect(() => {
    if (prevSearchRef.current === searchQuery) {
      return;
    }
    prevSearchRef.current = searchQuery;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsLoading(true);
      fetchEmployees(searchQuery);
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, fetchEmployees]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEmployees(searchQuery);
    setIsRefreshing(false);
  };

  const handleCall = (employee: EmployeeListItem) => {
    const phone = employee.phone_no;
    if (!phone) {
      Alert.alert(
        'No Phone Number',
        `${employee.full_name || 'Employee'} does not have a contact phone number registered.`
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
          `Contact ${employee.full_name || 'Employee'}`,
          `Phone: ${phone}\n${employee.emp_id_display || `EMP ID: ${employee.employee_id || employee.employee_code || '--'}`}`
        );
      }
    });
  };

  const handleAddEmployee = () => {
    router.push('/add-employee');
  };

  const registeredLabel =
    summary?.total_registered_label ||
    `${employees.length} Registered`;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title="Manage Employee"
        showBack={true}
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
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employee.."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section Title with Badge */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Employee</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{registeredLabel}</Text>
          </View>
        </View>

        {/* Error Message */}
        {errorMessage && (
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
        {!isLoading && employees.length === 0 && (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? `No employees found matching "${searchQuery}"`
                : 'No registered employees found'}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try checking the name, employee ID, or phone number.'
                : 'Tap the button below to register a new employee.'}
            </Text>
          </View>
        )}

        {/* Employee Cards List (Rendered dynamically strictly from API) */}
        <View style={styles.listContainer}>
          {employees.map((emp) => {
            const isPending =
              Boolean(emp.is_pending_approval) ||
              emp.registration_status === 'pending' ||
              emp.status_badge === 'warning';
            const isActive = emp.is_active === 1;

            const employeeName =
              emp.full_name ||
              `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
              '--';
            const empIdLabel =
              emp.emp_id_display ||
              (emp.employee_id
                ? `EMP ID: ${emp.employee_id}`
                : emp.employee_code
                ? `EMP ID: ${emp.employee_code}`
                : '--');
            const initials =
              emp.initials ||
              `${emp.first_name?.[0] || ''}${emp.last_name?.[0] || ''}`.toUpperCase() ||
              '--';

            const statusText = emp.status_label || (isPending ? 'Pending Approval' : isActive ? 'Active' : 'Inactive');
            const statusColor = isPending ? '#D97706' : isActive ? '#16A34A' : '#94A3B8';

            return (
              <TouchableOpacity
                key={emp.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/employee-details',
                    params: {
                      employeeId: String(emp.id),
                      employeeData: JSON.stringify(emp),
                    },
                  })
                }
              >
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {emp.profile_photo_url ? (
                    <Image source={{ uri: emp.profile_photo_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.fallbackInitials}>{initials}</Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.infoCol}>
                  <Text style={styles.employeeName}>{employeeName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.empIdText}>{empIdLabel}</Text>
                    <View style={styles.statusWrap}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusColor },
                        ]}
                      >
                        {statusText}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Phone Call Action Button */}
                {Boolean(emp.phone_no) && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleCall(emp);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="call-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add New Employee CTA Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddEmployee}
          activeOpacity={0.85}
        >
          <Ionicons
            name="person-add-outline"
            size={18}
            color="#FFFFFF"
            style={styles.addIcon}
          />
          <Text style={styles.addButtonText}>Add New Employee</Text>
        </TouchableOpacity>
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
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.2,
    borderColor: '#0F172A',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitials: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empIdText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 50,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

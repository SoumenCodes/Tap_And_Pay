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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { useEmployees, Employee } from '../../../context/EmployeeContext';

export default function ManageEmployeeScreen() {
  const router = useRouter();
  const { employees, toggleEmployeeStatus } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.empId.toLowerCase().includes(q) ||
        emp.phone.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const handleCall = (employee: Employee) => {
    const phoneUrl = `tel:${employee.phone.replace(/\s+/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert(
            `Contact ${employee.name}`,
            `Phone: ${employee.phone}\nEMP ID: ${employee.empId}\nStatus: ${employee.status.toUpperCase()}`,
            [
              {
                text: 'Toggle Status',
                onPress: () => toggleEmployeeStatus(employee.id),
              },
              { text: 'Close', style: 'cancel' },
            ]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          `Contact ${employee.name}`,
          `Phone: ${employee.phone}\nStatus: ${employee.status.toUpperCase()}`
        );
      });
  };

  const handleAddEmployee = () => {
    router.push('/add-employee');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Standard Header Bar */}
      <HeaderBar title="Manage Employee" showBack={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar matching Figma's distinct dark-bordered input */}
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
            <Text style={styles.countText}>{filteredEmployees.length} registered</Text>
          </View>
        </View>

        {/* Employee Cards List */}
        <View style={styles.listContainer}>
          {filteredEmployees.map((emp) => {
            const isActive = emp.status === 'active';

            return (
              <View key={emp.id} style={styles.card}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                  {emp.avatarLocal ? (
                    <Image source={emp.avatarLocal} style={styles.avatarImage} />
                  ) : emp.avatarUri ? (
                    <Image source={{ uri: emp.avatarUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.fallbackInitials}>
                        {emp.firstName.charAt(0)}
                        {emp.lastName.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Details */}
                <View style={styles.infoCol}>
                  <Text style={styles.employeeName}>{emp.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.empIdText}>EMP ID: {emp.empId}</Text>
                    <View style={styles.statusWrap}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isActive ? '#16A34A' : '#94A3B8' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isActive ? '#16A34A' : '#94A3B8' },
                        ]}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Phone Call Action Button */}
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(emp)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="call-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
              </View>
            );
          })}

          {filteredEmployees.length === 0 && (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={36} color="#CBD5E1" />
              <Text style={styles.emptyText}>No employees found matching &quot;{searchQuery}&quot;</Text>
            </View>
          )}
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
    fontSize: 16,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
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


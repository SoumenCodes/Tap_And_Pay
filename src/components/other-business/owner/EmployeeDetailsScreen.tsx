import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import {
  employeeService,
  EmployeeDetail,
} from '../../../services/employeeService';
import { formatSubmittedDate } from '../../../utils/dateUtils';

export default function EmployeeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ employeeId?: string; id?: string }>();

  const targetId = params?.employeeId || params?.id;

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  // In-app Profile Photo Viewer Modal State
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!targetId) {
      setErrorMessage('No employee ID specified.');
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const detail = await employeeService.getEmployeeDetail(targetId);
      setEmployee(detail);
      setIsActive(Boolean(detail?.is_active));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load employee details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      fetchDetail();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchDetail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDetail();
    setIsRefreshing(false);
  };

  const handleCall = () => {
    const phone = employee?.phone_no;
    if (!phone) {
      Alert.alert('No Phone Number', 'This employee does not have a registered contact number.');
      return;
    }

    const clean = phone.replace(/\s+/g, '');
    const url = `tel:${clean}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert(`Phone: ${phone}`);
      }
    });
  };

  const handleOpenPhotoViewer = () => {
    if (employee?.profile_photo_url) {
      setIsImageLoading(true);
      setIsPhotoViewerVisible(true);
    } else {
      Alert.alert('Profile Photo', 'No profile photo uploaded for this employee.');
    }
  };

  const handleEditProfile = () => {
    if (employee?.id) {
      router.push({
        pathname: '/add-employee',
        params: { id: String(employee.id), mode: 'edit' },
      });
    } else {
      router.push('/add-employee');
    }
  };

  const employeeName =
    employee?.full_name ||
    `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() ||
    '--';
  const empIdLabel =
    employee?.emp_id_display ||
    (employee?.employee_id
      ? `EMP ID: ${employee.employee_id}`
      : employee?.employee_code
      ? `EMP ID: ${employee.employee_code}`
      : '--');
  const initials =
    `${employee?.first_name?.[0] || ''}${employee?.last_name?.[0] || ''}`.toUpperCase() ||
    '--';
  const isPending =
    Boolean(employee?.is_pending_approval) ||
    employee?.registration_status === 'pending' ||
    employee?.status_badge === 'warning';
  const statusLabel =
    employee?.status_label || (isPending ? 'Pending Approval' : isActive ? 'Active' : 'Inactive');
  const statusBadgeColor = isPending ? '#D97706' : isActive ? '#10B981' : '#94A3B8';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title="Employee Details"
        showBack={true}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/manage-employee');
          }
        }}
      />

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading employee details...</Text>
        </View>
      ) : errorMessage && !employee ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Employee</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              fetchDetail();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#D97706"
              colors={['#D97706']}
            />
          }
        >
          {/* ── TOP EMPLOYEE CARD ── */}
          <View style={styles.topCard}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleOpenPhotoViewer}
              style={styles.avatarTouchable}
            >
              {employee?.profile_photo_url ? (
                <View style={styles.avatarWrap}>
                  <Image
                    source={{ uri: employee.profile_photo_url }}
                    style={styles.avatarImg}
                  />
                  <View style={styles.zoomBadge}>
                    <Ionicons name="search" size={10} color="#FFFFFF" />
                  </View>
                </View>
              ) : (
                <View style={styles.initialsAvatar}>
                  <Text style={styles.initialsText}>{initials}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.topInfoCol}>
              <Text style={styles.employeeNameText}>{employeeName}</Text>
              <Text style={styles.empIdBadgeText}>{empIdLabel}</Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusBadgeColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusLabelText,
                    { color: statusBadgeColor },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            {Boolean(employee?.phone_no) && (
              <TouchableOpacity
                style={styles.callCircleBtn}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── PERSONAL INFORMATION CARD ── */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.amberBadge}>
                <Feather name="user" size={14} color="#D97706" />
              </View>
              <Text style={styles.sectionCardTitle}>PERSONAL INFORMATION</Text>
            </View>
            <View style={styles.cardDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{employeeName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={[styles.infoValue, styles.goldValue]}>
                {employee?.employee_id || employee?.employee_code || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={[styles.infoValue, styles.goldValue]}>
                {employee?.phone_no || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{employee?.email || '--'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration Status</Text>
              <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                {employee?.registration_status || '--'}
              </Text>
            </View>

            {Boolean(employee?.created_ts) && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registration Date</Text>
                <Text style={styles.infoValue}>
                  {formatSubmittedDate(employee?.created_ts)}
                </Text>
              </View>
            )}
          </View>

          {/* ── EMPLOYEE STATUS TOGGLE CARD ── */}
          <Text style={styles.statusSectionTitle}>Employee Status</Text>
          <View style={styles.statusToggleCard}>
            <View style={styles.statusToggleLeft}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusBadgeColor },
                ]}
              />
              <Text style={styles.statusStateText}>{statusLabel}</Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* ── EDIT EMPLOYEE PROFILE BUTTON ── */}
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
            <Text style={styles.editButtonText}>Edit Employee Profile</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── IN-APP IMAGE VIEWER MODAL ── */}
      <Modal
        visible={isPhotoViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoViewerVisible(false)}
      >
        <View style={styles.viewerModalContainer}>
          <StatusBar style="light" />
          {/* Modal Header */}
          <View style={styles.viewerHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {employeeName}
              </Text>
              <Text style={styles.viewerSub}>{empIdLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.viewerCloseButton}
              onPress={() => setIsPhotoViewerVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Modal Body / Image */}
          <View style={styles.viewerBody}>
            {isImageLoading && (
              <View style={styles.viewerLoading}>
                <ActivityIndicator size="large" color="#D97706" />
              </View>
            )}
            {Boolean(employee?.profile_photo_url) && (
              <Image
                source={{ uri: employee!.profile_photo_url! }}
                style={styles.viewerImage}
                resizeMode="contain"
                onLoadStart={() => setIsImageLoading(true)}
                onLoadEnd={() => setIsImageLoading(false)}
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* Top Card */
  topCard: {
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
  avatarTouchable: {
    marginRight: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  zoomBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  initialsAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  topInfoCol: {
    flex: 1,
  },
  employeeNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  empIdBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  callCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  /* Section Card */
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  amberBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  goldValue: {
    color: '#D97706',
  },

  /* Status Toggle Card */
  statusSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusStateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Edit Button */
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 48,
    marginTop: 16,
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

  /* In-app Photo Viewer Modal */
  viewerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'space-between',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  viewerCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  viewerLoading: {
    position: 'absolute',
    zIndex: 1,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { driverService, DriverDetail, DriverDocumentDetail } from '../../../services/driverService';

export default function DriverDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ driverId?: string; id?: string }>();

  const targetId = params?.driverId || params?.id;

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  // In-app Document Viewer Modal State
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  const fetchDriverDetail = useCallback(async () => {
    if (!targetId) {
      setErrorMessage('No driver ID specified');
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      const detail = await driverService.getDriverDetail(targetId);
      setDriver(detail);
      setIsActive(Boolean(detail?.driver_status?.is_active ?? detail?.is_active));
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to load driver details.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      fetchDriverDetail();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchDriverDetail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDriverDetail();
    setIsRefreshing(false);
  };

  const handleDocumentPress = (docTitle: string, doc?: DriverDocumentDetail) => {
    if (doc?.url) {
      setIsImageLoading(true);
      setPreviewDoc({
        title: doc.title || docTitle,
        url: doc.url,
      });
    } else {
      Alert.alert(
        docTitle,
        doc?.exists
          ? `${docTitle} is verified on file.`
          : `${docTitle} has not been uploaded yet.`
      );
    }
  };

  const handleEditProfile = () => {
    router.push('/add-driver');
  };

  // Safe primitives for rendering (zero mock fallbacks)
  const driverName = driver?.full_name || '--';
  const dcText = driver?.dc_display || (driver?.dc_number ? `DC ${driver.dc_number}` : '--');
  const taxiText = driver?.taxi_no_display || (driver?.assigned_taxi_no ? `Taxi No. ${driver.assigned_taxi_no}` : '--');
  const initials = driver?.initials || (driver?.full_name ? driver.full_name.slice(0, 2).toUpperCase() : '--');
  const statusLabel = driver?.driver_status?.status_label || (isActive ? 'Active' : 'Inactive');
  const isStatusWarning = driver?.driver_status?.status_badge === 'warning';

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

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading driver details...</Text>
        </View>
      ) : errorMessage && !driver ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={styles.errorTitle}>Failed to Load Driver</Text>
          <Text style={styles.errorSub}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              fetchDriverDetail();
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
          {/* ── DRIVER TOP CARD ── */}
          <View style={styles.topDriverCard}>
            {driver?.profile_photo_url ? (
              <Image
                source={{ uri: driver.profile_photo_url }}
                style={styles.driverAvatar}
              />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}

            <View style={styles.topDriverInfo}>
              <Text style={styles.nameAndDcRow}>
                <Text style={styles.driverNameText}>{driverName}</Text>
                {Boolean(dcText) && (
                  <Text style={styles.dcText}> | {dcText}</Text>
                )}
              </Text>

              <View style={styles.subMetaRow}>
                <View style={styles.taxiBadge}>
                  <Ionicons
                    name="car"
                    size={13}
                    color="#D97706"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.taxiText}>{taxiText}</Text>
                </View>

                <View style={styles.statusDotRow}>
                  <View
                    style={[
                      styles.statusIndicatorDot,
                      {
                        backgroundColor: isStatusWarning
                          ? '#F59E0B'
                          : isActive
                          ? '#10B981'
                          : '#94A3B8',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusIndicatorText,
                      {
                        color: isStatusWarning
                          ? '#D97706'
                          : isActive
                          ? '#059669'
                          : '#64748B',
                      },
                    ]}
                  >
                    {statusLabel}
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
              onPress={() =>
                handleDocumentPress('Driving License Front', driver?.documents?.dl_front)
              }
              activeOpacity={0.8}
            >
              <View style={styles.docIconBadge}>
                <Ionicons
                  name={driver?.documents?.dl_front?.exists ? 'checkmark-circle' : 'image-outline'}
                  size={20}
                  color={driver?.documents?.dl_front?.exists ? '#059669' : '#0284C7'}
                />
              </View>
              <Text style={styles.docCardText}>
                {driver?.documents?.dl_front?.title || 'Driving License Front'}
              </Text>
              <Text style={styles.docSubStatus}>
                {driver?.documents?.dl_front?.exists ? 'Available' : 'Not Uploaded'}
              </Text>
            </TouchableOpacity>

            {/* License Rear */}
            <TouchableOpacity
              style={styles.docCard}
              onPress={() =>
                handleDocumentPress('Driving License Rear', driver?.documents?.dl_rear)
              }
              activeOpacity={0.8}
            >
              <View style={styles.docIconBadge}>
                <Ionicons
                  name={driver?.documents?.dl_rear?.exists ? 'checkmark-circle' : 'image-outline'}
                  size={20}
                  color={driver?.documents?.dl_rear?.exists ? '#059669' : '#0284C7'}
                />
              </View>
              <Text style={styles.docCardText}>
                {driver?.documents?.dl_rear?.title || 'Driving License Rear'}
              </Text>
              <Text style={styles.docSubStatus}>
                {driver?.documents?.dl_rear?.exists ? 'Available' : 'Not Uploaded'}
              </Text>
            </TouchableOpacity>

            {/* DC Image */}
            {Boolean(driver?.documents?.dc_image) && (
              <TouchableOpacity
                style={styles.docCard}
                onPress={() =>
                  handleDocumentPress('DC Document Front', driver?.documents?.dc_image)
                }
                activeOpacity={0.8}
              >
                <View style={styles.docIconBadge}>
                  <Ionicons
                    name={driver?.documents?.dc_image?.exists ? 'checkmark-circle' : 'document-text-outline'}
                    size={20}
                    color={driver?.documents?.dc_image?.exists ? '#059669' : '#0284C7'}
                  />
                </View>
                <Text style={styles.docCardText}>
                  {driver?.documents?.dc_image?.title || 'DC Document Front'}
                </Text>
                <Text style={styles.docSubStatus}>
                  {driver?.documents?.dc_image?.exists ? 'Available' : 'Not Uploaded'}
                </Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.infoValue}>
                {driver?.personal_information?.full_name || driverName}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={[styles.infoValue, styles.goldValue]}>
                {driver?.personal_information?.phone_number || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>DC</Text>
              <Text style={[styles.infoValue, styles.goldValue]}>
                {driver?.personal_information?.dc || driver?.dc_number || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>
                {driver?.personal_information?.email || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ABN</Text>
              <Text style={styles.infoValue}>
                {driver?.personal_information?.abn || '--'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={[styles.infoValue, styles.addressValue]}>
                {driver?.personal_information?.address ||
                  driver?.personal_information?.address_details?.address_line1 ||
                  '--'}
              </Text>
            </View>
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

            {/* Bank Name */}
            <View style={styles.bankFieldBlock}>
              <Text style={styles.bankFieldLabel}>Bank Name</Text>
              <Text style={styles.bankFieldValue}>
                {driver?.bank_account?.bank_name || '--'}
              </Text>
            </View>

            {/* Account Name */}
            <View style={styles.bankFieldBlock}>
              <Text style={styles.bankFieldLabel}>Account Name</Text>
              <Text style={styles.bankFieldValue}>
                {driver?.bank_account?.account_name || '--'}
              </Text>
            </View>

            {/* BSB & Account No */}
            <View style={styles.bankFieldsSplitRow}>
              <View style={[styles.bankFieldBlock, { flex: 1 }]}>
                <Text style={styles.bankFieldLabel}>BSB</Text>
                <Text style={styles.bankFieldValue}>
                  {driver?.bank_account?.bsb || '--'}
                </Text>
              </View>

              <View style={[styles.bankFieldBlock, { flex: 1 }]}>
                <Text style={styles.bankFieldLabel}>Account No.</Text>
                <Text style={styles.bankFieldValue}>
                  {driver?.bank_account?.masked_account_number ||
                    driver?.bank_account?.account_number ||
                    '--'}
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
                  {
                    backgroundColor: isStatusWarning
                      ? '#F59E0B'
                      : isActive
                      ? '#10B981'
                      : '#94A3B8',
                  },
                ]}
              />
              <Text style={styles.statusStateText}>{statusLabel}</Text>
            </View>

            <Switch
              value={isActive}
              onValueChange={setIsActive}
              disabled={driver?.driver_status?.can_toggle === false}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* ── EDIT DRIVER PROFILE BUTTON ── */}
          {driver?.can_edit !== false && (
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
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* ── BOTTOM TAB NAVIGATION BAR ── */}
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

      {/* ── IN-APP DOCUMENT VIEWER MODAL ── */}
      <Modal
        visible={Boolean(previewDoc)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={styles.viewerModalContainer}>
          <StatusBar style="light" />
          {/* Header */}
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {previewDoc?.title || 'Document Preview'}
            </Text>
            <TouchableOpacity
              style={styles.viewerCloseButton}
              onPress={() => setPreviewDoc(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Image Content Container */}
          <View style={styles.viewerBody}>
            {isImageLoading && (
              <View style={styles.viewerLoading}>
                <ActivityIndicator size="large" color="#D97706" />
              </View>
            )}
            {previewDoc?.url && (
              <Image
                source={{ uri: previewDoc.url }}
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
    paddingTop: 8,
    paddingBottom: 24,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  topDriverInfo: {
    flex: 1,
  },
  nameAndDcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dcText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taxiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taxiText: {
    fontSize: 10.5,
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
    fontWeight: '600',
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  /* DC Documents Row */
  docsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  docCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  docIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  docCardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  docSubStatus: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
  },

  /* Card Containers */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  amberIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
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

  /* Info Rows */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  goldValue: {
    color: '#D97706',
  },
  addressValue: {
    fontSize: 10.5,
    color: '#334155',
  },

  /* Bank Fields */
  bankFieldBlock: {
    marginBottom: 10,
  },
  bankFieldLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  bankFieldValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  bankFieldsSplitRow: {
    flexDirection: 'row',
    gap: 12,
  },

  /* Driver Status Card */
  statusSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  driverStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  statusStatusLeft: {
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 2,
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    height: '100%',
  },
  bottomTabLabelInactive: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  bottomTabLabelActive: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2.5,
    backgroundColor: '#D97706',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  /* In-app Document Viewer Modal */
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
    flex: 1,
    marginRight: 16,
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

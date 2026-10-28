import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../../common/HeaderBar';
import { driverService } from '../../../services/driverService';

export default function AddDriverScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = Boolean(id);

  // Form Fields State (initialized cleanly without hardcoded mock fallbacks)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dcNumber, setDcNumber] = useState('');
  const [assignedTaxiNo, setAssignedTaxiNo] = useState('');
  const [email, setEmail] = useState('');
  const [abn, setAbn] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Dynamic image file states
  const [driverPhoto, setDriverPhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [dlFront, setDlFront] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [dlRear, setDlRear] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Existing document URLs in edit mode
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [existingDlFrontUrl, setExistingDlFrontUrl] = useState<string | null>(null);
  const [existingDlRearUrl, setExistingDlRearUrl] = useState<string | null>(null);

  // Submission & loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(Boolean(id));

  // Prepopulate existing driver details in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted) return;

      driverService
        .getDriverDetail(id)
        .then((detail) => {
          if (!isMounted) return;

          // First and Last Name
          if (detail.first_name) {
            setFirstName(detail.first_name);
          } else if (detail.personal_information?.full_name) {
            const parts = detail.personal_information.full_name.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }
          if (detail.last_name) {
            setLastName(detail.last_name);
          }

          // Phone & DC
          const phoneVal =
            detail.personal_information?.phone_number ||
            (detail as any).phone_no ||
            '';
          if (phoneVal) setPhone(phoneVal);

          const dcVal =
            detail.dc_number ||
            detail.personal_information?.dc ||
            '';
          if (dcVal) setDcNumber(dcVal);

          const dlVal =
            detail.personal_information?.dl_number ||
            (detail as any).dl_number ||
            '';
          if (dlVal) setDlNumber(dlVal);

          const taxiVal =
            detail.assigned_taxi_no ||
            (detail as any).taxi_no ||
            '';
          if (taxiVal) setAssignedTaxiNo(taxiVal);

          const emailVal =
            detail.personal_information?.email ||
            (detail as any).email ||
            '';
          if (emailVal) setEmail(emailVal);

          const abnVal =
            detail.personal_information?.abn ||
            (detail as any).abn ||
            '';
          if (abnVal) setAbn(abnVal);

          const addrVal =
            detail.personal_information?.address_details?.address_line1 ||
            detail.personal_information?.address ||
            '';
          if (addrVal) setAddress(addrVal);

          // Bank
          if (detail.bank_account?.account_name) {
            setAccountName(detail.bank_account.account_name);
          }
          if (detail.bank_account?.bank_name) {
            setBankName(detail.bank_account.bank_name);
          }
          if (detail.bank_account?.bsb) {
            setBsb(detail.bank_account.bsb);
          }
          if (detail.bank_account?.account_number) {
            setAccountNo(detail.bank_account.account_number);
          }

          // Status
          if (typeof detail.is_active === 'boolean') {
            setIsActive(detail.is_active);
          } else if (typeof detail.driver_status?.is_active === 'boolean') {
            setIsActive(detail.driver_status.is_active);
          }

          // Photos on file
          if (detail.profile_photo_url) {
            setExistingPhotoUrl(detail.profile_photo_url);
          }
          if (detail.documents?.dl_front?.url) {
            setExistingDlFrontUrl(detail.documents.dl_front.url);
          }
          if (detail.documents?.dl_rear?.url) {
            setExistingDlRearUrl(detail.documents.dl_rear.url);
          }
        })
        .catch((err) => {
          Alert.alert('Error', err?.message || 'Failed to load driver details for editing.');
        })
        .finally(() => {
          if (isMounted) setIsLoadingExisting(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [id]);

  const pickImage = async (
    target: 'photo' | 'front' | 'rear',
    source: 'camera' | 'gallery'
  ) => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const filename = asset.fileName || asset.uri.split('/').pop() || `${target}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');
          const fileObj = { uri: asset.uri, name: filename, type };
          if (target === 'photo') setDriverPhoto(fileObj);
          if (target === 'front') setDlFront(fileObj);
          if (target === 'rear') setDlRear(fileObj);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Photo library permission is required.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const filename = asset.fileName || asset.uri.split('/').pop() || `${target}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');
          const fileObj = { uri: asset.uri, name: filename, type };
          if (target === 'photo') setDriverPhoto(fileObj);
          if (target === 'front') setDlFront(fileObj);
          if (target === 'rear') setDlRear(fileObj);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not select image.');
    }
  };

  const handleUploadOption = (target: 'photo' | 'front' | 'rear', title: string) => {
    const hasCurrent =
      target === 'photo'
        ? Boolean(driverPhoto || existingPhotoUrl)
        : target === 'front'
        ? Boolean(dlFront || existingDlFrontUrl)
        : Boolean(dlRear || existingDlRearUrl);

    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Take Photo (Camera)', onPress: () => pickImage(target, 'camera') },
      { text: 'Choose from Gallery', onPress: () => pickImage(target, 'gallery') },
    ];

    if (hasCurrent) {
      options.push({
        text: 'Remove Image',
        style: 'destructive',
        onPress: () => {
          if (target === 'photo') {
            setDriverPhoto(null);
            setExistingPhotoUrl(null);
          } else if (target === 'front') {
            setDlFront(null);
            setExistingDlFrontUrl(null);
          } else {
            setDlRear(null);
            setExistingDlRearUrl(null);
          }
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(title, 'Select image source:', options);
  };

  const handleSaveDriver = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Field', 'Please enter first name and last name.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter the driver phone number.');
      return;
    }

    if (!dcNumber.trim()) {
      Alert.alert('Required Field', 'Please enter the DC number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('phone_no', phone.trim());
      formData.append('dl_number', dlNumber.trim());
      formData.append('dc_number', dcNumber.trim());
      formData.append('assigned_taxi_no', assignedTaxiNo.trim());
      formData.append('abn', abn.trim());
      formData.append('address', address.trim());
      formData.append('account_name', accountName.trim());
      formData.append('bank_name', bankName.trim());
      formData.append('bsb', bsb.trim());
      formData.append('account_number', accountNo.trim());

      if (driverPhoto) {
        formData.append('driver_photo', {
          uri: driverPhoto.uri,
          name: driverPhoto.name,
          type: driverPhoto.type,
        } as any);
      }

      if (dlFront) {
        formData.append('dl_front_image', {
          uri: dlFront.uri,
          name: dlFront.name,
          type: dlFront.type,
        } as any);
      }

      if (dlRear) {
        formData.append('dl_rear_image', {
          uri: dlRear.uri,
          name: dlRear.name,
          type: dlRear.type,
        } as any);
      }

      if (isEditMode && id) {
        const response = await driverService.updateDriverProfile(id, formData);
        Alert.alert(
          'Success',
          response.message || 'Driver profile updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/manage-driver');
                }
              },
            },
          ]
        );
      } else {
        const response = await driverService.addDriver(formData);
        const created = response.data?.driver;
        let successMsg = response.message || 'Driver added successfully.';
        if (created?.temporary_password) {
          successMsg += `\n\nTemporary Password: ${created.temporary_password}\n(Please share this with the driver)`;
        }

        Alert.alert('Success', successMsg, [
          {
            text: 'OK',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/manage-driver');
              }
            },
          },
        ]);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        (isEditMode
          ? 'Failed to update driver profile. Please verify details and try again.'
          : 'Failed to add driver. Please verify all information and try again.');
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title={isEditMode ? 'Edit Driver' : 'Add Drivers'}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/manage-driver');
          }
        }}
      />

      {isLoadingExisting ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading driver details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section Heading with Icon */}
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="person-outline" size={16} color="#D97706" />
            </View>
            <Text style={styles.sectionHeadingText}>
              {isEditMode ? 'Edit Driver Profile' : 'Add Driver Credentials'}
            </Text>
          </View>

          {/* ── DRIVER PHOTO UPLOAD BOX ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Driver Photo</Text>
            <TouchableOpacity
              style={styles.photoUploadBox}
              onPress={() => handleUploadOption('photo', 'Driver Photo')}
              activeOpacity={0.8}
            >
              {driverPhoto ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: driverPhoto.uri }} style={styles.previewImage} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.uploadTitle}>Photo Selected</Text>
                    <Text style={styles.uploadSubtitle} numberOfLines={1}>
                      {driverPhoto.name}
                    </Text>
                    <Text style={styles.changePrompt}>Tap to change</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setDriverPhoto(null);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : existingPhotoUrl ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: existingPhotoUrl }} style={styles.previewImage} />
                  <View style={styles.previewInfo}>
                    <Text style={styles.uploadTitle}>Current Photo</Text>
                    <Text style={styles.uploadSubtitle}>On file</Text>
                    <Text style={styles.changePrompt}>Tap to change</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setExistingPhotoUrl(null);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.cameraIconCircle}>
                    <Ionicons name="camera-outline" size={22} color="#2563EB" />
                  </View>
                  <Text style={styles.uploadTitle}>Tap to upload</Text>
                  <Text style={styles.uploadSubtitle}>.JPEG or PNG, max 5MB</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── DRIVING LICENSE UPLOAD ROW ── */}
          <View style={styles.licensesRow}>
            {/* Front */}
            <View style={styles.licenseCol}>
              <Text style={styles.fieldLabel}>Driving License Front</Text>
              <TouchableOpacity
                style={styles.licenseUploadBox}
                onPress={() => handleUploadOption('front', 'Driving License Front')}
                activeOpacity={0.8}
              >
                {dlFront ? (
                  <View style={styles.licensePreviewWrap}>
                    <Image source={{ uri: dlFront.uri }} style={styles.licenseThumb} />
                    <Text style={styles.licenseBoxTitle} numberOfLines={1}>
                      Front Selected
                    </Text>
                  </View>
                ) : existingDlFrontUrl ? (
                  <View style={styles.licensePreviewWrap}>
                    <Image source={{ uri: existingDlFrontUrl }} style={styles.licenseThumb} />
                    <Text style={styles.licenseBoxTitle} numberOfLines={1}>
                      Front (On file)
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.licenseIconWrap}>
                      <Ionicons name="card-outline" size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.licenseBoxTitle}>Driving License Front</Text>
                    <Text style={styles.licenseBoxSub}>Tap to upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Rear */}
            <View style={styles.licenseCol}>
              <Text style={styles.fieldLabel}>Driving License Rear</Text>
              <TouchableOpacity
                style={styles.licenseUploadBox}
                onPress={() => handleUploadOption('rear', 'Driving License Rear')}
                activeOpacity={0.8}
              >
                {dlRear ? (
                  <View style={styles.licensePreviewWrap}>
                    <Image source={{ uri: dlRear.uri }} style={styles.licenseThumb} />
                    <Text style={styles.licenseBoxTitle} numberOfLines={1}>
                      Rear Selected
                    </Text>
                  </View>
                ) : existingDlRearUrl ? (
                  <View style={styles.licensePreviewWrap}>
                    <Image source={{ uri: existingDlRearUrl }} style={styles.licenseThumb} />
                    <Text style={styles.licenseBoxTitle} numberOfLines={1}>
                      Rear (On file)
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.licenseIconWrap}>
                      <Ionicons name="card-outline" size={18} color="#2563EB" />
                    </View>
                    <Text style={styles.licenseBoxTitle}>Driving License Rear</Text>
                    <Text style={styles.licenseBoxSub}>Tap to upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── FORM FIELDS ── */}
          {/* First Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Last Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+61</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 0400 555 320"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Driving License Number */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Driving License Number</Text>
            <TextInput
              style={styles.input}
              value={dlNumber}
              onChangeText={setDlNumber}
              placeholder="e.g. DL938210481"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>

          {/* DC Number */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>DC Number *</Text>
            <TextInput
              style={styles.input}
              value={dcNumber}
              onChangeText={setDcNumber}
              placeholder="Driver Certificate (e.g. 93821048)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          {/* Assigned Taxi No */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Assigned Taxi No.</Text>
            <TextInput
              style={styles.input}
              value={assignedTaxiNo}
              onChangeText={setAssignedTaxiNo}
              placeholder="e.g. M6061"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="driver@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* ABN */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>ABN</Text>
            <TextInput
              style={styles.input}
              value={abn}
              onChangeText={setAbn}
              placeholder="e.g. 98765423101"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          {/* Address */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Full address"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Bank Account Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Bank Account Name</Text>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Name on bank account"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* BSB & Account No */}
          <View style={styles.splitRow}>
            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>BSB</Text>
              <TextInput
                style={styles.input}
                value={bsb}
                onChangeText={setBsb}
                placeholder="e.g. 063-123"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.fieldWrap, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Account No.</Text>
              <TextInput
                style={styles.input}
                value={accountNo}
                onChangeText={setAccountNo}
                placeholder="e.g. 109876541"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Driver Status Switch */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Driver Status</Text>
            <View style={styles.statusToggleCard}>
              <View style={styles.statusLeftRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isActive ? '#10B981' : '#94A3B8' },
                  ]}
                />
                <Text style={styles.statusLabelText}>
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
          </View>

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.buttonsWrap}>
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSaveDriver}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.saveBtnText}>
                    {isEditMode ? 'Update Driver Profile' : 'Save Driver'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
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

  /* Section Heading */
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeadingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Fields */
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '600',
  },

  /* Photo Upload */
  photoUploadBox: {
    minHeight: 112,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  cameraIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  changePrompt: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  previewImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  removePhotoBtn: {
    padding: 8,
  },

  /* Licenses Row */
  licensesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  licenseCol: {
    flex: 1,
  },
  licenseUploadBox: {
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  licenseIconWrap: {
    marginBottom: 4,
  },
  licenseBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  licenseBoxSub: {
    fontSize: 9.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  licensePreviewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  licenseThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },

  /* Phone Row */
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    width: 68,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Split Row */
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },

  /* Status Toggle */
  statusToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
  },
  statusLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Action Buttons */
  buttonsWrap: {
    marginTop: 10,
    gap: 10,
  },
  saveBtn: {
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
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 48,
  },
  cancelBtnText: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

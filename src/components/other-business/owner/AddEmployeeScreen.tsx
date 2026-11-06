import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../../common/HeaderBar';
import { useConfirmModal } from '../../../context/ConfirmModalContext';
import { employeeService } from '../../../services/employeeService';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, showPrompt } = useConfirmModal();
  const { id } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const isEditMode = Boolean(id);

  // Dynamic Keyboard tracking for smooth responsive input scrolling
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Focus chaining refs
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Form State (Clean Primitives with Zero Hardcoded Mock Fallbacks)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(Boolean(id));
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);

  // Dynamic Profile Photo State
  const [profilePhoto, setProfilePhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  // Load existing details when in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const timer = setTimeout(() => {
      if (!isMounted) return;

      employeeService
        .getEmployeeDetail(id)
        .then((emp) => {
          if (!isMounted) return;
          if (emp.first_name) setFirstName(emp.first_name);
          if (emp.last_name) setLastName(emp.last_name);
          if (emp.phone_no) setPhone(emp.phone_no);
          if (emp.email) setEmail(emp.email);
          if (emp.employee_id || emp.employee_code) {
            setEmpId(emp.employee_id || emp.employee_code || '');
          }
          if (typeof emp.is_active === 'boolean') {
            setIsActive(emp.is_active);
          }
          if (emp.profile_photo_url) {
            setExistingPhotoUrl(emp.profile_photo_url);
          }
        })
        .catch((err) => {
          showAlert({
            title: 'Error',
            message: err?.message || 'Failed to load employee details for editing.',
            type: 'danger',
          });
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

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Required',
          message: 'Camera access is required to take an employee profile photo.',
          type: 'warning',
          icon: 'camera-outline',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'profile_photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

        setProfilePhoto({
          uri: asset.uri,
          name: filename,
          type,
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Camera Error',
        message: err.message || 'Could not open camera.',
        type: 'danger',
      });
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          title: 'Permission Required',
          message: 'Photo library access is required to select an employee profile photo.',
          type: 'warning',
          icon: 'image-outline',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || asset.uri.split('/').pop() || 'profile_photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = asset.mimeType || (match ? `image/${match[1]}` : 'image/jpeg');

        setProfilePhoto({
          uri: asset.uri,
          name: filename,
          type,
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Gallery Error',
        message: err.message || 'Could not open photo library.',
        type: 'danger',
      });
    }
  };

  const handleUploadPhoto = () => {
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [
      { text: 'Take Photo (Camera)', onPress: pickFromCamera },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
    ];

    if (profilePhoto || existingPhotoUrl) {
      buttons.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          setProfilePhoto(null);
          setExistingPhotoUrl(null);
        },
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    showPrompt({
      title: 'Upload Employee Photo',
      message: 'Select a photo source:',
      type: 'info',
      icon: 'camera-outline',
      buttons,
    });
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showAlert({
        title: 'Required Fields',
        message: 'Please enter First Name and Last Name.',
        type: 'warning',
      });
      return;
    }
    if (!phone.trim()) {
      showAlert({
        title: 'Required Field',
        message: 'Please enter a contact phone number.',
        type: 'warning',
      });
      return;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        showAlert({
          title: 'Invalid Email',
          message: 'Please enter a valid email address (e.g. employee@business.com).',
          type: 'warning',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('phone_number', phone.trim());
      formData.append('phone_no', phone.trim());
      if (email.trim()) {
        formData.append('email_id', email.trim());
        formData.append('email', email.trim());
      }
      if (empId.trim()) {
        formData.append('employee_id', empId.trim());
      }
      formData.append('is_active', isActive ? '1' : '0');

      // Append dynamic profile photo file
      if (profilePhoto) {
        formData.append('profile_photo', {
          uri: profilePhoto.uri,
          name: profilePhoto.name,
          type: profilePhoto.type,
        } as any);
      }

      if (isEditMode && id) {
        const res = await employeeService.updateEmployee(id, formData);
        if (res.status === false || (res as any).success === false) {
          showAlert({
            title: 'Update Failed',
            message: res.message || 'Failed to update employee. Please check details and try again.',
            type: 'danger',
          });
          return;
        }

        showAlert({
          title: 'Success',
          message: res.message || 'Employee profile updated successfully.',
          type: 'success',
          icon: 'checkmark-circle-outline',
          onClose: () => router.back(),
        });
      } else {
        const res = await employeeService.addEmployee(formData);
        if (res.status === false || (res as any).success === false || !res.data?.employee) {
          showAlert({
            title: 'Unable to Add Employee',
            message: res.message || 'Failed to add employee. Email or employee details may already exist.',
            type: 'danger',
          });
          return;
        }

        const created = res.data?.employee;
        const targetEmail = created?.email || email.trim();
        let msg = res.message || 'Employee added successfully and waiting for admin approval.';
        if (targetEmail) {
          msg += `\n\nOnce approved, the password will be sent to the employee's registered email (${targetEmail}).`;
        } else {
          msg += `\n\nOnce approved, the password will be sent to the employee's registered email.`;
        }

        showAlert({
          title: 'Success',
          message: msg,
          type: 'success',
          icon: 'checkmark-circle-outline',
          onClose: () => router.back(),
        });
      }
    } catch (err: any) {
      console.warn('Error saving employee:', err);
      const rawData = err?.response?.data || (err as any)?.raw?.response?.data || (err as any)?.data;
      let errorMsg = err?.message;

      if (rawData?.errors && typeof rawData.errors === 'object') {
        const errList = Object.values(rawData.errors).flat().filter(Boolean);
        if (errList.length > 0) {
          errorMsg = errList.join('\n');
        }
      } else if (rawData?.message) {
        errorMsg = rawData.message;
      }

      if (!errorMsg || errorMsg === 'Error') {
        errorMsg = isEditMode
          ? 'Failed to update employee. Please check details and try again.'
          : 'Failed to add employee. The email or employee details may already exist.';
      }

      showAlert({
        title: 'Error',
        message: errorMsg,
        type: 'danger',
        // Note: No onClose navigation here so the user remains on the screen with all entered inputs intact!
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <HeaderBar
        title={isEditMode ? 'Edit Employee' : 'Add Employee'}
        showBack={true}
        onBack={() => router.back()}
      />

      {isLoadingExisting ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.loadingText}>Loading employee details...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 52 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: keyboardHeight > 0
                  ? (Platform.OS === 'ios' ? 40 : keyboardHeight + 30)
                  : 50,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            {/* Subheader Title with Amber Icon */}
            <View style={styles.headerCard}>
              <View style={styles.headerIconBadge}>
                <Feather name="user" size={18} color="#D97706" />
              </View>
              <Text style={styles.headerCardTitle}>
                {isEditMode ? 'Edit Employee Profile' : 'Add Employee Credentials'}
              </Text>
            </View>

            {/* Field: Employee Photo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Employee Photo</Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={handleUploadPhoto}
                activeOpacity={0.7}
              >
                {profilePhoto ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: profilePhoto.uri }} style={styles.previewImage} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.uploadPrompt}>Photo Selected</Text>
                      <Text style={styles.uploadSubtext} numberOfLines={1}>
                        {profilePhoto.name}
                      </Text>
                      <Text style={styles.changePrompt}>Tap to change</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setProfilePhoto(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : existingPhotoUrl ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: existingPhotoUrl }} style={styles.previewImage} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.uploadPrompt}>Current Photo</Text>
                      <Text style={styles.uploadSubtext}>On file</Text>
                      <Text style={styles.changePrompt}>Tap to change</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setExistingPhotoUrl(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.cameraIconWrap}>
                      <Feather name="camera" size={20} color="#2563EB" />
                    </View>
                    <Text style={styles.uploadPrompt}>Tap to upload</Text>
                    <Text style={styles.uploadSubtext}>JPEG or PNG, max 5MB</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          {/* Field: First Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput
              ref={firstNameRef}
              style={styles.textInput}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
            />
          </View>

          {/* Field: Last Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput
              ref={lastNameRef}
              style={styles.textInput}
              placeholder="Last name"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          {/* Field: Phone Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+61</Text>
              </View>
              <TextInput
                ref={phoneRef}
                style={[styles.textInput, styles.phoneInput]}
                placeholder="e.g. 0400 555 320"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
          </View>

          {/* Field: Email ID */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email ID</Text>
            <TextInput
              ref={emailRef}
              style={styles.textInput}
              placeholder="e.g. employee@business.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          {/* Field: Employee ID (Read-only in Edit Mode, Auto-generated when adding) */}
          {isEditMode && empId ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Employee ID</Text>
              <View style={[styles.textInput, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{empId}</Text>
              </View>
            </View>
          ) : null}

          {/* Field: Employee Status */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Employee Status</Text>
            <View style={styles.statusBox}>
              <View style={styles.statusLeft}>
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

          {/* Action CTAs */}
          <View style={styles.actionGroup}>
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.saveButtonText}>
                    {isEditMode ? 'Update Employee' : 'Save Employee'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  headerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  readOnlyInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBox: {
    width: 60,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  cameraIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  uploadSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  changePrompt: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 3,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    width: '100%',
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  removePhotoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  statusLeft: {
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
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionGroup: {
    marginTop: 12,
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 48,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../../common/HeaderBar';
import { employeeService } from '../../../services/employeeService';

export default function AddEmployeeScreen() {
  const router = useRouter();

  // Form State (Clean Primitives with Zero Hardcoded Mock Fallbacks)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Profile Photo State
  const [profilePhoto, setProfilePhoto] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const pickFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is required to take an employee profile photo.'
        );
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
      Alert.alert('Camera Error', err.message || 'Could not open camera.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is required to select an employee profile photo.'
        );
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
      Alert.alert('Gallery Error', err.message || 'Could not open photo library.');
    }
  };

  const handleUploadPhoto = () => {
    const options: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Take Photo (Camera)', onPress: pickFromCamera },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
    ];

    if (profilePhoto) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => setProfilePhoto(null),
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Upload Employee Photo', 'Select a photo source:', options);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please enter First Name and Last Name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter a contact phone number.');
      return;
    }
    if (!empId.trim()) {
      Alert.alert('Required Field', 'Please enter an Employee ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      formData.append('phone_number', phone.trim());
      formData.append('email_id', email.trim());
      formData.append('employee_id', empId.trim());

      // Append dynamic profile photo file
      if (profilePhoto) {
        formData.append('profile_photo', {
          uri: profilePhoto.uri,
          name: profilePhoto.name,
          type: profilePhoto.type,
        } as any);
      }

      const res = await employeeService.addEmployee(formData);
      const created = res.data?.employee;
      let msg = res.message || 'Employee added successfully and waiting for admin approval.';
      if (created?.temporary_password) {
        msg += `\n\nTemporary Password: ${created.temporary_password}\n(Please share this credential with the employee)`;
      }

      Alert.alert('Success', msg, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add employee. Please check details and try again.';
      Alert.alert('Error', errorMsg);
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
        title="Add Employee"
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subheader Title with Amber Icon */}
          <View style={styles.headerCard}>
            <View style={styles.headerIconBadge}>
              <Feather name="user" size={18} color="#D97706" />
            </View>
            <Text style={styles.headerCardTitle}>Add Employee Credentials</Text>
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
              style={styles.textInput}
              placeholder="First name"
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          {/* Field: Last Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Last name"
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
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
                style={[styles.textInput, styles.phoneInput]}
                placeholder="e.g. 0400 555 320"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Field: Email ID */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. employee@business.com"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Field: Employee ID */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Employee ID *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. EMP321045"
              placeholderTextColor="#94A3B8"
              value={empId}
              onChangeText={setEmpId}
              autoCapitalize="characters"
            />
          </View>

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
                  <Text style={styles.saveButtonText}>Save Employee</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

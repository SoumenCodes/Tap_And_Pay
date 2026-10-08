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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../common/HeaderBar';
import { useEmployees } from '../../context/EmployeeContext';

export default function AddEmployeeScreen() {
  const router = useRouter();
  const { addEmployee } = useEmployees();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [empId, setEmpId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleUploadPhoto = () => {
    Alert.alert(
      'Upload Employee Photo',
      'Select a photo source for the new employee:',
      [
        { text: 'Camera', onPress: () => Alert.alert('Camera selected') },
        { text: 'Photo Gallery', onPress: () => Alert.alert('Gallery selected') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please provide both First Name and Last Name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter a contact phone number.');
      return;
    }

    addEmployee({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      empId: empId.trim() || `${Math.floor(10000000 + Math.random() * 90000000)}`,
      status: isActive ? 'active' : 'inactive',
      avatarLocal: require('../../../assets/emp_avatar_2.png'),
    });

    Alert.alert(
      'Employee Added',
      `${firstName} ${lastName} has been added successfully to your staff records.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Standard Common Header */}
      <HeaderBar title="Add Employee" showBack={true} />

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
              <View style={styles.cameraIconWrap}>
                <Feather name="camera" size={20} color="#2563EB" />
              </View>
              <Text style={styles.uploadPrompt}>Tap to upload</Text>
              <Text style={styles.uploadSubtext}>JPEG or PNG, max 5MB</Text>
            </TouchableOpacity>
          </View>

          {/* Field: First Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First Name</Text>
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
            <Text style={styles.fieldLabel}>Last Name</Text>
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
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>+61</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.phoneInput]}
                placeholder="0400 555 320"
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
              placeholder="Type email ID"
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
            <Text style={styles.fieldLabel}>Employee ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="84920048"
              placeholderTextColor="#94A3B8"
              value={empId}
              onChangeText={setEmpId}
              keyboardType="number-pad"
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
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.saveButtonText}>Save Employee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
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
  },
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  uploadBox: {
    height: 116,
    borderRadius: 14,
    backgroundColor: '#F0F7FF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cameraIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPrompt: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  uploadSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBox: {
    width: 68,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
  },
  statusBox: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabelText: {
    fontSize: 14,
    fontWeight: '600',
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
    height: 50,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
});

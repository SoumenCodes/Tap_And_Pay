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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';
import { driverService } from '../../../services/driverService';

export default function AddDriverScreen() {
  const router = useRouter();

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

  // Document selection states
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasLicenseFront, setHasLicenseFront] = useState(false);
  const [hasLicenseRear, setHasLicenseRear] = useState(false);

  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      formData.append('dl_number', dlNumber.trim());
      formData.append('dc_number', dcNumber.trim());
      formData.append('assigned_taxi_no', assignedTaxiNo.trim());
      formData.append('abn', abn.trim());
      formData.append('address', address.trim());
      formData.append('account_name', accountName.trim());
      formData.append('bank_name', bankName.trim());
      formData.append('bsb', bsb.trim());
      formData.append('account_number', accountNo.trim());

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
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to add driver. Please verify all information and try again.';
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
        title="Add Drivers"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/manage-driver');
          }
        }}
      />

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
          <Text style={styles.sectionHeadingText}>Add Driver Credentials</Text>
        </View>

        {/* ── DRIVER PHOTO UPLOAD BOX ── */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Driver Photo</Text>
          <TouchableOpacity
            style={styles.photoUploadBox}
            onPress={() => {
              setHasPhoto((prev) => !prev);
              Alert.alert('Photo', 'Driver photo upload selected.');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cameraIconCircle}>
              <Ionicons
                name={hasPhoto ? 'checkmark-circle' : 'camera-outline'}
                size={22}
                color="#2563EB"
              />
            </View>
            <Text style={styles.uploadTitle}>
              {hasPhoto ? 'Photo Selected' : 'Tap to upload'}
            </Text>
            <Text style={styles.uploadSubtitle}>.JPEG or PNG, max 5MB</Text>
          </TouchableOpacity>
        </View>

        {/* ── DRIVING LICENSE UPLOAD ROW ── */}
        <View style={styles.licensesRow}>
          {/* Front */}
          <View style={styles.licenseCol}>
            <Text style={styles.fieldLabel}>Driving License Front</Text>
            <TouchableOpacity
              style={styles.licenseUploadBox}
              onPress={() => {
                setHasLicenseFront((prev) => !prev);
                Alert.alert('License', 'Driving license front selected.');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.licenseIconWrap}>
                <Ionicons
                  name={hasLicenseFront ? 'checkmark-circle' : 'card-outline'}
                  size={18}
                  color="#2563EB"
                />
              </View>
              <Text style={styles.licenseBoxTitle}>Driving License Front</Text>
              <Text style={styles.licenseBoxSub}>
                {hasLicenseFront ? 'Selected' : 'Tap to upload'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rear */}
          <View style={styles.licenseCol}>
            <Text style={styles.fieldLabel}>Driving License Rear</Text>
            <TouchableOpacity
              style={styles.licenseUploadBox}
              onPress={() => {
                setHasLicenseRear((prev) => !prev);
                Alert.alert('License', 'Driving license rear selected.');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.licenseIconWrap}>
                <Ionicons
                  name={hasLicenseRear ? 'checkmark-circle' : 'card-outline'}
                  size={18}
                  color="#2563EB"
                />
              </View>
              <Text style={styles.licenseBoxTitle}>Driving License Rear</Text>
              <Text style={styles.licenseBoxSub}>
                {hasLicenseRear ? 'Selected' : 'Tap to upload'}
              </Text>
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

        {/* Email ID */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email ID</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. driver@email.com"
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
            placeholder="ABN Number"
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
            placeholder="e.g. Suite 4, 120 Collins Street, Melbourne VIC"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Bank Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. National Australia Bank"
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
                <Text style={styles.saveBtnText}>Save Driver</Text>
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

  /* Section Heading */
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionIconBadge: {
    width: 26,
    height: 26,
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
    height: 112,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 94,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
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

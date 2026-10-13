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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../../common/HeaderBar';

export default function AddDriverScreen() {
  const router = useRouter();

  // Form Fields State
  const [firstName, setFirstName] = useState('Harpreet');
  const [lastName, setLastName] = useState('Singh');
  const [phone, setPhone] = useState('0400 555 320');
  const [dcNumber, setDcNumber] = useState('93821048');
  const [email, setEmail] = useState('');
  const [abn, setAbn] = useState('98765423101');
  const [address, setAddress] = useState('');
  const [accountName, setAccountName] = useState('Lovedeep Singh Khangura');
  const [bsb, setBsb] = useState('063-123');
  const [accountNo, setAccountNo] = useState('1096 7654');
  const [assignedTaxiNo, setAssignedTaxiNo] = useState('M6061');
  const [isActive, setIsActive] = useState(true);

  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasLicenseFront, setHasLicenseFront] = useState(false);
  const [hasLicenseRear, setHasLicenseRear] = useState(false);

  const handleSaveDriver = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'Please enter first name and last name.');
      return;
    }

    Alert.alert(
      'Driver Saved',
      `${firstName} ${lastName} (Taxi No. ${assignedTaxiNo}) has been added to your fleet.`,
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
              Alert.alert('Photo', 'Driver photo uploaded.');
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
              {hasPhoto ? 'Photo Uploaded' : 'Tap to upload'}
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
                Alert.alert('License', 'Driving license front uploaded.');
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
                {hasLicenseFront ? 'Uploaded' : 'Tap to upload'}
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
                Alert.alert('License', 'Driving license rear uploaded.');
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
                {hasLicenseRear ? 'Uploaded' : 'Tap to upload'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FORM FIELDS ── */}
        {/* First Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>First Name</Text>
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
          <Text style={styles.fieldLabel}>Last Name</Text>
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
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.countryCodeText}>+61</Text>
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="0400 555 320"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* DC Number */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>DC</Text>
          <TextInput
            style={styles.input}
            value={dcNumber}
            onChangeText={setDcNumber}
            placeholder="Driver Certificate"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />
        </View>

        {/* Email ID */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Email ID</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Type email ID"
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
            placeholder="Type Address Here"
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Account Name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Bank Account Name"
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
              placeholder="063-123"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={[styles.fieldWrap, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Account No.</Text>
            <TextInput
              style={styles.input}
              value={accountNo}
              onChangeText={setAccountNo}
              placeholder="1096 7654"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>
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
            style={styles.saveBtn}
            onPress={handleSaveDriver}
            activeOpacity={0.88}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.saveBtnText}>Save Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  /* Fields */
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 13.5,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadSubtitle: {
    fontSize: 11,
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
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  licenseBoxSub: {
    fontSize: 10,
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
    fontSize: 13.5,
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
    fontSize: 13.5,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '700',
  },
});

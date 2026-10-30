import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  Vibration,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Svg, Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import HeaderBar from '../../components/common/HeaderBar';
import { colors } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaymentMethod = 'tap' | 'card' | 'cash';
type ScreenStep = 'amount' | 'confirm';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

interface LocationItem {
  id: string;
  name: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const POPULAR_LOCATIONS: LocationItem[] = [
  { id: '1', name: 'Hospital', desc: 'The Royal Melbourne Hospital, Parkville', icon: 'medical' },
  { id: '2', name: 'Home', desc: 'Residential Address', icon: 'home' },
  { id: '3', name: 'Melbourne Airport (MEL)', desc: 'Terminal 1-4, Tullamarine', icon: 'airplane' },
  { id: '4', name: 'Flinders Street Station', desc: 'Corner Flinders & Swanston St, CBD', icon: 'train' },
  { id: '5', name: 'Crown Casino & Hotel', desc: '8 Whiteman St, Southbank VIC', icon: 'star' },
  { id: '6', name: 'Southern Cross Station', desc: 'Spencer Street, Docklands VIC', icon: 'subway' },
  { id: '7', name: 'St Kilda Beach', desc: 'Jacka Blvd, St Kilda VIC', icon: 'sunny' },
  { id: '8', name: 'Chadstone Shopping Centre', desc: '1341 Dandenong Rd, Malvern East', icon: 'cart' },
  { id: '9', name: 'Melbourne Cricket Ground (MCG)', desc: 'Brunton Ave, Richmond VIC', icon: 'football' },
];

export default function TapToPayEnterAmountScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const isOtherBusiness =
    user.loginType === 'other_business' ||
    user.loginType === 'other_business_employee';

  // Screen flow step: 'amount' (keypad) -> 'confirm' (summary breakdown)
  const [screenStep, setScreenStep] = useState<ScreenStep>('amount');

  // Selected payment method (default: 'tap' or 'card')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('tap');

  // Amount string state (default '0')
  const [amountStr, setAmountStr] = useState<string>('0');

  // Interactive Route state
  const [pickupLocation, setPickupLocation] = useState<string>('Hospital');
  const [dropoffLocation, setDropoffLocation] = useState<string>('Home');

  // Searchable Dropdown Modal state
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
  const [activePickerType, setActivePickerType] = useState<'pickup' | 'dropoff'>('pickup');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');

  // Blinking cursor state
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (key: string) => {
    try {
      Vibration.vibrate(8);
    } catch {
      // ignore
    }

    setAmountStr((prev) => {
      if (key === 'backspace') {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      }

      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      // If current is '0', replace with new key
      if (prev === '0') {
        return key;
      }

      // Max 2 decimals if dot present
      if (prev.includes('.')) {
        const [, dec] = prev.split('.');
        if (dec && dec.length >= 2) return prev;
      }

      // Max 7 integer digits
      if (prev.replace('.', '').length >= 7) return prev;

      return prev + key;
    });
  };

  // Format with commas: e.g. 1250 -> 1,250 or 1250.50 -> 1,250.50
  const formatDisplayAmount = () => {
    if (!amountStr || amountStr === '0') return '0';
    if (amountStr.includes('.')) {
      const [intPart, decPart] = amountStr.split('.');
      const formattedInt = parseInt(intPart || '0', 10).toLocaleString('en-US');
      return `${formattedInt}.${decPart}`;
    }
    const parsed = parseInt(amountStr, 10);
    return isNaN(parsed) ? '0' : parsed.toLocaleString('en-US');
  };

  const displayAmount = formatDisplayAmount();
  const numericAmount = parseFloat(amountStr) || 0;

  // Breakdown values for confirmation screen (defaulting to $100 if user continues with default)
  const baseFare = numericAmount > 0 ? numericAmount : 100;
  const serviceCharge = baseFare * 0.04;
  const totalAmount = baseFare + serviceCharge;

  const baseFareFormatted = baseFare.toFixed(2);
  const serviceChargeFormatted = serviceCharge.toFixed(2);
  const totalAmountFormatted = totalAmount.toFixed(2);
  const [totalIntPart, totalDecPart] = totalAmountFormatted.split('.');

  // Continue from keypad to Confirm screen (Taxi) or directly to Payment (Other Business)
  const handleContinueToConfirm = () => {
    if (isOtherBusiness) {
      // Other business skips the taxi confirm/route/breakup screen and goes directly to payment
      const finalAmountFormatted =
        numericAmount > 0 ? numericAmount.toFixed(2) : '100.00';

      if (selectedMethod === 'card') {
        router.push({
          pathname: '/(tabs)/card-entry',
          params: {
            amount: finalAmountFormatted,
          },
        });
      } else if (selectedMethod === 'tap') {
        router.push({
          pathname: '/(tabs)/tap-ready',
          params: {
            amount: finalAmountFormatted,
          },
        });
      } else {
        router.push({
          pathname: '/(tabs)/payment-success',
          params: {
            amount: finalAmountFormatted,
            method: 'cash',
          },
        });
      }
      return;
    }

    // For Taxi businesses: Show confirm screen with route pickup/dropoff and surcharge breakup
    setScreenStep('confirm');
  };

  // Continue from Confirm Screen to Next Stage
  const handleFinalProceed = () => {
    if (selectedMethod === 'card') {
      router.push({
        pathname: '/(tabs)/card-entry',
        params: {
          amount: totalAmountFormatted,
          pickup: pickupLocation,
          dropoff: dropoffLocation,
        },
      });
    } else if (selectedMethod === 'tap') {
      router.push({
        pathname: '/(tabs)/tap-ready',
        params: {
          amount: totalAmountFormatted,
          pickup: pickupLocation,
          dropoff: dropoffLocation,
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/payment-success',
        params: {
          amount: totalAmountFormatted,
          method: 'cash',
        },
      });
    }
  };

  const handleCancel = () => {
    if (screenStep === 'confirm') {
      setScreenStep('amount');
    } else {
      router.back();
    }
  };

  // Open searchable dropdown
  const handleOpenLocationPicker = (type: 'pickup' | 'dropoff') => {
    setActivePickerType(type);
    setSearchLocationQuery('');
    setIsLocationModalVisible(true);
  };

  const handleSelectLocation = (locationName: string) => {
    if (activePickerType === 'pickup') {
      setPickupLocation(locationName);
    } else {
      setDropoffLocation(locationName);
    }
    setIsLocationModalVisible(false);
  };

  const handleClearDropoff = () => {
    setDropoffLocation('');
    handleOpenLocationPicker('dropoff');
  };

  // Filter locations
  const filteredLocations = useMemo(() => {
    if (!searchLocationQuery.trim()) return POPULAR_LOCATIONS;
    const q = searchLocationQuery.toLowerCase();
    return POPULAR_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.desc.toLowerCase().includes(q)
    );
  }, [searchLocationQuery]);

  // Header content by active method
  const getHeaderInfo = () => {
    switch (selectedMethod) {
      case 'card':
        return {
          title: 'Card Payment',
          subtitle: 'Accept secure card payments.',
        };
      case 'tap':
        return {
          title: 'Tap & Go',
          subtitle: 'Accept contactless payments with a tap.',
        };
      case 'cash':
        return {
          title: 'Cash Payment',
          subtitle: 'Accept secure cash payments.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. Header Bar ── */}
      <HeaderBar
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        showBack
        onBack={() => {
          if (screenStep === 'confirm') {
            setScreenStep('amount');
          } else {
            router.back();
          }
        }}
        rightAction={
          screenStep === 'amount' ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.settingsCircle}
              onPress={() => console.log('Settings clicked')}
            >
              <Ionicons name="settings-sharp" size={18} color="#64748B" />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── STEP 1: ENTER AMOUNT SCREEN (KEYPAD)                  ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {screenStep === 'amount' && (
        <View style={styles.contentWrap}>
          {/* Method Toggle Capsule */}
          <View style={styles.methodCapsuleOuter}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('tap')}
              style={[
                styles.methodSegment,
                selectedMethod === 'tap' && styles.methodSegmentActive,
              ]}
            >
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <Circle cx="8" cy="12" r="1.8" fill={selectedMethod === 'tap' ? '#0F172A' : '#475569'} />
                <Path d="M12 7 C14.5 9 14.5 15 12 17" stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
                <Path d="M16 4.5 C19.5 7.5 19.5 16.5 16 19.5" stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.methodLabel, selectedMethod === 'tap' && styles.methodLabelActive]}>
                Tap & Go
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('card')}
              style={[
                styles.methodSegment,
                selectedMethod === 'card' && styles.methodSegmentActive,
              ]}
            >
              <Feather name="credit-card" size={14} color={selectedMethod === 'card' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, selectedMethod === 'card' && styles.methodLabelActive]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('cash')}
              style={[
                styles.methodSegment,
                selectedMethod === 'cash' && styles.methodSegmentActive,
              ]}
            >
              <Ionicons name="cash-outline" size={16} color={selectedMethod === 'cash' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, selectedMethod === 'cash' && styles.methodLabelActive]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Route Card (Pickup & Drop-off Dropdown) */}
          {!isOtherBusiness ? (
            <View style={styles.routeCard}>
              <View style={styles.routeTimelineCol}>
                <View style={styles.pinCircle}>
                  <Ionicons name="location-sharp" size={14} color="#B45309" />
                </View>
                <View style={styles.timelineConnector} />
                <View style={styles.pinCircle}>
                  <Ionicons name="location-sharp" size={14} color="#B45309" />
                </View>
              </View>

              <View style={styles.routeDetailsCol}>
                {/* Pickup Point - Interactive Dropdown Tap */}
                <TouchableOpacity
                  style={styles.routeStopRow}
                  activeOpacity={0.7}
                  onPress={() => handleOpenLocationPicker('pickup')}
                >
                  <View style={styles.routeStopTextCol}>
                    <Text style={styles.routeTypeLabel}>PICKUP</Text>
                    <Text style={styles.routeLocationName}>{pickupLocation || 'Select Pickup'}</Text>
                  </View>
                  <Feather name="chevron-down" size={16} color="#94A3B8" />
                </TouchableOpacity>

                <View style={styles.routeDivider} />

                {/* Drop-off Point - Interactive Dropdown Tap */}
                <TouchableOpacity
                  style={styles.routeStopRow}
                  activeOpacity={0.7}
                  onPress={() => handleOpenLocationPicker('dropoff')}
                >
                  <View style={styles.routeStopTextCol}>
                    <Text style={styles.routeTypeLabel}>DROP OFF</Text>
                    <Text style={styles.routeLocationName}>{dropoffLocation || 'Select Drop Off'}</Text>
                  </View>

                  {dropoffLocation ? (
                    <TouchableOpacity
                      onPress={handleClearDropoff}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.closeIconCircle}
                    >
                      <Ionicons name="close" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <Feather name="chevron-down" size={16} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.merchantCard}>
              <View style={styles.badgeWrap}>
                <Image
                  source={require('../../../assets/crown_cuts_badge_hd.png')}
                  style={styles.crownBadgeImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.merchantTextCol}>
                <Text style={styles.merchantTitleText}>{user.businessName || 'Crown Cuts'}</Text>
                <Text style={styles.merchantSubtitleText}>{user.name || 'Soumen Sen'} • POS Terminal</Text>
              </View>
            </View>
          )}

          {/* Centered Amount to Charge Display */}
          <View style={styles.amountDisplayArea}>
            <Text style={styles.amountLabel}>AMOUNT TO CHARGE</Text>

            <View style={styles.amountRow}>
              <Text style={styles.dollarSign}>$</Text>
              <Text style={styles.amountDigits}>{displayAmount}</Text>
              <View style={[styles.cursorBar, { opacity: cursorVisible ? 1 : 0 }]} />
            </View>
          </View>

          {/* Action Buttons: Continue & Cancel */}
          <View style={styles.buttonsWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinueToConfirm}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* On-Screen Numeric Keypad */}
          <View style={styles.keypadContainer}>
            {KEYPAD_ROWS.map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.keypadKey}
                    activeOpacity={0.55}
                    onPress={() => handleKeyPress(k)}
                  >
                    {k === 'backspace' ? (
                      <Ionicons name="backspace-outline" size={22} color="#0F172A" />
                    ) : k === '.' ? (
                      <Text style={[styles.keyText, styles.dotKeyText]}>.</Text>
                    ) : (
                      <Text style={styles.keyText}>{k}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── STEP 2: CONFIRM SCREEN (100% MATCH WITH IMAGES 1 & 2) ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {screenStep === 'confirm' && (
        <View style={styles.confirmContentWrap}>
          {/* Method Toggle Capsule */}
          <View style={styles.methodCapsuleOuter}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('tap')}
              style={[
                styles.methodSegment,
                selectedMethod === 'tap' && styles.methodSegmentActive,
              ]}
            >
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <Circle cx="8" cy="12" r="1.8" fill={selectedMethod === 'tap' ? '#0F172A' : '#475569'} />
                <Path d="M12 7 C14.5 9 14.5 15 12 17" stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
                <Path d="M16 4.5 C19.5 7.5 19.5 16.5 16 19.5" stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.methodLabel, selectedMethod === 'tap' && styles.methodLabelActive]}>
                Tap & Go
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('card')}
              style={[
                styles.methodSegment,
                selectedMethod === 'card' && styles.methodSegmentActive,
              ]}
            >
              <Feather name="credit-card" size={14} color={selectedMethod === 'card' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, selectedMethod === 'card' && styles.methodLabelActive]}>
                Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('cash')}
              style={[
                styles.methodSegment,
                selectedMethod === 'cash' && styles.methodSegmentActive,
              ]}
            >
              <Ionicons name="cash-outline" size={16} color={selectedMethod === 'cash' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, selectedMethod === 'cash' && styles.methodLabelActive]}>
                Cash
              </Text>
            </TouchableOpacity>
          </View>

          {/* 1. Shift / Business Badge Card */}
          <View style={styles.shiftBadgeCard}>
            <View style={styles.shiftAvatarBox}>
              <Image
                source={require('../../../assets/taxi-logo.png')}
                style={styles.shiftAvatarImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.shiftBadgeTextCol}>
              <Text style={styles.shiftBadgeTitle}>Elite Taxi Service</Text>
              <Text style={styles.shiftBadgeSubtitle}>SHIFT:  26062021/M6061/537384</Text>
            </View>
          </View>

          {/* 2. Route Card */}
          <View style={styles.routeCard}>
            <View style={styles.routeTimelineCol}>
              <View style={styles.pinCircle}>
                <Ionicons name="location-sharp" size={14} color="#B45309" />
              </View>
              <View style={styles.timelineConnector} />
              <View style={styles.pinCircle}>
                <Ionicons name="location-sharp" size={14} color="#B45309" />
              </View>
            </View>

            <View style={styles.routeDetailsCol}>
              <TouchableOpacity
                style={styles.routeStopRow}
                activeOpacity={0.7}
                onPress={() => handleOpenLocationPicker('pickup')}
              >
                <View style={styles.routeStopTextCol}>
                  <Text style={styles.routeTypeLabel}>PICKUP</Text>
                  <Text style={styles.routeLocationName}>{pickupLocation}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.routeDivider} />

              <TouchableOpacity
                style={styles.routeStopRow}
                activeOpacity={0.7}
                onPress={() => handleOpenLocationPicker('dropoff')}
              >
                <View style={styles.routeStopTextCol}>
                  <Text style={styles.routeTypeLabel}>DROP OFF</Text>
                  <Text style={styles.routeLocationName}>{dropoffLocation}</Text>
                </View>
                {dropoffLocation ? (
                  <TouchableOpacity
                    onPress={handleClearDropoff}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeIconCircle}
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Summary Breakdown Card (Amount + Service Charge + Total) */}
          <View style={styles.summaryBreakdownCard}>
            {/* Top gold stripe accent */}
            <View style={styles.goldTopStripe} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelWrap}>
                <Text style={styles.summaryDollarIcon}>$ </Text>
                <Text style={styles.summaryLabel}>Amount</Text>
              </View>
              <Text style={styles.summaryValue}>${baseFareFormatted}</Text>
            </View>

            <View style={[styles.summaryRow, { marginTop: 14 }]}>
              <Text style={styles.summaryLabel}>+ Service Charge (4%)</Text>
              <Text style={styles.summaryValue}>${serviceChargeFormatted}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTotalRow}>
              <Text style={styles.totalMainLabel}>
                Total <Text style={styles.totalIncGst}>(INC GST)</Text>
              </Text>
              <Text style={styles.totalValue}>
                <Text style={styles.totalDollarGold}>$</Text>
                {totalIntPart}
                <Text style={styles.totalCents}>.{totalDecPart}</Text>
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Primary Action Button (Deep Blue #0A3977) */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.88}
            onPress={handleFinalProceed}
          >
            <Text style={styles.primaryActionText}>
              {selectedMethod === 'tap'
                ? 'Tap to Pay'
                : selectedMethod === 'card'
                  ? 'Continue to Charge'
                  : 'Confirm Cash Payment'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── INTERACTIVE SEARCHABLE LOCATION PICKER MODAL         ── */}
      {/* ────────────────────────────────────────────────────────── */}
      <Modal
        visible={isLocationModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.locationModalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setIsLocationModalVisible(false)}
          />

          <View style={styles.locationModalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>
                Select {activePickerType === 'pickup' ? 'Pickup' : 'Drop-off'} Location
              </Text>
              <TouchableOpacity
                onPress={() => setIsLocationModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchTextInput}
                value={searchLocationQuery}
                onChangeText={setSearchLocationQuery}
                placeholder="Search hospital, airport, address..."
                placeholderTextColor="#94A3B8"
                autoFocus
              />
              {searchLocationQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchLocationQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom Location Option if typing */}
            {searchLocationQuery.trim().length > 0 && (
              <TouchableOpacity
                style={styles.customLocationOption}
                activeOpacity={0.7}
                onPress={() => handleSelectLocation(searchLocationQuery.trim())}
              >
                <Ionicons name="navigate-circle-outline" size={20} color="#2563EB" style={{ marginRight: 8 }} />
                <Text style={styles.customLocationText}>
                  Use &quot;{searchLocationQuery.trim()}&quot;
                </Text>
              </TouchableOpacity>
            )}

            {/* Location Suggestions List */}
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectLocation(item.name)}
                >
                  <View style={styles.locationItemIconBox}>
                    <Ionicons name={item.icon} size={18} color="#0F172A" />
                  </View>
                  <View style={styles.locationItemTextWrap}>
                    <Text style={styles.locationItemName}>{item.name}</Text>
                    <Text style={styles.locationItemDesc}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  settingsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
  },
  confirmContentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14,
  },
  methodCapsuleOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 4,
    width: Math.min(SCREEN_WIDTH - 40, 340),
    alignSelf: 'center',
    marginBottom: 4,
  },
  methodSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 20,
    gap: 6,
  },
  methodSegmentActive: {
    backgroundColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  methodLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  shiftBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  shiftAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftAvatarImage: {
    width: 32,
    height: 32,
  },
  shiftBadgeTextCol: {
    flex: 1,
    gap: 2,
  },
  shiftBadgeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  shiftBadgeSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  routeTimelineCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 1.5,
    height: 14,
    backgroundColor: '#FDE047',
  },
  routeDetailsCol: {
    flex: 1,
  },
  routeStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  routeStopTextCol: {
    flex: 1,
  },
  routeTypeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  routeLocationName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  closeIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  badgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  crownBadgeImage: {
    width: '100%',
    height: '100%',
  },
  merchantTextCol: {
    flex: 1,
    gap: 2,
  },
  merchantTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  merchantSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  amountDisplayArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 6,
  },
  amountDigits: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  cursorBar: {
    width: 2.5,
    height: 34,
    backgroundColor: '#94A3B8',
    marginLeft: 4,
    borderRadius: 2,
  },
  buttonsWrap: {
    gap: 8,
    width: '100%',
  },
  continueButton: {
    height: 46,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  keypadContainer: {
    width: '100%',
    gap: 8,
    paddingTop: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    height: 46,
    backgroundColor: '#F4F6F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotKeyText: {
    fontSize: 22,
    marginTop: -6,
  },
  summaryBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  goldTopStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FBBF24',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDollarIcon: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D97706',
  },
  summaryLabel: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalMainLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalIncGst: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalDollarGold: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 15,
  },
  totalCents: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  primaryActionButton: {
    backgroundColor: colors.btnBlack,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A3977',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  locationModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  locationModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },
  customLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  customLocationText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationItemTextWrap: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  locationItemDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
});

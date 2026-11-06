import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Svg, Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { useConfirmModal } from '../../context/ConfirmModalContext';
import HeaderBar from '../../components/common/HeaderBar';
import { colors } from '../../constants/theme';
import { addTransaction } from '../../services/transactionStore';
import { paymentSession } from '../../services/paymentSession';
import {
  dashboardService,
  getActiveShiftSessionId,
  getAllowedPaymentMethods,
  onAllowedPaymentMethodsChange,
  type AllowedPaymentMethod,
} from '../../services/dashboardService';
import { shiftService, onShiftChange, ActiveShiftData } from '../../services/shiftService';
import { cashPaymentService } from '../../services/cashPaymentService';
import { paymentFeeService, type PaymentFeeData } from '../../services/paymentFeeService';
import { locationService, SuburbLocation } from '../../services/locationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaymentMethod = 'tap' | 'card' | 'cash';
type ScreenStep = 'amount' | 'confirm';

function mapMethodNameToKey(methodName: string): PaymentMethod | null {
  const normalized = (methodName || '').toLowerCase().trim();
  if (normalized.includes('tap')) return 'tap';
  if (normalized.includes('card')) return 'card';
  if (normalized.includes('cash')) return 'cash';
  return null;
}

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export default function TapToPayEnterAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reset?: string }>();
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

  // Interactive Route state (for Taxi business/owner/driver)
  const [pickupLocation, setPickupLocation] = useState<string>('');
  const [pickupId, setPickupId] = useState<number | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<string>('');
  const [dropoffId, setDropoffId] = useState<number | null>(null);

  // Searchable Suburb Dropdown Modal state
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
  const [activePickerType, setActivePickerType] = useState<'pickup' | 'dropoff'>('pickup');
  const [searchLocationQuery, setSearchLocationQuery] = useState<string>('');
  const [suburbResults, setSuburbResults] = useState<SuburbLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(false);

  // Dynamic Payment Fee State (POST /api/payment/fees for Taxi user types)
  const [dynamicFeeData, setDynamicFeeData] = useState<PaymentFeeData | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState<boolean>(false);

  // Dynamic Allowed Payment Methods from Dashboard
  const [allowedMethodsList, setAllowedMethodsList] = useState<AllowedPaymentMethod[] | null>(() => getAllowedPaymentMethods());

  useEffect(() => {
    const unsub = onAllowedPaymentMethodsChange((methods) => {
      setAllowedMethodsList(methods);
    });
    return () => unsub();
  }, []);

  const availableMethods: PaymentMethod[] = useMemo(() => {
    if (!allowedMethodsList || !Array.isArray(allowedMethodsList) || allowedMethodsList.length === 0) {
      return ['tap', 'card', 'cash'];
    }
    const result: PaymentMethod[] = [];
    allowedMethodsList.forEach((m) => {
      const mapped = mapMethodNameToKey(m.method_name);
      if (mapped && !result.includes(mapped)) {
        result.push(mapped);
      }
    });
    // Cash is always available for all user types regardless of backend allowed_payment_method
    if (!result.includes('cash')) {
      result.push('cash');
    }
    return result.length > 0 ? result : ['tap', 'card', 'cash'];
  }, [allowedMethodsList]);

  // Active method derived safely from availableMethods (eliminates setState in effect)
  const activeMethod: PaymentMethod = useMemo(() => {
    if (availableMethods.includes(selectedMethod)) {
      return selectedMethod;
    }
    return availableMethods[0] || 'tap';
  }, [availableMethods, selectedMethod]);

  // Reset payment state helper
  const resetPaymentState = useCallback(() => {
    setAmountStr('0');
    setScreenStep('amount');
    setSelectedMethod('tap');
    setPickupLocation('');
    setPickupId(null);
    setDropoffLocation('');
    setDropoffId(null);
    setSearchLocationQuery('');
    setSuburbResults([]);
    setIsLocationModalVisible(false);
    setDynamicFeeData(null);
    setIsLoadingFees(false);
  }, []);

  // Fetch suburbs dynamically from /api/location?search=<query>
  useEffect(() => {
    if (!isLocationModalVisible) return;
    let isMounted = true;
    const trimmed = searchLocationQuery.trim();

    const timer = setTimeout(async () => {
      try {
        if (isMounted) {
          setIsLoadingLocations(true);
        }
        const results = await locationService.searchLocations(trimmed);
        if (isMounted) {
          setSuburbResults(results);
        }
      } catch {
        if (isMounted) {
          setSuburbResults([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      }
    }, trimmed.length === 0 ? 0 : 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchLocationQuery, isLocationModalVisible]);

  // Subscribe to external payment reset events (e.g. from payment completion)
  useEffect(() => {
    const unsub = paymentSession.onReset(() => {
      resetPaymentState();
    });
    return () => unsub();
  }, [resetPaymentState]);

  // Reset when gaining focus if previous payment was completed or reset was requested
  useFocusEffect(
    useCallback(() => {
      if (paymentSession.consumePaymentReset() || params?.reset === '1') {
        resetPaymentState();
      }
    }, [params?.reset, resetPaymentState])
  );

  // Blinking cursor state
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // Shift & Cash Payment State (for both Business Owner and Employee)
  const { showAlert, showConfirm } = useConfirmModal();
  const [isOnShift, setIsOnShift] = useState<boolean>(true);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [activeShiftDisplayId, setActiveShiftDisplayId] = useState<string>('');
  const [isStartingShift, setIsStartingShift] = useState<boolean>(false);
  const [isProcessingCash, setIsProcessingCash] = useState<boolean>(false);

  // Verify and sync shift status from shiftService and dashboard
  const refreshShiftStatus = useCallback(async () => {
    try {
      const activeShift = shiftService.getActiveShift();
      if (activeShift?.id) {
        setIsOnShift(true);
        setActiveShiftId(activeShift.id);
        setActiveShiftDisplayId(activeShift.display_shift_id || String(activeShift.id));
        return;
      }

      const dash = await dashboardService.getDashboard();
      const onShift = Boolean(dash?.data?.is_on_shift && dash?.data?.active_shift?.id);
      setIsOnShift(onShift);
      setActiveShiftId(dash?.data?.active_shift?.id || null);
      setActiveShiftDisplayId(
        dash?.data?.active_shift?.display_shift_id ||
        (dash?.data?.active_shift?.id ? String(dash.data.active_shift.id) : '')
      );
    } catch {
      const fallbackShift = shiftService.getActiveShift();
      setIsOnShift(Boolean(fallbackShift?.id));
      setActiveShiftId(fallbackShift?.id || null);
      setActiveShiftDisplayId(
        fallbackShift?.display_shift_id || (fallbackShift?.id ? String(fallbackShift.id) : '')
      );
    }
  }, []);

  // Listen to external shift events
  useEffect(() => {
    const unsub = onShiftChange((shift: ActiveShiftData | null) => {
      setIsOnShift(Boolean(shift?.id));
      setActiveShiftId(shift?.id || null);
      setActiveShiftDisplayId(shift?.display_shift_id || (shift?.id ? String(shift.id) : ''));
    });
    return () => unsub();
  }, []);

  // Check shift status every time screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshShiftStatus();
    }, [refreshShiftStatus])
  );

  // Directly start a shift session for either Business Owner or Employee
  const handleStartShiftDirectly = async (): Promise<number | null> => {
    setIsStartingShift(true);
    try {
      const res = await shiftService.startShift();
      if (res?.status && res?.data?.active_shift?.id) {
        const sid = res.data.active_shift.id;
        const dispId = res.data.active_shift.display_shift_id || String(sid);
        setIsOnShift(true);
        setActiveShiftId(sid);
        setActiveShiftDisplayId(dispId);
        await dashboardService.getDashboard().catch(() => { });
        showAlert({
          title: 'Shift Started',
          message: `Shift #${dispId} is now active. You can now accept payments.`,
          type: 'success',
        });
        return sid;
      } else {
        showAlert({
          title: 'Shift Error',
          message: res?.message || 'Unable to start shift session. Please try again.',
          type: 'danger',
        });
        return null;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to start shift.';
      showAlert({
        title: 'Shift Start Error',
        message: msg,
        type: 'danger',
      });
      return null;
    } finally {
      setIsStartingShift(false);
    }
  };

  // Strictly enforce active shift before any payment (Tap, Card, Cash)
  const ensureActiveShift = async (): Promise<number | null> => {
    let sid = activeShiftId || (await getActiveShiftSessionId());
    if (sid) {
      setActiveShiftId(sid);
      setIsOnShift(true);
      return sid;
    }

    return new Promise<number | null>((resolve) => {
      showConfirm({
        title: 'Active Shift Required',
        message:
          'You must start your shift before taking payments. All card, tap, and cash transactions must be logged against an active shift session.\n\nWould you like to start your shift now?',
        confirmText: 'Start Shift',
        cancelText: 'Cancel',
        type: 'warning',
        onConfirm: async () => {
          const newSid = await handleStartShiftDirectly();
          resolve(newSid);
        },
        onCancel: () => {
          resolve(null);
        },
      });
    });
  };

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

  // Dynamic breakdown values for confirmation screen (strict numeric values, no mock defaults)
  const isCash = activeMethod === 'cash';

  const baseFare = dynamicFeeData ? dynamicFeeData.base_amount : numericAmount;
  const rawServiceCharge = dynamicFeeData
    ? dynamicFeeData.card_charge_fee_amount
    : baseFare * 0.04;
  const rawTotalAmount = dynamicFeeData
    ? dynamicFeeData.payment_amount
    : baseFare + rawServiceCharge;

  // For cash payments, service fee is $0.00 and customer pays baseFare
  const serviceCharge = isCash ? 0 : rawServiceCharge;
  const totalAmount = isCash ? baseFare : rawTotalAmount;

  const baseFareFormatted = baseFare.toFixed(2);
  const serviceChargeFormatted = serviceCharge.toFixed(2);
  const totalAmountFormatted = totalAmount.toFixed(2);
  const [totalIntPart, totalDecPart] = totalAmountFormatted.split('.');

  // Dynamic Service Charge Label (Percentage vs Fixed)
  const serviceChargeLabel = useMemo(() => {
    if (isCash) {
      return '+ Service Charge (0%)';
    }
    if (dynamicFeeData) {
      if (dynamicFeeData.card_charge_fee_type === 'percentage') {
        return `+ Service Charge (${dynamicFeeData.card_charge_fee}%)`;
      }
      return `+ Service Charge ($${dynamicFeeData.card_charge_fee.toFixed(2)})`;
    }
    return '+ Service Charge (4%)';
  }, [isCash, dynamicFeeData]);

  // Validation flags: Amount must be > 0; for Taxi roles, Pickup and Drop-off are strictly mandatory
  const isAmountValid = numericAmount > 0;
  const isTaxiReady =
    isOtherBusiness ||
    (Boolean(pickupId && pickupLocation && pickupLocation.trim() !== '' && pickupLocation !== 'Select Pickup') &&
      Boolean(dropoffId && dropoffLocation && dropoffLocation.trim() !== '' && dropoffLocation !== 'Select Drop Off'));
  const isReadyToContinue = isAmountValid && isTaxiReady;

  // Continue from keypad to Confirm screen (Taxi) or directly to Payment (Other Business)
  const handleContinueToConfirm = async () => {
    // 1. Amount validation (Mandatory for all user types)
    if (numericAmount <= 0) {
      showAlert({
        title: 'Amount Required',
        message: 'Please enter a valid amount greater than $0.00 to continue.',
        type: 'warning',
      });
      return;
    }

    // 2. Route validation: Pickup & Drop-off are mandatory for Taxi roles
    if (!isOtherBusiness) {
      if (!pickupId || !pickupLocation || pickupLocation.trim() === '' || pickupLocation === 'Select Pickup') {
        showAlert({
          title: 'Pickup Location Required',
          message: 'Selecting a Pickup location is mandatory. Please select a pickup suburb from the dropdown.',
          type: 'warning',
        });
        return;
      }

      if (!dropoffId || !dropoffLocation || dropoffLocation.trim() === '' || dropoffLocation === 'Select Drop Off') {
        showAlert({
          title: 'Drop-off Location Required',
          message: 'Selecting a Drop-off location is mandatory. Please select a drop-off suburb from the dropdown.',
          type: 'warning',
        });
        return;
      }
    }

    // 3. Strictly verify shift session before accepting payment
    const sid = await ensureActiveShift();
    if (!sid) return;

    if (isOtherBusiness) {
      // Other business skips the taxi confirm/route/breakup screen and goes directly to payment
      const finalAmountFormatted = numericAmount.toFixed(2);

      if (activeMethod === 'card') {
        router.push({
          pathname: '/(tabs)/card-entry',
          params: {
            amount: finalAmountFormatted,
          },
        });
      } else if (activeMethod === 'tap') {
        router.push({
          pathname: '/(tabs)/tap-ready',
          params: {
            amount: finalAmountFormatted,
          },
        });
      } else {
        // Record Cash Payment via POST /api/payment/cash
        setIsProcessingCash(true);
        try {
          const amt = numericAmount;
          const cashTxnData = await cashPaymentService.recordCashPayment({
            amount: amt,
            shift_session_id: sid,
          });

          const realTxnId = cashTxnData.transaction_id || `TXN-${Date.now()}`;
          const txnDate = cashTxnData.transaction_date || new Date().toISOString();

          addTransaction({
            id: String(cashTxnData.id || realTxnId),
            amount: amt,
            currency: '$',
            status: 'success',
            paymentMethod: 'Cash',
            paymentMethodType: 'cash' as any,
            cardLast4: '----',
            cardBrand: 'Cash',
            paymentId: realTxnId,
            storeName: user?.businessName || '--',
            timestamp: txnDate,
          });

          paymentSession.markPaymentCompleted();
          dashboardService.getDashboard().catch(() => { });

          router.push({
            pathname: '/(tabs)/payment-success',
            params: {
              amount: finalAmountFormatted,
              method: 'cash',
              paymentId: realTxnId,
              cardBrand: 'Cash',
              cardLast4: '----',
              approvalCode: cashTxnData.approval_code || '',
              timestamp: txnDate,
            },
          });
        } catch (cashErr: any) {
          const errMsg =
            cashErr?.response?.data?.message ||
            cashErr?.message ||
            'Failed to record cash payment. Please check your connection and try again.';
          showAlert({
            title: 'Cash Payment Failed',
            message: errMsg,
            type: 'danger',
          });
        } finally {
          setIsProcessingCash(false);
        }
      }
      return;
    }

    // For Taxi businesses: Call POST /api/payment/fees and transition to confirm screen with dynamic breakdown
    setIsLoadingFees(true);
    try {
      const feeRes = await paymentFeeService.getPaymentFee(numericAmount);
      setDynamicFeeData(feeRes);
      setScreenStep('confirm');
    } catch (feeErr: any) {
      const errMsg =
        feeErr?.response?.data?.message ||
        feeErr?.message ||
        'Failed to calculate payment fees. Please check your connection and try again.';
      showAlert({
        title: 'Fee Calculation Failed',
        message: errMsg,
        type: 'danger',
      });
    } finally {
      setIsLoadingFees(false);
    }
  };

  // Continue from Confirm Screen to Next Stage (Taxi)
  const handleFinalProceed = async () => {
    // 1. Amount validation
    if (numericAmount <= 0) {
      showAlert({
        title: 'Amount Required',
        message: 'Please enter a valid amount greater than $0.00 to continue.',
        type: 'warning',
      });
      return;
    }

    // 2. Route validation: Pickup & Drop-off are mandatory for Taxi roles
    if (!isOtherBusiness) {
      if (!pickupId || !pickupLocation || pickupLocation.trim() === '' || pickupLocation === 'Select Pickup') {
        showAlert({
          title: 'Pickup Location Required',
          message: 'Selecting a Pickup location is mandatory. Please select a pickup suburb from the dropdown.',
          type: 'warning',
        });
        return;
      }

      if (!dropoffId || !dropoffLocation || dropoffLocation.trim() === '' || dropoffLocation === 'Select Drop Off') {
        showAlert({
          title: 'Drop-off Location Required',
          message: 'Selecting a Drop-off location is mandatory. Please select a drop-off suburb from the dropdown.',
          type: 'warning',
        });
        return;
      }
    }

    // 3. Strictly verify shift session before proceeding
    const sid = await ensureActiveShift();
    if (!sid) return;

    if (activeMethod === 'card') {
      router.push({
        pathname: '/(tabs)/card-entry',
        params: {
          amount: totalAmountFormatted,
          service_charges: serviceChargeFormatted,
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          pickup_id: pickupId ? String(pickupId) : '',
          dropup_id: dropoffId ? String(dropoffId) : '',
          dropoff_id: dropoffId ? String(dropoffId) : '',
        },
      });
    } else if (activeMethod === 'tap') {
      router.push({
        pathname: '/(tabs)/tap-ready',
        params: {
          amount: totalAmountFormatted,
          service_charges: serviceChargeFormatted,
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          pickup_id: pickupId ? String(pickupId) : '',
          dropup_id: dropoffId ? String(dropoffId) : '',
          dropoff_id: dropoffId ? String(dropoffId) : '',
        },
      });
    } else {
      // Record Cash Payment via POST /api/payment/cash
      setIsProcessingCash(true);
      try {
        const amt = totalAmount;
        const cashTxnData = await cashPaymentService.recordCashPayment({
          amount: amt,
          shift_session_id: sid,
          service_charges: serviceCharge,
          pickup_id: pickupId ? Number(pickupId) : null,
          dropup_id: dropoffId ? Number(dropoffId) : null,
          dropoff_id: dropoffId ? Number(dropoffId) : null,
          pickup: pickupLocation,
          dropoff: dropoffLocation,
        });

        const realTxnId = cashTxnData.transaction_id || `TXN-${Date.now()}`;
        const txnDate = cashTxnData.transaction_date || new Date().toISOString();

        addTransaction({
          id: String(cashTxnData.id || realTxnId),
          amount: amt,
          currency: '$',
          status: 'success',
          paymentMethod: 'Cash',
          paymentMethodType: 'cash' as any,
          cardLast4: '----',
          cardBrand: 'Cash',
          paymentId: realTxnId,
          storeName: user?.businessName || '--',
          timestamp: txnDate,
        });

        paymentSession.markPaymentCompleted();
        dashboardService.getDashboard().catch(() => { });

        router.push({
          pathname: '/(tabs)/payment-success',
          params: {
            amount: totalAmountFormatted,
            method: 'cash',
            service_charges: serviceChargeFormatted,
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            pickup_id: pickupId ? String(pickupId) : '',
            dropup_id: dropoffId ? String(dropoffId) : '',
            dropoff_id: dropoffId ? String(dropoffId) : '',
            paymentId: realTxnId,
            cardBrand: 'Cash',
            cardLast4: '----',
            approvalCode: cashTxnData.approval_code || '',
            timestamp: txnDate,
          },
        });
      } catch (cashErr: any) {
        const errMsg =
          cashErr?.response?.data?.message ||
          cashErr?.message ||
          'Failed to record cash payment. Please check your connection and try again.';
        showAlert({
          title: 'Cash Payment Failed',
          message: errMsg,
          type: 'danger',
        });
      } finally {
        setIsProcessingCash(false);
      }
    }
  };

  const handleCancel = () => {
    if (screenStep === 'confirm') {
      setScreenStep('amount');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Open searchable dropdown
  const handleOpenLocationPicker = (type: 'pickup' | 'dropoff') => {
    setActivePickerType(type);
    setSearchLocationQuery('');
    setIsLocationModalVisible(true);
  };

  const handleSelectLocation = (suburbName: string, id?: number) => {
    Keyboard.dismiss();
    if (activePickerType === 'pickup') {
      setPickupLocation(suburbName);
      setPickupId(id ?? null);
    } else {
      setDropoffLocation(suburbName);
      setDropoffId(id ?? null);
    }
    setIsLocationModalVisible(false);
  };

  const handleSubmitSearch = () => {
    const query = searchLocationQuery.trim();
    if (!query) {
      Keyboard.dismiss();
      return;
    }

    // 1. If exactly one result or exact name match exists, select it
    if (suburbResults.length === 1) {
      handleSelectLocation(suburbResults[0].suburb, suburbResults[0].id);
      return;
    }
    const exactMatch = suburbResults.find(
      (item) => item.suburb.toLowerCase() === query.toLowerCase()
    );
    if (exactMatch) {
      handleSelectLocation(exactMatch.suburb, exactMatch.id);
      return;
    }

    // 2. If no matching suburbs found in directory, use the typed custom query
    if (suburbResults.length === 0 && !isLoadingLocations) {
      handleSelectLocation(query);
      return;
    }

    // 3. Otherwise dismiss keyboard to reveal all results clearly
    Keyboard.dismiss();
  };

  const handleClearDropoff = () => {
    setDropoffLocation('');
    setDropoffId(null);
    handleOpenLocationPicker('dropoff');
  };

  // Header content by active method
  const getHeaderInfo = () => {
    switch (activeMethod) {
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

  // Dynamic payment method capsule rendered from allowed_payment_method
  const renderMethodCapsule = () => (
    <View style={styles.methodCapsuleOuter}>
      {availableMethods.map((method) => {
        if (method === 'tap') {
          return (
            <TouchableOpacity
              key="tap"
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('tap')}
              style={[
                styles.methodSegment,
                activeMethod === 'tap' && styles.methodSegmentActive,
              ]}
            >
              <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <Circle cx="8" cy="12" r="1.8" fill={activeMethod === 'tap' ? '#0F172A' : '#475569'} />
                <Path d="M12 7 C14.5 9 14.5 15 12 17" stroke={activeMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
                <Path d="M16 4.5 C19.5 7.5 19.5 16.5 16 19.5" stroke={activeMethod === 'tap' ? '#0F172A' : '#475569'} strokeWidth="2.2" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.methodLabel, activeMethod === 'tap' && styles.methodLabelActive]}>
                Tap & Go
              </Text>
            </TouchableOpacity>
          );
        }

        if (method === 'card') {
          return (
            <TouchableOpacity
              key="card"
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('card')}
              style={[
                styles.methodSegment,
                activeMethod === 'card' && styles.methodSegmentActive,
              ]}
            >
              <Feather name="credit-card" size={14} color={activeMethod === 'card' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, activeMethod === 'card' && styles.methodLabelActive]}>
                Card
              </Text>
            </TouchableOpacity>
          );
        }

        if (method === 'cash') {
          return (
            <TouchableOpacity
              key="cash"
              activeOpacity={0.8}
              onPress={() => setSelectedMethod('cash')}
              style={[
                styles.methodSegment,
                activeMethod === 'cash' && styles.methodSegmentActive,
              ]}
            >
              <Ionicons name="cash-outline" size={16} color={activeMethod === 'cash' ? '#0F172A' : '#475569'} />
              <Text style={[styles.methodLabel, activeMethod === 'cash' && styles.methodLabelActive]}>
                Cash
              </Text>
            </TouchableOpacity>
          );
        }

        return null;
      })}
    </View>
  );

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
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        }}

      />

      {/* ────────────────────────────────────────────────────────── */}
      {/* ── STEP 1: ENTER AMOUNT SCREEN (KEYPAD)                  ── */}
      {/* ────────────────────────────────────────────────────────── */}
      {screenStep === 'amount' && (
        <View style={styles.contentWrap}>
          {/* Dynamic Method Toggle Capsule */}
          {renderMethodCapsule()}

          {/* Active Shift Required Warning (strictly enforced for both Owner & Employee) */}
          {!isOnShift && (
            <View style={styles.shiftWarningCard}>
              <View style={styles.shiftWarningHeader}>
                <Ionicons name="alert-circle" size={18} color="#B45309" />
                <Text style={styles.shiftWarningTitle}>Active Shift Required</Text>
              </View>
              <Text style={styles.shiftWarningSubtitle}>
                You must start your shift before taking payments. All card, contactless tap, and cash transactions must be logged under an active shift session.
              </Text>
              <TouchableOpacity
                style={styles.shiftStartButton}
                activeOpacity={0.85}
                onPress={handleStartShiftDirectly}
                disabled={isStartingShift}
              >
                {isStartingShift ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.shiftStartButtonText}>Start Shift to Accept Payments</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

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
                    <View style={styles.routeLabelRow}>
                      <Text style={styles.routeTypeLabel}>PICKUP</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    <Text
                      style={[
                        styles.routeLocationName,
                        !pickupLocation && styles.routeLocationPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {pickupLocation || 'Select Pickup '}
                    </Text>
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
                    <View style={styles.routeLabelRow}>
                      <Text style={styles.routeTypeLabel}>DROP OFF</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    <Text
                      style={[
                        styles.routeLocationName,
                        !dropoffLocation && styles.routeLocationPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {dropoffLocation || 'Select Drop Off '}
                    </Text>
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
                {user.logoUrl ? (
                  <Image
                    source={{ uri: user.logoUrl }}
                    style={styles.crownBadgeImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.fallbackLogoContainer}>
                    <Feather name="briefcase" size={20} color="#D97706" />
                  </View>
                )}
              </View>
              <View style={styles.merchantTextCol}>
                <Text style={styles.merchantTitleText}>{user.businessName || '--'}</Text>
                <Text style={styles.merchantSubtitleText}>
                  {user.name ? `${user.name} • ` : ''}POS Terminal
                </Text>
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
              style={[
                styles.continueButton,
                (!isOnShift || isProcessingCash || isLoadingFees || !isReadyToContinue) && styles.continueButtonDisabled,
              ]}
              disabled={isProcessingCash || isLoadingFees}
            >
              {isProcessingCash || isLoadingFees ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.continueButtonText,
                    (!isOnShift || !isReadyToContinue) && styles.continueButtonTextDisabled,
                  ]}
                >
                  {!isOnShift
                    ? 'Start Shift to Continue'
                    : !isAmountValid
                      ? 'Enter Amount to Continue'
                      : !isTaxiReady
                        ? 'Select Route to Continue'
                        : 'Continue'}
                </Text>
              )}
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
          {/* Dynamic Method Toggle Capsule */}
          {renderMethodCapsule()}

          {/* Active Shift Required Warning (strictly enforced for both Owner & Employee) */}
          {!isOnShift && (
            <View style={styles.shiftWarningCard}>
              <View style={styles.shiftWarningHeader}>
                <Ionicons name="alert-circle" size={18} color="#B45309" />
                <Text style={styles.shiftWarningTitle}>Active Shift Required</Text>
              </View>
              <Text style={styles.shiftWarningSubtitle}>
                You must start your shift before taking payments. All card, contactless tap, and cash transactions must be logged under an active shift session.
              </Text>
              <TouchableOpacity
                style={styles.shiftStartButton}
                activeOpacity={0.85}
                onPress={handleStartShiftDirectly}
                disabled={isStartingShift}
              >
                {isStartingShift ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="play" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.shiftStartButtonText}>Start Shift to Accept Payments</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* 1. Shift / Business Badge Card */}
          <View style={styles.shiftBadgeCard}>
            <View style={styles.shiftAvatarBox}>
              {user.logoUrl ? (
                <Image
                  source={{ uri: user.logoUrl }}
                  style={styles.shiftAvatarImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.fallbackAvatarBox}>
                  {isOtherBusiness ? (
                    <Feather name="briefcase" size={18} color="#B45309" />
                  ) : (
                    <Ionicons name="car-outline" size={20} color="#B45309" />
                  )}
                </View>
              )}
            </View>
            <View style={styles.shiftBadgeTextCol}>
              <Text style={styles.shiftBadgeTitle}>{user.businessName || '--'}</Text>
              <Text style={styles.shiftBadgeSubtitle}>
                {activeShiftDisplayId ? `SHIFT: ${activeShiftDisplayId}` : 'SHIFT: --'}
              </Text>
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
                  <View style={styles.routeLabelRow}>
                    <Text style={styles.routeTypeLabel}>PICKUP</Text>
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </View>
                  <Text
                    style={[
                      styles.routeLocationName,
                      !pickupLocation && styles.routeLocationPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {pickupLocation || 'Select Pickup '}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.routeDivider} />

              <TouchableOpacity
                style={styles.routeStopRow}
                activeOpacity={0.7}
                onPress={() => handleOpenLocationPicker('dropoff')}
              >
                <View style={styles.routeStopTextCol}>
                  <View style={styles.routeLabelRow}>
                    <Text style={styles.routeTypeLabel}>DROP OFF</Text>
                    <Text style={styles.requiredAsterisk}>*</Text>
                  </View>
                  <Text
                    style={[
                      styles.routeLocationName,
                      !dropoffLocation && styles.routeLocationPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {dropoffLocation || 'Select Drop Off '}
                  </Text>
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
              <Text style={styles.summaryLabel}>{serviceChargeLabel}</Text>
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
            style={[
              styles.primaryActionButton,
              (isProcessingCash || !isReadyToContinue) && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.88}
            onPress={handleFinalProceed}
            disabled={isProcessingCash}
          >
            {isProcessingCash ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.primaryActionText,
                  !isReadyToContinue && styles.continueButtonTextDisabled,
                ]}
              >
                {!isTaxiReady
                  ? 'Select Route to Continue'
                  : activeMethod === 'tap'
                    ? 'Tap to Pay'
                    : activeMethod === 'card'
                      ? 'Continue to Charge'
                      : 'Confirm Cash Payment'}
              </Text>
            )}
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
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsLocationModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.locationModalOverlay}
        >
          {/* Dimmed backdrop at top: tapping dismisses keyboard and closes modal */}
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setIsLocationModalVisible(false);
            }}
          />

          <View style={styles.locationModalSheet}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>
                  Select {activePickerType === 'pickup' ? 'Pickup' : 'Drop-off'} Location
                </Text>
                <Text style={styles.modalHeaderSubtitle}>
                  Search Australian suburbs or enter a custom address
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsLocationModalVisible(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchTextInput}
                value={searchLocationQuery}
                onChangeText={setSearchLocationQuery}
                placeholder="Search suburb, postcode, or location..."
                placeholderTextColor="#94A3B8"
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleSubmitSearch}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {isLoadingLocations ? (
                <ActivityIndicator size="small" color="#D97706" style={{ marginLeft: 6 }} />
              ) : searchLocationQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchLocationQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Custom Location Option if typing */}
            {searchLocationQuery.trim().length > 0 && (
              <TouchableOpacity
                style={styles.customLocationOption}
                activeOpacity={0.7}
                onPress={() => handleSelectLocation(searchLocationQuery.trim())}
              >
                <View style={styles.customLocationIconBox}>
                  <Ionicons name="navigate-circle" size={22} color="#2563EB" />
                </View>
                <View style={styles.customLocationTextCol}>
                  <Text style={styles.customLocationText} numberOfLines={1}>
                    Use &quot;{searchLocationQuery.trim()}&quot;
                  </Text>
                  <Text style={styles.customLocationSubtext} numberOfLines={1}>
                    Tap or press Search to set as {activePickerType === 'pickup' ? 'pickup' : 'drop-off'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={20} color="#2563EB" />
              </TouchableOpacity>
            )}

            {/* Dynamic Suburbs Suggestions List */}
            <FlatList
              data={suburbResults}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.locationListContent}
              ListEmptyComponent={
                !isLoadingLocations ? (
                  <View style={styles.emptyResultsBox}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="location-outline" size={26} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitleText}>
                      {searchLocationQuery.trim()
                        ? `No suburbs found for "${searchLocationQuery.trim()}"`
                        : 'Type to search Australian suburbs'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      {searchLocationQuery.trim()
                        ? `Tap "Use \\"${searchLocationQuery.trim()}\\"" above or press Search to use this location.`
                        : 'Search by suburb name, airport, or enter a custom address.'}
                    </Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  activeOpacity={0.7}
                  onPress={() => handleSelectLocation(item.suburb, item.id)}
                >
                  <View style={styles.locationItemIconBox}>
                    <Ionicons name="location-sharp" size={18} color="#D97706" />
                  </View>
                  <View style={styles.locationItemTextWrap}>
                    <Text style={styles.locationItemName}>{item.suburb}</Text>
                    <Text style={styles.locationItemDesc}>Australia</Text>
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
    overflow: 'hidden',
    padding: 3,
  },
  shiftAvatarImage: {
    width: '100%',
    height: '100%',
  },
  fallbackAvatarBox: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
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
  routeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTypeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  requiredAsterisk: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 3,
  },
  routeLocationName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  routeLocationPlaceholder: {
    color: '#94A3B8',
    fontWeight: '500',
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
    padding: 3,
  },
  crownBadgeImage: {
    width: '100%',
    height: '100%',
  },
  fallbackLogoContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalBackdropTouch: {
    height: Platform.OS === 'ios' ? 70 : 50,
    minHeight: 40,
  },
  locationModalSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  customLocationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  customLocationIconBox: {
    marginRight: 10,
  },
  customLocationTextCol: {
    flex: 1,
  },
  customLocationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  customLocationSubtext: {
    fontSize: 10.5,
    color: '#3B82F6',
    marginTop: 1,
  },
  locationListContent: {
    paddingBottom: 24,
    flexGrow: 1,
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
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationItemTextWrap: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  locationItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emptyResultsBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  shiftWarningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  shiftWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  shiftWarningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },
  shiftWarningSubtitle: {
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
    marginBottom: 10,
  },
  shiftStartButton: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  shiftStartButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  continueButtonDisabled: {
    opacity: 0.65,
    backgroundColor: '#334155',
  },
  continueButtonTextDisabled: {
    color: '#CBD5E1',
  },
});

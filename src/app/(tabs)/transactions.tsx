import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import ShiftDetailsScreen from '../../components/history/ShiftDetailsScreen';
import {
  TaxiBusinessHistoryScreen,
  TaxiDriverHistoryScreen,
  TaxiOwnerHistoryScreen,
} from '../../components/taxi';
import { OtherBusinessTransactionsScreen } from '../../components/other-business';
import { MOCK_SHIFTS } from '../../data/mockShifts';
import { ShiftRecord } from '../../types/shift';

export default function TransactionsTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string }>();
  const { user } = useAuth();

  // Derive selected shift directly from route params (React 19 best practice)
  const selectedShift = params.shiftId
    ? MOCK_SHIFTS.find((s) => {
        const idMatches = s.id === params.shiftId;
        const normalizedIdMatches =
          s.id.replace(/M[0-9]{4}/g, user.taxiNumber || 'M6022') === params.shiftId;
        return idMatches || normalizedIdMatches;
      }) || null
    : null;

  // Handle hardware back button on Android (called unconditionally)
  useEffect(() => {
    const backAction = () => {
      if (selectedShift) {
        router.setParams({ shiftId: '' });
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedShift, router]);

  // If user is Other Business (owner or employee), render Screen 23 Transactions History
  if (user.loginType === 'other_business' || user.loginType === 'other_business_employee') {
    return (
      <OtherBusinessTransactionsScreen
        businessName={user.businessName}
        userName={user.name}
      />
    );
  }

  const handleSelectShift = (shift: ShiftRecord) => {
    router.setParams({ shiftId: shift.id });
  };

  const handleBackToHistory = () => {
    router.setParams({ shiftId: '' });
  };

  if (selectedShift) {
    return (
      <ShiftDetailsScreen
        shift={selectedShift}
        onBack={handleBackToHistory}
      />
    );
  }

  // Role: Taxi Driver
  if (user.loginType === 'taxi_business_driver') {
    return (
      <TaxiDriverHistoryScreen
        onSelectShift={handleSelectShift}
        taxiNumber={user.taxiNumber || 'M6022'}
      />
    );
  }

  // Role: Taxi Owner
  if (user.loginType === 'taxi_owner') {
    return (
      <TaxiOwnerHistoryScreen
        onSelectShift={handleSelectShift}
        taxiNumber={user.taxiNumber || 'M6022'}
      />
    );
  }

  // Role: Taxi Business Company / Fleet Admin
  return (
    <TaxiBusinessHistoryScreen
      onSelectShift={handleSelectShift}
      taxiNumber={user.taxiNumber}
    />
  );
}

import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import ShiftHistoryScreen from '../../components/history/ShiftHistoryScreen';
import ShiftDetailsScreen from '../../components/history/ShiftDetailsScreen';
import { MOCK_SHIFTS } from '../../data/mockShifts';
import { ShiftRecord } from '../../types/shift';

export default function TransactionsTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string }>();
  const { user } = useAuth();

  // Derive selected shift directly from route params (React 19 best practice)
  const selectedShift = params.shiftId
    ? MOCK_SHIFTS.find((s) => s.id === params.shiftId) || null
    : null;

  // Handle hardware back button on Android
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

  return (
    <ShiftHistoryScreen
      onSelectShift={handleSelectShift}
      taxiNumber={user.taxiNumber || 'M6061'}
    />
  );
}

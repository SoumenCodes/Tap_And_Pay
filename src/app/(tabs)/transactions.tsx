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
import {
  OtherBusinessTransactionsScreen,
  OtherBusinessShiftDetailsScreen,
  OtherBusinessEmployeeHistoryScreen,
} from '../../components/other-business';
import { MOCK_SHIFTS } from '../../data/mockShifts';
import { ShiftRecord } from '../../types/shift';

export default function TransactionsTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string; empId?: string }>();
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
      if (params.shiftId) {
        router.setParams({ shiftId: '' });
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [params.shiftId, router]);

  // Role 5: Other Business Employee (Liam Hemsworth) - Dedicated Employee Shift History
  if (user.loginType === 'other_business_employee') {
    if (params.shiftId) {
      return (
        <OtherBusinessShiftDetailsScreen
          shiftId={params.shiftId}
          onBack={() => router.setParams({ shiftId: '' })}
          businessName={user.businessName}
          userName={user.name}
        />
      );
    }

    return (
      <OtherBusinessEmployeeHistoryScreen
        userName={user.name}
        empId={user.empId || '93822048'}
        onSelectShift={(shift) => router.setParams({ shiftId: shift.id })}
      />
    );
  }

  // Role 4: Other Business Owner (Merchant)
  if (user.loginType === 'other_business') {
    if (params.shiftId) {
      return (
        <OtherBusinessShiftDetailsScreen
          shiftId={params.shiftId}
          onBack={() => router.setParams({ shiftId: '' })}
          businessName={user.businessName}
          userName={user.name}
        />
      );
    }

    return (
      <OtherBusinessTransactionsScreen
        businessName={user.businessName}
        userName={user.name}
        initialEmpId={params.empId}
        onSelectShift={(shift) => router.setParams({ shiftId: shift.id })}
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

import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
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
import { ShiftRecordItem } from '../../services/shiftService';

export default function TransactionsTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string; empId?: string; driverId?: string }>();
  const { user } = useAuth();

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

  const handleSelectShift = (shift: ShiftRecordItem | any) => {
    const id = shift?.id ?? shift?.shift_id;
    if (id) {
      router.setParams({ shiftId: String(id) });
    }
  };

  const handleBackToHistory = () => {
    router.setParams({ shiftId: '' });
  };

  const handleEmployeeChange = (empId: string | null) => {
    router.setParams({ empId: empId || '' });
  };

  const handleDriverChange = (driverId: string | null) => {
    router.setParams({ driverId: driverId || '' });
  };

  // If a shift is selected, display live shift details
  if (params.shiftId) {
    return (
      <OtherBusinessShiftDetailsScreen
        shiftId={params.shiftId}
        onBack={handleBackToHistory}
        businessName={user.businessName}
        userName={user.name}
      />
    );
  }

  // Role 5: Other Business Employee (Liam Hemsworth) - Dedicated Employee Shift History
  if (user.loginType === 'other_business_employee') {
    return (
      <OtherBusinessEmployeeHistoryScreen
        userName={user.name}
        empId={user.empId || '93822048'}
        onSelectShift={handleSelectShift}
      />
    );
  }

  // Role 4: Other Business Owner (Merchant)
  if (user.loginType === 'other_business') {
    return (
      <OtherBusinessTransactionsScreen
        businessName={user.businessName}
        userName={user.name}
        initialEmpId={params.empId}
        onSelectShift={handleSelectShift}
        onEmployeeChange={handleEmployeeChange}
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
      initialDriverId={params.driverId}
      onDriverChange={handleDriverChange}
    />
  );
}

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ShiftDetailsScreen from '../components/history/ShiftDetailsScreen';
import { MOCK_SHIFTS } from '../data/mockShifts';

export default function ShiftDetailsRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shiftId?: string }>();

  const shift =
    (params.shiftId && MOCK_SHIFTS.find((s) => s.id === params.shiftId)) ||
    MOCK_SHIFTS[0];

  return (
    <ShiftDetailsScreen
      shift={shift}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/transactions');
        }
      }}
    />
  );
}

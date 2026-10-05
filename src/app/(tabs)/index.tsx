import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import OtherBusinessDashboard from '../../components/dashboard/OtherBusinessDashboard';
import TaxiDashboard from '../../components/dashboard/TaxiDashboard';

export default function DashboardScreen() {
  const { business } = useLocalSearchParams<{ business?: string }>();

  // If logged in as taxi, render TaxiDashboard; default to Other Business (Crown Cuts)
  if (business === 'taxi') {
    return <TaxiDashboard />;
  }

  return <OtherBusinessDashboard />;
}

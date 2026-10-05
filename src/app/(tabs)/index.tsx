import React from 'react';
import { useAuth } from '../../context/AuthContext';
import TaxiOwnerDashboard from '../../components/taxi/owner/TaxiOwnerDashboard';
import TaxiBusinessDashboard from '../../components/taxi/business/TaxiBusinessDashboard';
import OtherBusinessDashboard from '../../components/other-business/OtherBusinessDashboard';

export default function DashboardScreen() {
  const { user } = useAuth();

  if (user.loginType === 'taxi_owner') {
    return (
      <TaxiOwnerDashboard
        userName={user.name}
        taxiNumber={user.taxiNumber}
        sessionStartTime={user.sessionStartTime}
      />
    );
  }

  if (user.loginType === 'taxi_business') {
    return (
      <TaxiBusinessDashboard
        businessName={user.businessName}
        userName={user.name}
        taxiNumber={user.taxiNumber}
        sessionStartTime={user.sessionStartTime}
      />
    );
  }

  return (
    <OtherBusinessDashboard
      businessName={user.businessName}
      businessAddress={user.businessAddress}
      userName={user.name}
      sessionStartTime={user.sessionStartTime}
    />
  );
}

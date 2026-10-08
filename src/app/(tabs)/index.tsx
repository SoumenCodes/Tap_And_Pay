import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TaxiOwnerDashboard,
  TaxiBusinessDashboard,
  TaxiDriverDashboard,
} from '../../components/taxi';
import {
  OtherBusinessDashboard,
  OtherBusinessEmployeeDashboard,
} from '../../components/other-business';

export default function DashboardScreen() {
  const { user } = useAuth();

  // Role 1: Taxi Owner (Lovedeep Khangura)
  if (user.loginType === 'taxi_owner') {
    return (
      <TaxiOwnerDashboard
        businessName={user.businessName}
        userName={user.name}
        taxiNumber={user.taxiNumber}
        sessionStartTime={user.sessionStartTime}
      />
    );
  }

  // Role 2: Taxi Fleet Business Admin (Lovedeep Khangura - Fleet Admin)
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

  // Role 3: Taxi Business Driver (Gurpreet Singh)
  if (user.loginType === 'taxi_business_driver') {
    return (
      <TaxiDriverDashboard
        businessName={user.businessName}
        userName={user.name}
        taxiNumber={user.taxiNumber}
        sessionStartTime={user.sessionStartTime}
      />
    );
  }

  // Role 5: Other Business Employee (Liam Hemsworth)
  if (user.loginType === 'other_business_employee') {
    return (
      <OtherBusinessEmployeeDashboard
        businessName={user.businessName}
        businessAddress={user.businessAddress}
        userName={user.name}
        sessionStartTime={user.sessionStartTime}
      />
    );
  }

  // Role 4 (Default): Other Business Owner (Crown Cuts / Soumen)
  return (
    <OtherBusinessDashboard
      businessName={user.businessName}
      businessAddress={user.businessAddress}
      userName={user.name}
      sessionStartTime={user.sessionStartTime}
    />
  );
}

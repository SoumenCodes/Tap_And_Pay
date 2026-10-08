import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  TaxiOwnerProfileScreen,
  TaxiBusinessProfileScreen,
  TaxiDriverProfileScreen,
} from '../../components/taxi';
import {
  OtherBusinessProfileScreen,
  OtherBusinessEmployeeProfileScreen,
} from '../../components/other-business';

export default function ProfileTabScreen() {
  const { user } = useAuth();

  // Role 1: Taxi Owner
  if (user.loginType === 'taxi_owner') {
    return <TaxiOwnerProfileScreen />;
  }

  // Role 2: Taxi Business (Fleet Admin)
  if (user.loginType === 'taxi_business') {
    return <TaxiBusinessProfileScreen />;
  }

  // Role 3: Taxi Business Driver
  if (user.loginType === 'taxi_business_driver') {
    return <TaxiDriverProfileScreen />;
  }

  // Role 5: Other Business Employee
  if (user.loginType === 'other_business_employee') {
    return <OtherBusinessEmployeeProfileScreen />;
  }

  // Role 4: Other Business Merchant Owner (Crown Cuts)
  return <OtherBusinessProfileScreen />;
}

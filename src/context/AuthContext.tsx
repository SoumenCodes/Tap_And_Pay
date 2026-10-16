import React, { createContext, useContext, useState, ReactNode } from 'react';
import { authService } from '../services/authService';

export type LoginType =
  | 'taxi_owner'
  | 'taxi_business'
  | 'taxi_business_driver'
  | 'other_business'
  | 'other_business_employee';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  loginType: LoginType;
  roleLabel: string;
  businessName: string;
  businessAddress?: string;
  taxiNumber?: string;
  empId?: string;
  sessionStartTime: string;
}

export const MOCK_ACCOUNTS: Record<
  LoginType,
  { username: string; passwords: string[]; user: UserProfile }
> = {
  taxi_owner: {
    username: 'taxi_owner',
    passwords: ['owner123', '123456'],
    user: {
      id: 'usr_taxi_owner_01',
      username: 'taxi_owner',
      name: 'Harpreet Singh',
      loginType: 'taxi_owner',
      roleLabel: 'Taxi Owner',
      businessName: 'Harpreet Singh Taxi Service',
      taxiNumber: 'M6022',
      sessionStartTime: '7:30 AM',
    },
  },
  taxi_business: {
    username: 'taxi_business',
    passwords: ['fleet123', '123456'],
    user: {
      id: 'usr_taxi_biz_02',
      username: 'taxi_business',
      name: 'Lovedeep Khangura',
      loginType: 'taxi_business',
      roleLabel: 'Taxi Fleet Business',
      businessName: 'Elite Taxi Service',
      taxiNumber: 'M6061',
      sessionStartTime: '7:30 AM',
    },
  },
  taxi_business_driver: {
    username: 'taxi_driver',
    passwords: ['driver123', '123456'],
    user: {
      id: 'usr_taxi_driver_03',
      username: 'taxi_driver',
      name: 'Harpreet Singh',
      loginType: 'taxi_business_driver',
      roleLabel: 'Taxi Business Driver',
      businessName: 'Elite Taxi Service',
      taxiNumber: 'M6022',
      sessionStartTime: '7:30 AM',
    },
  },
  other_business: {
    username: 'other_business',
    passwords: ['business123', '123456'],
    user: {
      id: 'usr_other_biz_04',
      username: 'other_business',
      name: 'Soumen Sen',
      loginType: 'other_business',
      roleLabel: 'Merchant Owner',
      businessName: 'Crown Cuts',
      businessAddress: 'Suite 4, 120 Collins Street, Melbourne VIC',
      empId: '93821048',
      sessionStartTime: '7:30 AM',
    },
  },
  other_business_employee: {
    username: 'other_employee',
    passwords: ['staff123', '123456'],
    user: {
      id: 'usr_other_emp_05',
      username: 'other_employee',
      name: 'Liam Hemsworth',
      loginType: 'other_business_employee',
      roleLabel: 'Business Employee',
      businessName: 'Crown Cuts',
      businessAddress: 'Suite 4, 120 Collins Street, Melbourne VIC',
      sessionStartTime: '7:30 AM',
      empId: '93822048',
    },
  },
};

interface AuthContextType {
  user: UserProfile;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickLogin: (type: LoginType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to other_business for testing
  const [user, setUser] = useState<UserProfile>(MOCK_ACCOUNTS.other_business.user);

  const login = async (
    inputUsername: string,
    inputPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedUser = inputUsername.trim();
    const trimmedPass = inputPassword.trim();

    // 1. First attempt live stage API login
    try {
      const liveUser = await authService.login({
        username: trimmedUser,
        password: trimmedPass,
        deviceInfo: {
          platform: 'android',
          deviceId: 'D9F345A1-9721-4E65-B6E3-138240D9F7C2',
          appVersion: '1.0.0',
        },
      });
      setUser(liveUser);
      return { success: true };
    } catch (apiErr: any) {
      console.log('Live login attempt notice:', apiErr.message || apiErr);
      // If server returns explicit credential/auth error, we can check mock fallback
      // or surface error if it's not a local mock username
    }

    // 2. Mock fallback for local design review accounts
    const lowerUser = trimmedUser.toLowerCase();

    // 1. Taxi Owner
    if (
      lowerUser === 'taxi_owner' ||
      lowerUser === 'owner' ||
      lowerUser === 'owner@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_owner.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_owner.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "owner123" or "123456".' };
    }

    // 2. Taxi Business
    if (
      lowerUser === 'taxi_business' ||
      lowerUser === 'fleet' ||
      lowerUser === 'operator' ||
      lowerUser === 'fleet@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "fleet123" or "123456".' };
    }

    // 3. Taxi Business Driver
    if (
      lowerUser === 'taxi_driver' ||
      lowerUser === 'driver' ||
      lowerUser === 'taxi_business_driver' ||
      lowerUser === 'driver@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_business_driver.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_business_driver.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "driver123" or "123456".' };
    }

    // 4. Other Business (Owner)
    if (
      lowerUser === 'other_business' ||
      lowerUser === 'business' ||
      lowerUser === 'crowncuts' ||
      lowerUser === 'merchant@business.com'
    ) {
      if (MOCK_ACCOUNTS.other_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.other_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "business123" or "123456".' };
    }

    // 5. Other Business Employee
    if (
      lowerUser === 'other_employee' ||
      lowerUser === 'employee' ||
      lowerUser === 'staff' ||
      lowerUser === 'liam' ||
      lowerUser === 'staff@business.com'
    ) {
      if (MOCK_ACCOUNTS.other_business_employee.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.other_business_employee.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "staff123" or "123456".' };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your username and password.',
    };
  };

  const logout = () => {
    setUser(MOCK_ACCOUNTS.other_business.user);
  };

  const quickLogin = (type: LoginType) => {
    setUser(MOCK_ACCOUNTS[type].user);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, quickLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

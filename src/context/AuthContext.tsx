import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LoginType = 'taxi_owner' | 'taxi_business' | 'other_business';

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  loginType: LoginType;
  roleLabel: string;
  businessName: string;
  businessAddress?: string;
  taxiNumber?: string;
  sessionStartTime: string;
}

export const MOCK_ACCOUNTS: Record<LoginType, { username: string; passwords: string[]; user: UserProfile }> = {
  taxi_owner: {
    username: 'taxi_owner',
    passwords: ['owner123', '123456'],
    user: {
      id: 'usr_taxi_owner_01',
      username: 'taxi_owner',
      name: 'Lovedeep Khangura',
      loginType: 'taxi_owner',
      roleLabel: 'Taxi Owner',
      businessName: 'Elite Taxi Service',
      taxiNumber: 'M6061',
      sessionStartTime: '7:30 AM',
    },
  },
  taxi_business: {
    username: 'taxi_business',
    passwords: ['taxi123', '123456'],
    user: {
      id: 'usr_taxi_biz_02',
      username: 'taxi_business',
      name: 'Lovedeep Khangura',
      loginType: 'taxi_business',
      roleLabel: 'Taxi Business Driver',
      businessName: 'Elite Taxi Fleet',
      taxiNumber: 'M6061',
      sessionStartTime: '7:30 AM',
    },
  },
  other_business: {
    username: 'other_business',
    passwords: ['business123', '123456'],
    user: {
      id: 'usr_other_biz_03',
      username: 'other_business',
      name: 'Soumen',
      loginType: 'other_business',
      roleLabel: 'Merchant Owner',
      businessName: 'Crown Cuts',
      businessAddress: 'Suite 4, 120 Collins Street, Melbourne VIC',
      sessionStartTime: '7:30 AM',
    },
  },
};

interface AuthContextType {
  user: UserProfile;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  quickLogin: (type: LoginType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Default to other_business or taxi_business as needed
  const [user, setUser] = useState<UserProfile>(MOCK_ACCOUNTS.other_business.user);

  const login = (inputUsername: string, inputPassword: string): { success: boolean; error?: string } => {
    const trimmedUser = inputUsername.trim().toLowerCase();
    const trimmedPass = inputPassword.trim();

    // Check Taxi Owner
    if (
      trimmedUser === 'taxi_owner' ||
      trimmedUser === 'owner' ||
      trimmedUser === 'owner@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_owner.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_owner.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "owner123" or "123456".' };
    }

    // Check Taxi Business
    if (
      trimmedUser === 'taxi_business' ||
      trimmedUser === 'taxi' ||
      trimmedUser === 'driver' ||
      trimmedUser === 'driver@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "taxi123" or "123456".' };
    }

    // Check Other Business
    if (
      trimmedUser === 'other_business' ||
      trimmedUser === 'business' ||
      trimmedUser === 'crowncuts' ||
      trimmedUser === 'merchant@business.com'
    ) {
      if (MOCK_ACCOUNTS.other_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.other_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "business123" or "123456".' };
    }

    return {
      success: false,
      error: 'User not recognized. Choose: taxi_owner, taxi_business, or other_business.',
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

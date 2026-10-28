import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { tokenStorage } from '../services/tokenStorage';

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
    username: 'DC750001',
    passwords: ['Zafar@1986', 'owner123', '123456'],
    user: {
      id: '5',
      username: 'DC750001',
      name: 'Zafar Ansari',
      loginType: 'taxi_owner',
      roleLabel: 'Taxi Owner',
      businessName: 'Zafar Taxi Company',
      taxiNumber: 'EMP2026100720200630',
      empId: 'EMP2026100720200630',
      sessionStartTime: '7:30 AM',
    },
  },
  taxi_business: {
    username: 'zafar.dnk3@gmail.com',
    passwords: ['Zafar@1986', 'fleet123', '123456'],
    user: {
      id: '3',
      username: 'zafar.dnk3@gmail.com',
      name: 'Elite Taxi Service',
      loginType: 'taxi_business',
      roleLabel: 'Taxi Company (Taxi)',
      businessName: 'Elite Taxi Service',
      taxiNumber: 'EMP2026100720013735',
      empId: 'EMP2026100720013735',
      sessionStartTime: '7:30 AM',
    },
  },
  taxi_business_driver: {
    username: 'zafar.dnk5@gmail.com',
    passwords: ['Zafar@1986', 'driver123', '123456'],
    user: {
      id: 'EMP2026100720200245',
      username: 'zafar.dnk5@gmail.com',
      name: 'Zafar Driver',
      loginType: 'taxi_business_driver',
      roleLabel: 'Taxi Business Driver',
      businessName: 'Elite Taxi Service',
      taxiNumber: 'DC750030',
      empId: 'EMP2026100720200245',
      sessionStartTime: '7:30 AM',
    },
  },
  other_business: {
    username: 'zafar.dnk4@gmail.com',
    passwords: ['Zafar@1986', 'business123', '123456'],
    user: {
      id: '4',
      username: 'zafar.dnk4@gmail.com',
      name: 'Habibs',
      loginType: 'other_business',
      roleLabel: 'Other Business (Company)',
      businessName: 'Habibs',
      businessAddress: '19 WORONORA AVE, LEUMEAH, NSW 2560',
      empId: 'EMP2026100720101831',
      sessionStartTime: '7:30 AM',
    },
  },
  other_business_employee: {
    username: 'zafar.dnk9@gmail.com',
    passwords: ['Zafar@1986', 'staff123', '123456'],
    user: {
      id: 'EMP2026100720101878',
      username: 'zafar.dnk9@gmail.com',
      name: 'Habibs Employee',
      loginType: 'other_business_employee',
      roleLabel: 'Business Employee',
      businessName: 'Habibs',
      businessAddress: '19 WORONORA AVE, LEUMEAH, NSW 2560',
      sessionStartTime: '7:30 AM',
      empId: 'EMP2026100720101878',
    },
  },
};

interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLogin: (type: LoginType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(MOCK_ACCOUNTS.other_business.user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Restore encrypted session on cold start
  useEffect(() => {
    async function restoreSession() {
      try {
        const { user: storedUser, accessToken } = await tokenStorage.loadStoredSession();
        if (storedUser && accessToken) {
          setUser(storedUser);
          setIsAuthenticated(true);
          console.log('🔐 [AuthContext] Restored encrypted user session:', storedUser.name);
        }
      } catch (err) {
        console.warn('⚠️ [AuthContext] Could not restore session from storage:', err);
      } finally {
        setIsInitializing(false);
      }
    }

    restoreSession();
  }, []);

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
      setIsAuthenticated(true);
      return { success: true };
    } catch (apiErr: any) {
      console.log('Live login attempt notice:', apiErr.message || apiErr);
    }

    // 2. Mock fallback for local design review accounts
    const lowerUser = trimmedUser.toLowerCase();

    // 1. Taxi Owner (Owner Driver)
    // Userid = EMP2026100720200630 / zafar.dnk2@gmail.com / DC750001 / 9932783474
    if (
      lowerUser === 'dc750001' ||
      lowerUser === 'zafar.dnk2@gmail.com' ||
      lowerUser === 'emp2026100720200630' ||
      lowerUser === '9932783474' ||
      lowerUser === 'taxi_owner' ||
      lowerUser === 'owner' ||
      lowerUser === 'owner@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_owner.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_owner.user);
        setIsAuthenticated(true);
        await tokenStorage.saveUser(MOCK_ACCOUNTS.taxi_owner.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "Zafar@1986" or "owner123".' };
    }

    // 2. Taxi Company
    // Userid = EMP2026100720013735 / zafar.dnk3@gmail.com / 9932783472
    if (
      lowerUser === 'zafar.dnk3@gmail.com' ||
      lowerUser === 'emp2026100720013735' ||
      lowerUser === '9932783472' ||
      lowerUser === 'taxi_business' ||
      lowerUser === 'fleet' ||
      lowerUser === 'operator' ||
      lowerUser === 'fleet@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_business.user);
        setIsAuthenticated(true);
        await tokenStorage.saveUser(MOCK_ACCOUNTS.taxi_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "Zafar@1986" or "fleet123".' };
    }

    // 3. Normal Driver (Under Taxi Company)
    // Userid = EMP2026100720200245 / zafar.dnk5@gmail.com / DC750030 / 9932783478
    if (
      lowerUser === 'zafar.dnk5@gmail.com' ||
      lowerUser === 'dc750030' ||
      lowerUser === 'emp2026100720200245' ||
      lowerUser === '9932783478' ||
      lowerUser === 'taxi_driver' ||
      lowerUser === 'driver' ||
      lowerUser === 'taxi_business_driver' ||
      lowerUser === 'driver@taxi.com'
    ) {
      if (MOCK_ACCOUNTS.taxi_business_driver.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.taxi_business_driver.user);
        setIsAuthenticated(true);
        await tokenStorage.saveUser(MOCK_ACCOUNTS.taxi_business_driver.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "Zafar@1986" or "driver123".' };
    }

    // 4. Other Company (Other Business)
    // Userid = EMP2026100720101831 / zafar.dnk4@gmail.com / 9932783473
    if (
      lowerUser === 'zafar.dnk4@gmail.com' ||
      lowerUser === 'emp2026100720101831' ||
      lowerUser === '9932783473' ||
      lowerUser === 'other_business' ||
      lowerUser === 'business' ||
      lowerUser === 'habibs' ||
      lowerUser === 'crowncuts' ||
      lowerUser === 'merchant@business.com'
    ) {
      if (MOCK_ACCOUNTS.other_business.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.other_business.user);
        setIsAuthenticated(true);
        await tokenStorage.saveUser(MOCK_ACCOUNTS.other_business.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "Zafar@1986" or "business123".' };
    }

    // 5. Employees (Under Other Employee)
    // Userid = EMP2026100720101878 / zafar.dnk9@gmail.com / 9932783487
    if (
      lowerUser === 'zafar.dnk9@gmail.com' ||
      lowerUser === 'emp2026100720101878' ||
      lowerUser === '9932783487' ||
      lowerUser === 'other_employee' ||
      lowerUser === 'employee' ||
      lowerUser === 'staff' ||
      lowerUser === 'liam' ||
      lowerUser === 'staff@business.com'
    ) {
      if (MOCK_ACCOUNTS.other_business_employee.passwords.includes(trimmedPass)) {
        setUser(MOCK_ACCOUNTS.other_business_employee.user);
        setIsAuthenticated(true);
        await tokenStorage.saveUser(MOCK_ACCOUNTS.other_business_employee.user);
        return { success: true };
      }
      return { success: false, error: 'Invalid password. Use "Zafar@1986" or "staff123".' };
    }

    return {
      success: false,
      error: 'Invalid credentials. Please check your username and password.',
    };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(MOCK_ACCOUNTS.other_business.user);
    await authService.logout();
  };

  const quickLogin = (type: LoginType) => {
    const selectedUser = MOCK_ACCOUNTS[type].user;
    setUser(selectedUser);
    setIsAuthenticated(true);
    tokenStorage.saveUser(selectedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        login,
        logout,
        quickLogin,
      }}
    >
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

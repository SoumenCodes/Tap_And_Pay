import { apiClient } from './apiClient';
import { tokenStorage } from './tokenStorage';
import { LoginType, UserProfile } from '../context/AuthContext';

export interface LoginPayload {
  username: string;
  password: string;
  deviceInfo?: {
    platform?: string;
    deviceId?: string;
    appVersion?: string;
  };
}

export interface LoginApiResponse {
  status: string;
  message?: string;
  data: {
    tokens?: {
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number;
    };
    user: {
      id: string;
      username: string;
      name: string;
      loginType: LoginType;
      roleLabel?: string;
      businessName?: string;
      businessAddress?: string;
      taxiNumber?: string;
      empId?: string;
      sessionStartTime?: string;
      business?: {
        id?: string;
        businessName?: string;
        businessAddress?: string;
      };
    };
  };
}

export interface RequestOtpPayload {
  mobileNumber: string;
}

export interface VerifyOtpPayload {
  mobileNumber: string;
  otp: string;
}

export interface ResetPasswordPayload {
  mobileNumber: string;
  otp: string;
  newPassword: string;
}

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Log in user with credentials
   */
  login: async (payload: LoginPayload): Promise<UserProfile> => {
    const response = await apiClient.post<LoginApiResponse>('/api/v1/auth/login', payload);
    const data = response.data.data;

    // Save tokens if returned
    if (data.tokens?.accessToken) {
      tokenStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }

    const userData = data.user;
    const profile: UserProfile = {
      id: userData.id,
      username: userData.username,
      name: userData.name,
      loginType: userData.loginType,
      roleLabel: userData.roleLabel || 'User',
      businessName: userData.businessName || userData.business?.businessName || '',
      businessAddress: userData.businessAddress || userData.business?.businessAddress,
      taxiNumber: userData.taxiNumber,
      empId: userData.empId,
      sessionStartTime: userData.sessionStartTime || '7:30 AM',
    };

    return profile;
  },

  /**
   * Request OTP for forgot password
   */
  requestPasswordResetOtp: async (payload: RequestOtpPayload) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password/request-otp', payload);
    return response.data;
  },

  /**
   * Verify OTP
   */
  verifyPasswordResetOtp: async (payload: VerifyOtpPayload) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password/verify-otp', payload);
    return response.data;
  },

  /**
   * Reset Password
   */
  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password/reset', payload);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clearTokens();
    }
  },
};

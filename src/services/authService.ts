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

export interface BackendAddress {
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface BackendUserData {
  id: number | string;
  role_id?: number;
  user_type_key?: string;
  business_type?: string;
  driver_type?: string;
  parent_id?: number | null;
  employee_code?: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  full_name?: string;
  business_name?: string;
  email?: string;
  phone_no?: string;
  dob?: string | null;
  abn?: string;
  dc_number?: string;
  dl_number?: string;
  address?: BackendAddress;
  logo_url?: string | null;
  profile_photo_url?: string | null;
  registration_status?: string;
  parent_business?: any;
}

export interface StageLoginResponse {
  status: boolean;
  message: string;
  data: {
    user: BackendUserData;
    token?: string;
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    userTypeKey?: string;
    deviceInfo?: any;
  };
}

export interface ForgotPasswordPayload {
  username: string;
}

export interface ForgotPasswordResponse {
  status: boolean;
  message: string;
  data: {
    message?: string;
    expires_in?: number;
    dev_otp?: string;
  };
}

export interface VerifyOtpPayload {
  username: string;
  otp: string;
}

export interface VerifyOtpResponse {
  status: boolean;
  message: string;
  data: {
    temp_token?: string;
    expires_in?: number;
  };
}

export interface ResetPasswordPayload {
  tempToken: string;
  password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  status: boolean;
  message: string;
}

export interface LogoutPayload {
  deviceId?: string;
}

export interface LogoutResponse {
  status: boolean;
  message: string;
}

/**
 * Maps stage backend user_type_key to the app's supported LoginType
 */
export function mapBackendUserType(userTypeKey?: string): LoginType {
  switch (userTypeKey) {
    case 'taxi_owner':
      return 'taxi_owner';
    case 'taxi_business':
      return 'taxi_business';
    case 'taxi_business_driver':
    case 'taxi_driver':
      return 'taxi_business_driver';
    case 'other_business_employee':
    case 'business_employee':
      return 'other_business_employee';
    case 'other_business':
    default:
      return 'other_business';
  }
}

/**
 * Authentication API Service
 */
export const authService = {
  /**
   * Log in user with live stage API endpoint (/api/login)
   */
  login: async (payload: LoginPayload): Promise<UserProfile> => {
    const response = await apiClient.post<StageLoginResponse>('/api/login', payload);
    const resData = response.data.data;

    // Save tokens if returned
    const accessToken = resData.access_token || resData.token;
    if (accessToken) {
      await tokenStorage.setTokens(accessToken, resData.refresh_token);
      console.log('🔑 [AuthService] Successfully Received & Saved JWT Token:');
      console.log(`Bearer ${accessToken}\n`);
    }

    const u = resData.user;
    const loginType = mapBackendUserType(resData.userTypeKey || u.user_type_key);

    // Format address string
    let formattedAddress: string | undefined;
    if (u.address) {
      formattedAddress = [
        u.address.address_line1,
        u.address.address_line2,
        u.address.suburb,
        u.address.state,
        u.address.postcode,
      ]
        .filter(Boolean)
        .join(', ');
    }

    const profile: UserProfile = {
      id: String(u.id),
      username: payload.username,
      name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || payload.username,
      loginType,
      roleLabel:
        loginType === 'taxi_owner'
          ? 'Taxi Owner'
          : loginType === 'taxi_business'
          ? 'Taxi Fleet Business'
          : loginType === 'taxi_business_driver'
          ? 'Taxi Business Driver'
          : loginType === 'other_business_employee'
          ? 'Business Employee'
          : 'Merchant Owner',
      businessName: u.business_name || 'Taxi Service',
      businessAddress: formattedAddress,
      taxiNumber: u.dc_number || undefined,
      empId: u.employee_code || undefined,
      sessionStartTime: '',
    };

    // Save user profile to encrypted storage
    await tokenStorage.saveUser(profile);

    return profile;
  },

  /**
   * Request OTP for forgot password via stage API (/api/forgot-password)
   */
  requestPasswordResetOtp: async (
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post<ForgotPasswordResponse>(
      '/api/forgot-password',
      payload
    );
    return response.data;
  },

  /**
   * Verify OTP via stage API (/api/verify-otp)
   */
  verifyPasswordResetOtp: async (
    payload: VerifyOtpPayload
  ): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>(
      '/api/verify-otp',
      payload
    );
    return response.data;
  },

  /**
   * Reset Password via stage API (/api/reset-password)
   * Sends Authorization: Bearer <tempToken>
   */
  resetPassword: async (
    payload: ResetPasswordPayload
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post<ResetPasswordResponse>(
      '/api/reset-password',
      {
        password: payload.password,
        confirm_password: payload.confirm_password,
      },
      {
        headers: {
          Authorization: `Bearer ${payload.tempToken}`,
        },
      }
    );
    return response.data;
  },

  /**
   * Logout user via stage API (/api/logout)
   * Sends Authorization: Bearer <accessToken>
   */
  logout: async (payload?: LogoutPayload): Promise<LogoutResponse | null> => {
    try {
      const response = await apiClient.post<LogoutResponse>(
        '/api/logout',
        payload || {
          deviceId: 'D9F345A1-9721-4E65-B6E3-138240D9F7C2',
        }
      );
      return response.data;
    } catch {
      // Ignore network errors on logout
      return null;
    } finally {
      await tokenStorage.clearSession();
    }
  },
};

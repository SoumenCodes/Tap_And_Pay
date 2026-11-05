import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../context/AuthContext';

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sepay_access_token',
  REFRESH_TOKEN: 'sepay_refresh_token',
  USER_DATA: 'sepay_user_data',
  ALLOWED_PAYMENT_METHODS: 'sepay_allowed_payment_methods',
};

export interface AllowedPaymentMethodItem {
  id: number;
  method_name: string;
}

// In-memory cache for synchronous token retrieval in Axios request interceptors
let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let cachedUser: UserProfile | null = null;
let cachedAllowedPaymentMethods: AllowedPaymentMethodItem[] | null = null;

export const tokenStorage = {
  /**
   * Fast synchronous retrieval for Axios request interceptor
   */
  getAccessToken: (): string | null => {
    return cachedAccessToken;
  },

  /**
   * Fast synchronous retrieval for refresh token
   */
  getRefreshToken: (): string | null => {
    return cachedRefreshToken;
  },

  /**
   * Fast synchronous retrieval for current user profile
   */
  getCachedUser: (): UserProfile | null => {
    return cachedUser;
  },

  /**
   * Fast synchronous retrieval for allowed payment methods
   */
  getAllowedPaymentMethods: (): AllowedPaymentMethodItem[] | null => {
    return cachedAllowedPaymentMethods;
  },

  /**
   * Save allowed payment methods to storage and memory cache
   */
  saveAllowedPaymentMethods: async (methods: AllowedPaymentMethodItem[]): Promise<void> => {
    cachedAllowedPaymentMethods = methods;
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ALLOWED_PAYMENT_METHODS, JSON.stringify(methods));
    } catch (error) {
      console.warn('⚠️ [SecureStore] Failed to save allowed payment methods:', error);
    }
  },

  /**
   * Store access and refresh tokens into encrypted SecureStore and memory cache
   */
  setTokens: async (accessToken: string, refreshToken?: string): Promise<void> => {
    cachedAccessToken = accessToken;
    if (refreshToken) {
      cachedRefreshToken = refreshToken;
    }

    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (error) {
      console.warn('⚠️ [SecureStore] Failed to write tokens to encrypted storage:', error);
    }
  },

  /**
   * Save user profile data to encrypted SecureStore
   */
  saveUser: async (user: UserProfile): Promise<void> => {
    cachedUser = user;
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.warn('⚠️ [SecureStore] Failed to save user data:', error);
    }
  },

  /**
   * Load user profile and tokens from encrypted SecureStore on app cold start
   */
  loadStoredSession: async (): Promise<{
    user: UserProfile | null;
    accessToken: string | null;
    refreshToken: string | null;
  }> => {
    try {
      const [accessToken, refreshToken, userDataStr, methodsStr] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA),
        SecureStore.getItemAsync(STORAGE_KEYS.ALLOWED_PAYMENT_METHODS),
      ]);

      cachedAccessToken = accessToken;
      cachedRefreshToken = refreshToken;

      let user: UserProfile | null = null;
      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr) as UserProfile;
          cachedUser = user;
        } catch {
          user = null;
        }
      }

      if (methodsStr) {
        try {
          cachedAllowedPaymentMethods = JSON.parse(methodsStr);
        } catch {
          cachedAllowedPaymentMethods = null;
        }
      }

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.warn('⚠️ [SecureStore] Error loading stored session:', error);
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
      };
    }
  },

  /**
   * Clear all stored credentials and user session data (e.g. Logout / 401)
   */
  clearSession: async (): Promise<void> => {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    cachedAllowedPaymentMethods = null;

    try {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA),
        SecureStore.deleteItemAsync(STORAGE_KEYS.ALLOWED_PAYMENT_METHODS),
      ]);
    } catch (error) {
      console.warn('⚠️ [SecureStore] Error clearing session:', error);
    }
  },

  /**
   * Backward compatibility helpers
   */
  clearTokens: () => {
    tokenStorage.clearSession();
  },
};

export default tokenStorage;

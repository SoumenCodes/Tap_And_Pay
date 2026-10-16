import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../constants/config';
import { tokenStorage } from './tokenStorage';

/**
 * Standard API Client with Axios
 */
export const apiClient = axios.create({
  baseURL: config.backendUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor: Injects Authorization Bearer token into outgoing requests
 */
apiClient.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Formats standard errors and handles 401 unauthorized
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ message?: string; error?: string; code?: string }>) => {
    if (error.response?.status === 401) {
      // Clear token when session expires
      tokenStorage.clearTokens();
    }

    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please check your network connection.';

    const enhancedError = new Error(customMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).code = error.response?.data?.code || error.code;
    (enhancedError as any).raw = error;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;

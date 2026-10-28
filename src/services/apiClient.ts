import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
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
 * Request Interceptor:
 * 1. Attaches Authorization token if available.
 * 2. Logs full API Endpoint and Request Payload.
 */
apiClient.interceptors.request.use(
  (reqConfig: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }

    const fullUrl = `${reqConfig.baseURL || ''}${reqConfig.url || ''}`;
    const method = (reqConfig.method || 'GET').toUpperCase();

    console.log('\n================== 🚀 API REQUEST ==================');
    console.log(`[HTTP ${method}] ${fullUrl}`);
    console.log(`Authorization Token: ${token ? `Bearer ${token}` : 'None'}`);
    if (reqConfig.params) {
      console.log('Query Params:', JSON.stringify(reqConfig.params, null, 2));
    }
    if (reqConfig.data) {
      console.log('Payload:', JSON.stringify(reqConfig.data, null, 2));
    }
    console.log('====================================================\n');

    return reqConfig;
  },
  (error: AxiosError) => {
    console.log('\n❌ [API REQUEST ERROR]:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * 1. Logs full API Endpoint and Response Data.
 * 2. Formats errors and logs failed payloads/status.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    const method = (response.config.method || 'GET').toUpperCase();
    const token = tokenStorage.getAccessToken();

    console.log('\n================== ✅ API RESPONSE ==================');
    console.log(`[STATUS ${response.status}] [${method}] ${fullUrl}`);
    console.log(`Authorization Token: ${token ? `Bearer ${token}` : 'None'}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('=====================================================\n');

    return response;
  },
  async (error: AxiosError<{ message?: string; error?: string; code?: string }>) => {
    const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'UNKNOWN_URL';
    const method = error.config?.method?.toUpperCase() || 'HTTP';
    const status = error.response?.status || 'NO_RESPONSE';
    const token = tokenStorage.getAccessToken();

    console.log('\n================== ❌ API ERROR ===================');
    console.log(`[STATUS ${status}] [${method}] ${fullUrl}`);
    console.log(`Authorization Token: ${token ? `Bearer ${token}` : 'None'}`);
    if (error.response?.data) {
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error Message:', error.message);
    }
    console.log('====================================================\n');

    if (error.response?.status === 401) {
      // Clear token when session expires
      tokenStorage.clearTokens();
    }

    const responseData = error.response?.data as any;
    const customMessage =
      responseData?.messages?.message ||
      responseData?.messages?.error ||
      responseData?.message ||
      (typeof responseData?.error === 'string' ? responseData?.error : null) ||
      error.message ||
      'An unexpected error occurred. Please check your network connection.';

    const enhancedError = new Error(customMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).code = responseData?.code || error.code;
    (enhancedError as any).raw = error;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;

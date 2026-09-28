// Physical device connectivity: Use computer's local Wi-Fi IP (192.168.29.16)
// If running on an emulator or using adb reverse, http://127.0.0.1:3001 is also accessible.
const defaultBackendUrl = 'https://tap-and-pay.onrender.com';
const defaultPublishableKey =
  'pk_live_51PqQ1zLhXHmPsJKRm2kDpkzUJjNlZ6SZMtie7wWWNVTWptwjlo5e8sJONlisoxTacTtF8EAXW9Q77hWDWjxw2h3d788pePvvz4e';

export const config = {
  backendUrl: (process.env.EXPO_PUBLIC_BACKEND_URL || defaultBackendUrl).replace(/\/+$/, ''),
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || defaultPublishableKey,
  locationId: process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID || '',
  simulatedReader: process.env.EXPO_PUBLIC_SIMULATED_READER === 'true',
};

export default config;

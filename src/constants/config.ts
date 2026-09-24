// Physical device connectivity: Use computer's local Wi-Fi IP (192.168.29.99)
// If running on an emulator or using adb reverse, http://127.0.0.1:3001 is also accessible.
const defaultBackendUrl = 'http://192.168.29.99:3001';

export const config = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || defaultBackendUrl,
  locationId: process.env.EXPO_PUBLIC_STRIPE_LOCATION_ID || '',
  simulatedReader: process.env.EXPO_PUBLIC_SIMULATED_READER !== 'false',
};

export default config;

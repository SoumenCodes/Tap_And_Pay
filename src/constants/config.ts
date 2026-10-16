/**
 * Application & Environment Configuration
 * 
 * ----------------------------------------------------------------------------
 * 📍 TO CHANGE THE API BASE URL (e.g. Production):
 * Simply edit `backendUrl` below to your production URL.
 * Example:
 *   backendUrl: 'https://api.sepay.com'
 * ----------------------------------------------------------------------------
 */
export const config = {
  // Backend API Base URL
  backendUrl: 'https://sepay.stageserv.in',

  // Stripe Terminal Configuration
  publishableKey:
    'pk_live_51PqQ1zLhXHmPsJKRm2kDpkzUJjNlZ05ZMtie7wMMVTWptWjlo5e8sJONlisoxTacTtF0EAxM9Q77hWDMjxW2h3d700pePvvr4e',
  locationId: '',
  simulatedReader: false,
};

export default config;

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

  // Device Identifier
  defaultDeviceId: 'D9F345A1-9721-4E65-B6E3-138240D9F7C2',

  // Stripe Terminal Configuration (Live Mode)
  publishableKey:
    'pk_live_51PqQ1zLhXHmPsJKRm2kDpkzUJjNlZ05ZMtie7wMMVTWptWjlo5e8sJONlisoxTacTtF0EAxM9Q77hWDMjxW2h3d700pePvvr4e',
  locationId: 'tml_GrG7VQ6FCriCUw',
  simulatedReader: false,
};

export default config;

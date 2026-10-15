import Constants from 'expo-constants';

/**
 * ----------------------------------------------------------------------------
 * Global Application Configuration (Industry Standard)
 * ----------------------------------------------------------------------------
 * The single source of truth for the app version is `app.json` ("expo.version").
 * When building or submitting to Google Play Store / Apple App Store via EAS,
 * Expo reads from `app.json`.
 *
 * `Constants.expoConfig?.version` automatically reads that version at runtime.
 */
export const APP_CONFIG = {
  appName: Constants.expoConfig?.name || 'SE Pay',
  version: Constants.expoConfig?.version || '1.0.0',
  get displayVersion(): string {
    return `VERSION ${this.version}`;
  },
};

export default APP_CONFIG;

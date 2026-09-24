import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, NativeModules } from 'react-native';

import { AppNavigator } from './src/navigation/AppNavigator';
import { fetchConnectionToken } from './src/services/stripeApi';
import { TerminalProvider } from './src/context/TerminalContext';

// Dynamically load native StripeTerminalProvider only if native binary contains it
const hasNativeStripeTerminal = Boolean(NativeModules?.StripeTerminalReactNative);

let StripeTerminalProvider: React.ComponentType<any> | null = null;
if (hasNativeStripeTerminal) {
  try {
    StripeTerminalProvider =
      require('@stripe/stripe-terminal-react-native').StripeTerminalProvider;
  } catch (err) {
    console.warn('Could not load native StripeTerminalProvider:', err);
  }
}

export default function App() {
  const content = (
    <TerminalProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="dark" />
        <NavigationContainer
          theme={{
            dark: false,
            colors: {
              primary: '#2563EB',
              background: '#FFFFFF',
              card: '#FFFFFF',
              text: '#0F172A',
              border: '#F1F5F9',
              notification: '#2563EB',
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '800' },
            },
          }}
        >
          <AppNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </TerminalProvider>
  );

  return (
    <SafeAreaProvider>
      {StripeTerminalProvider ? (
        <StripeTerminalProvider
          tokenProvider={fetchConnectionToken}
          logLevel="verbose"
        >
          {content}
        </StripeTerminalProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
});

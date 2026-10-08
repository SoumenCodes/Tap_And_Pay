import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, NativeModules } from 'react-native';

import { fetchConnectionToken } from '../services/stripeApi';
import { TerminalProvider } from '../context/TerminalContext';

import { AuthProvider } from '../context/AuthContext';

import { EmployeeProvider } from '../context/EmployeeContext';

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

export default function RootLayout() {
  const content = (
    <AuthProvider>
      <TerminalProvider>
        <EmployeeProvider>
          <GestureHandlerRootView style={styles.root}>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: '#FFFFFF' },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="tap-to-pay" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="card-entry" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="tap-ready" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="processing" options={{ animation: 'fade' }} />
              <Stack.Screen name="payment-success" options={{ animation: 'fade' }} />
              <Stack.Screen name="receipt-details" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="shift-details" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="manage-employee" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="add-employee" options={{ animation: 'slide_from_right' }} />
            </Stack>
          </GestureHandlerRootView>
        </EmployeeProvider>
      </TerminalProvider>
    </AuthProvider>
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
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

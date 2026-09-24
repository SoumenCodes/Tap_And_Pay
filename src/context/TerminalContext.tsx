import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import type { Reader } from '@stripe/stripe-terminal-react-native';
import { config } from '../constants/config';
import {
  createPaymentIntentOnBackend,
  getCachedLocationId,
  fetchTerminalConfig,
} from '../services/stripeApi';
import type { PaymentMethodType, FeeBreakdown } from '../utils/feeCalculator';

interface TerminalContextValue {
  isInitialized: boolean;
  isConnecting: boolean;
  isProcessing: boolean;
  connectedReader: Reader.Type | null | undefined;
  statusMessage: string;
  errorMessage: string | null;
  initAndConnectSimulatedReader: () => Promise<boolean>;
  runSimulatedPayment: (
    amount: number,
    paymentMethod: PaymentMethodType,
    feeBreakdown?: FeeBreakdown
  ) => Promise<{ success: boolean; paymentIntent?: any; error?: string }>;
  clearError: () => void;
}

const TerminalContext = createContext<TerminalContextValue | null>(null);

const hasNativeTerminal = Boolean(NativeModules?.StripeTerminalReactNative);

// ─── 1. Simulated Provider (Safe for Expo Go without native binary) ───
const SimulatedTerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedReader, setConnectedReader] = useState<Reader.Type | null>(null);

  const initAndConnectSimulatedReader = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setStatusMessage('Connecting to simulated reader...');
    await new Promise((r) => setTimeout(r, 600));

    setConnectedReader({
      serialNumber: 'SIM-READER-EXPO-GO',
      label: 'Simulated Tap to Pay Reader',
      deviceType: 'tapToPay',
      simulated: true,
      locationId: getCachedLocationId() || config.locationId || 'loc_simulated',
      status: 'online',
    } as any);

    setStatusMessage('Reader ready');
    setIsConnecting(false);
    return true;
  }, []);

  const runSimulatedPayment = useCallback(
    async (
      amount: number,
      paymentMethod: PaymentMethodType,
      feeBreakdown?: FeeBreakdown
    ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> => {
      try {
        setIsProcessing(true);
        setErrorMessage(null);

        if (paymentMethod === 'card') {
          setStatusMessage('Authorizing card transaction with Stripe...');
          const intentRes = await createPaymentIntentOnBackend(amount, 'aud', 'card');
          setStatusMessage('Payment Successful');
          setIsProcessing(false);
          return {
            success: true,
            paymentIntent: {
              id: intentRes.paymentIntentId,
              amount: intentRes.amount,
              currency: intentRes.currency,
              status: intentRes.status || 'succeeded',
              charges:
                intentRes.charges && intentRes.charges.length > 0
                  ? intentRes.charges
                  : [
                      {
                        id: 'ch_' + Math.random().toString(36).substring(2, 9),
                        amount: intentRes.amount,
                        paymentMethodDetails: {
                          type: 'card',
                          cardDetails: { brand: 'Visa', last4: '4242' },
                        },
                      },
                    ],
            },
          };
        }

        // Tap to Pay Flow (in Expo Go)
        setStatusMessage('Connecting to simulated reader...');
        await new Promise((r) => setTimeout(r, 500));

        setStatusMessage('Creating PaymentIntent on backend...');
        const intentRes = await createPaymentIntentOnBackend(amount, 'aud', 'tap');
        console.log('📋 Created PaymentIntent on backend:', intentRes.paymentIntentId);

        setStatusMessage('Simulating contactless tap...');
        await new Promise((r) => setTimeout(r, 1200));

        setStatusMessage('Confirming payment with Stripe...');
        await new Promise((r) => setTimeout(r, 800));

        setStatusMessage('Payment Successful');
        setIsProcessing(false);

        return {
          success: true,
          paymentIntent: {
            id: intentRes.paymentIntentId,
            amount: intentRes.amount,
            currency: intentRes.currency,
            status: 'succeeded',
            charges: [
              {
                id: 'ch_' + Math.random().toString(36).substring(2, 9),
                amount: intentRes.amount,
                paymentMethodDetails: {
                  type: 'card_present',
                  cardPresentDetails: {
                    brand: 'Visa',
                    last4: '4242',
                  },
                },
              },
            ],
          },
        };
      } catch (err: any) {
        console.error('Payment processing failed:', err);
        const msg = err.message || 'Payment failed';
        setErrorMessage(msg);
        setStatusMessage('Payment Failed');
        setIsProcessing(false);
        return { success: false, error: msg };
      }
    },
    []
  );

  const clearError = () => setErrorMessage(null);

  return (
    <TerminalContext.Provider
      value={{
        isInitialized: true,
        isConnecting,
        isProcessing,
        connectedReader,
        statusMessage,
        errorMessage,
        initAndConnectSimulatedReader,
        runSimulatedPayment,
        clearError,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

// ─── 2. Native Provider (For Expo Development Build with real SDK) ───
const NativeTerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    useStripeTerminal,
    requestNeededAndroidPermissions,
  } = require('@stripe/stripe-terminal-react-native');

  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const discoveredReadersRef = useRef<Reader.Type[]>([]);

  const {
    initialize,
    discoverReaders,
    cancelDiscovering,
    connectReader,
    connectedReader,
    retrievePaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
    isInitialized,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: (readers: Reader.Type[]) => {
      console.log('📡 Discovered readers:', readers.length);
      discoveredReadersRef.current = readers;
    },
    onDidChangeConnectionStatus: (status: any) => {
      console.log('🔄 Terminal connection status changed:', status);
    },
    onDidChangePaymentStatus: (status: any) => {
      console.log('💳 Payment status changed:', status);
    },
  });

  useEffect(() => {
    async function init() {
      try {
        console.log('⚙️ Initializing Stripe Terminal SDK...');
        const { error } = await initialize();
        if (error) {
          console.error('Failed to initialize Stripe Terminal:', error);
          setErrorMessage(`SDK Init: ${error.message}`);
        } else {
          console.log('✅ Stripe Terminal initialized successfully');
        }
      } catch (err: any) {
        console.error('Terminal initialize exception:', err);
      }
    }
    init();
  }, [initialize]);

  const initAndConnectSimulatedReader = useCallback(async (): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);

      // 1. Check and request Android permissions if on Android
      if (Platform.OS === 'android') {
        setStatusMessage('Checking device permissions...');
        try {
          if (typeof requestNeededAndroidPermissions === 'function') {
            const permRes = await requestNeededAndroidPermissions();
            if (permRes?.error) {
              console.warn('⚠️ Missing Android permissions:', permRes.error);
            }
          }
        } catch (permEx) {
          console.warn('⚠️ Permission request error:', permEx);
        }
      }

      setStatusMessage('Initializing reader...');

      if (!isInitialized) {
        const { error: initError } = await initialize();
        if (initError) {
          throw new Error(initError.message);
        }
      }

      if (connectedReader) {
        setStatusMessage('Reader connected');
        setIsConnecting(false);
        return true;
      }

      try {
        await cancelDiscovering();
      } catch {
        // ignore
      }

      setStatusMessage(
        config.simulatedReader
          ? 'Discovering simulated reader...'
          : 'Initializing device NFC antenna...'
      );
      const { error: discoverError } = await discoverReaders({
        discoveryMethod: 'tapToPay',
        simulated: config.simulatedReader,
      });

      if (discoverError) {
        throw new Error(`Discover error: ${discoverError.message}`);
      }

      let attempts = 0;
      while (discoveredReadersRef.current.length === 0 && attempts < 15) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        attempts++;
      }

      const readerToConnect = discoveredReadersRef.current[0];
      if (!readerToConnect) {
        throw new Error(
          config.simulatedReader
            ? 'No simulated reader found during discovery.'
            : 'No Tap to Pay reader detected on device. Ensure NFC is enabled in Android settings.'
        );
      }

      setStatusMessage(config.simulatedReader ? 'Connecting to reader...' : 'Connecting NFC reader...');
      let locationId = getCachedLocationId() || config.locationId;
      if (!locationId || locationId === 'loc_simulated') {
        const termConfig = await fetchTerminalConfig();
        locationId = termConfig.locationId;
      }
      if (!locationId) {
        locationId = 'loc_simulated';
      }

      const { reader, error: connectError } = await connectReader({
        discoveryMethod: 'tapToPay',
        reader: readerToConnect,
        locationId,
        autoReconnectOnUnexpectedDisconnect: true,
      });

      if (connectError) {
        throw new Error(`Connect error: ${connectError.message}`);
      }

      console.log('✅ Connected to simulated reader:', reader?.serialNumber);
      setStatusMessage('Reader ready');
      setIsConnecting(false);
      return true;
    } catch (err: any) {
      console.error('Reader connection failure:', err);
      setErrorMessage(err.message || 'Failed to connect reader');
      setStatusMessage('Connection failed');
      setIsConnecting(false);
      return false;
    }
  }, [isInitialized, connectedReader, initialize, discoverReaders, cancelDiscovering, connectReader, requestNeededAndroidPermissions]);

  const runSimulatedPayment = useCallback(
    async (
      amount: number,
      paymentMethod: PaymentMethodType,
      feeBreakdown?: FeeBreakdown
    ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> => {
      try {
        setIsProcessing(true);
        setErrorMessage(null);

        if (paymentMethod === 'card') {
          setStatusMessage('Authorizing card transaction with Stripe...');
          const intentRes = await createPaymentIntentOnBackend(amount, 'aud', 'card');
          setStatusMessage('Payment Successful');
          setIsProcessing(false);
          return {
            success: true,
            paymentIntent: {
              id: intentRes.paymentIntentId,
              amount: intentRes.amount,
              currency: intentRes.currency,
              status: intentRes.status || 'succeeded',
              charges:
                intentRes.charges && intentRes.charges.length > 0
                  ? intentRes.charges
                  : [
                      {
                        id: 'ch_' + Math.random().toString(36).substring(2, 9),
                        amount: intentRes.amount,
                        paymentMethodDetails: {
                          type: 'card',
                          cardDetails: {
                            brand: 'Visa',
                            last4: '4242',
                          },
                        },
                      },
                    ],
            },
          };
        }

        // Tap to Pay flow with real native SDK
        if (!connectedReader) {
          setStatusMessage(
            config.simulatedReader
              ? 'Connecting simulated reader...'
              : 'Connecting device NFC reader...'
          );
          const connected = await initAndConnectSimulatedReader();
          if (!connected) {
            throw new Error(
              config.simulatedReader
                ? 'Could not connect to simulated reader. Please check backend connection.'
                : 'Could not connect to Tap to Pay reader. Ensure NFC is enabled and backend is online.'
            );
          }
        }

        setStatusMessage('Creating PaymentIntent on backend...');
        const intentRes = await createPaymentIntentOnBackend(amount, 'aud', 'tap');
        const { clientSecret } = intentRes;

        setStatusMessage('Retrieving payment details...');
        const { paymentIntent, error: retrieveError } = await retrievePaymentIntent(clientSecret);
        if (retrieveError || !paymentIntent) {
          throw new Error(retrieveError?.message || 'Could not retrieve payment intent');
        }

        setStatusMessage(
          config.simulatedReader
            ? 'Simulating contactless tap...'
            : 'Ready for tap. Hold card against the back of your phone...'
        );
        const { paymentIntent: collectedIntent, error: collectError } =
          await collectPaymentMethod({ paymentIntent });

        if (collectError || !collectedIntent) {
          throw new Error(collectError?.message || 'Payment method collection failed');
        }

        setStatusMessage('Confirming payment with Stripe...');
        const { paymentIntent: confirmedIntent, error: confirmError } =
          await confirmPaymentIntent({ paymentIntent: collectedIntent });

        if (confirmError || !confirmedIntent) {
          throw new Error(confirmError?.message || 'Payment confirmation failed');
        }

        setStatusMessage('Payment Successful');
        setIsProcessing(false);
        return { success: true, paymentIntent: confirmedIntent };
      } catch (err: any) {
        console.error('Payment processing failed:', err);
        const msg = err.message || 'Payment failed';
        setErrorMessage(msg);
        setStatusMessage('Payment Failed');
        setIsProcessing(false);
        return { success: false, error: msg };
      }
    },
    [
      connectedReader,
      initAndConnectSimulatedReader,
      retrievePaymentIntent,
      collectPaymentMethod,
      confirmPaymentIntent,
    ]
  );

  const clearError = () => setErrorMessage(null);

  return (
    <TerminalContext.Provider
      value={{
        isInitialized,
        isConnecting,
        isProcessing,
        connectedReader,
        statusMessage,
        errorMessage,
        initAndConnectSimulatedReader,
        runSimulatedPayment,
        clearError,
      }}
    >
      {children}
    </TerminalContext.Provider>
  );
};

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (hasNativeTerminal) {
    return <NativeTerminalProvider>{children}</NativeTerminalProvider>;
  }
  return <SimulatedTerminalProvider>{children}</SimulatedTerminalProvider>;
};

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};

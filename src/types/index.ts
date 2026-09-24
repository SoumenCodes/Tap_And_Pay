// Shared types across the application
import type { FeeBreakdown, PaymentMethodType } from '../utils/feeCalculator';

export type Currency = '$';

export interface Transaction {
  id: string;
  amount: number; // final amount charged
  originalAmount?: number;
  fee?: number;
  fixedFee?: number;
  percentageFee?: number;
  currency: Currency;
  status: 'success' | 'failed' | 'cancelled';
  paymentMethod: string; // e.g. "Tap to Pay" or "Card"
  paymentMethodType?: PaymentMethodType;
  cardLast4: string;
  cardBrand: string;
  paymentId: string;
  storeName: string;
  timestamp: Date;
}

export interface Store {
  id: string;
  name: string;
  businessName: string;
}

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  FeeConfirmation: {
    amount: number;
    paymentMethod: PaymentMethodType;
    currency: Currency;
  };
  TapReady: {
    amount: number; // final total
    feeBreakdown: FeeBreakdown;
    currency: Currency;
  };
  CardEntry: {
    amount: number; // final total
    feeBreakdown: FeeBreakdown;
    currency: Currency;
  };
  Processing: {
    amount: number;
    feeBreakdown?: FeeBreakdown;
    currency: Currency;
    paymentMethod: PaymentMethodType;
    cardDetails?: {
      last4: string;
      brand: string;
    };
  };
  Success: {
    amount: number;
    currency: Currency;
    transaction: Transaction;
  };
  Receipt: {
    transaction: Transaction;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  More: undefined;
};

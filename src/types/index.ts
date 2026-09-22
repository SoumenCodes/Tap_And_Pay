// Shared types across the application

export type Currency = '₹' | '$' | '£' | '€';

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  status: 'success' | 'failed' | 'cancelled';
  paymentMethod: string;
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
  Main: undefined;
  TapReady: { amount: number; currency: Currency };
  Processing: { amount: number; currency: Currency };
  Success: { amount: number; currency: Currency; transaction: Transaction };
  Receipt: { transaction: Transaction };
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  More: undefined;
};

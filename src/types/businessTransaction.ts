export interface BusinessTransaction {
  id: string; // e.g. '#TXN-984210'
  time: string; // e.g. '04:45 PM'
  date: string; // e.g. '26 October 2026'
  method: 'card' | 'tap_and_go';
  amount: number; // e.g. 106.00
  terminalId?: string; // e.g. '#537384'
  verification: string; // e.g. 'Settled via Terminal #537384', 'NFC Apple Pay Verified', 'NFC Google Wallet Verified'
  verificationType: 'terminal' | 'apple_pay' | 'google_pay';
  customerName?: string;
}

export interface BusinessTransactionStats {
  totalAmount: number; // 485.00
  totalCount: number; // 14
  cardAmount: number; // 320.00
  cardCount: number; // 9
  tapAndGoAmount: number; // 165.00
  tapAndGoCount: number; // 5
}

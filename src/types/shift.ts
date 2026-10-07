export interface ShiftTransaction {
  id: string; // e.g. '#TXN-984210'
  time: string; // e.g. '04:45 PM'
  date: string; // e.g. '26 October 2026'
  method: 'card' | 'tap_and_go';
  amount: number; // e.g. 106.00
  pickup: string; // e.g. 'St. Jude Medical Centre'
  dropoff: string; // e.g. '42 Richmond Road'
  verification: string; // e.g. 'Settled via Terminal #537384', 'NFC Apple Pay Verified', 'NFC Google Wallet Verified'
  verificationType: 'terminal' | 'apple_pay' | 'google_pay';
}

export interface ShiftRecord {
  id: string; // e.g. '26102026/M6061/537384'
  taxiNumber: string; // e.g. 'M6061'
  driverName: string; // e.g. 'Lovedeep Khangura'
  businessName: string; // e.g. 'Elite Taxi Service'
  dateText: string; // e.g. '26 Oct 2026'
  timeRange: string; // e.g. '07:30 AM – 05:00 PM'
  duration: string; // e.g. '9.5 hrs'
  status: 'paid' | 'unpaid';
  paidDate?: string; // e.g. '30 Oct 2026'
  tripsCount: number; // e.g. 14
  totalAmount: number; // e.g. 485.00
  cardCount: number; // e.g. 9
  cardAmount: number; // e.g. 320.00
  tapAndGoCount: number; // e.g. 5
  tapAndGoAmount: number; // e.g. 165.00
  terminalId: string; // e.g. '#537384'
  transactions: ShiftTransaction[];
}

export interface ShiftSummaryStats {
  totalCollection: number;
  paidAmount: number;
  paidShiftsCount: number;
  unpaidAmount: number;
  unpaidShiftsCount: number;
  allShiftsCount: number;
}

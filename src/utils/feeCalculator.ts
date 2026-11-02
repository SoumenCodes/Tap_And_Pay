export type PaymentMethodType = 'tap' | 'card' | 'cash';

export interface FeeBreakdown {
  originalAmount: number;
  percentageRate: number; // 0.017 for card/tap, 0 for cash
  percentageFee: number;
  fixedFee: number;
  totalFee: number;
  finalTotal: number;
  paymentMethod: PaymentMethodType;
}

/**
 * Calculates fee breakdown dynamically based on amount and payment method
 * Tap to Pay: 1.7% + $0.10
 * Card: 1.7% + $0.30
 * Cash: $0.00 fee
 */
export function calculateFee(amount: number, method: PaymentMethodType): FeeBreakdown {
  if (method === 'cash') {
    return {
      originalAmount: amount,
      percentageRate: 0,
      percentageFee: 0,
      fixedFee: 0,
      totalFee: 0,
      finalTotal: amount,
      paymentMethod: method,
    };
  }

  const percentageRate = 0.017;
  // 1.7% fee rounded to 2 decimal places
  const percentageFee = Math.round(amount * percentageRate * 100) / 100;
  // Fixed fee: 0.10 for Tap to Pay, 0.30 for Card
  const fixedFee = method === 'tap' ? 0.10 : 0.30;
  // Total transaction fee
  const totalFee = Math.round((percentageFee + fixedFee) * 100) / 100;
  // Final total to charge customer
  const finalTotal = Math.round((amount + totalFee) * 100) / 100;

  return {
    originalAmount: amount,
    percentageRate,
    percentageFee,
    fixedFee,
    totalFee,
    finalTotal,
    paymentMethod: method,
  };
}

/**
 * Formats a number to currency string with $ symbol and 2 decimal places
 * e.g., 100 -> $100.00, 101.8 -> $101.80
 */
export function formatAUD(amount: number): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

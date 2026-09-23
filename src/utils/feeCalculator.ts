export type PaymentMethodType = 'tap' | 'card';

export interface FeeBreakdown {
  originalAmount: number;
  percentageRate: number; // 0.017
  percentageFee: number;
  fixedFee: number;
  totalFee: number;
  finalTotal: number;
  paymentMethod: PaymentMethodType;
}

/**
 * Calculates fee breakdown dynamically based on amount and payment method
 * Tap to Pay: 1.7% + A$0.10
 * Card: 1.7% + A$0.30
 */
export function calculateFee(amount: number, method: PaymentMethodType): FeeBreakdown {
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
 * Formats a number to AUD currency string with A$ symbol and 2 decimal places
 * e.g., 100 -> A$100.00, 101.8 -> A$101.80
 */
export function formatAUD(amount: number): string {
  const formatted = amount.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `A$${formatted}`;
}

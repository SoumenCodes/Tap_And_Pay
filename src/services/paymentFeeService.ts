import { apiClient } from './apiClient';
import { appLogger } from './appLogger';

export interface PaymentFeePayload {
  receipt_amount: number;
}

export interface PaymentFeeData {
  card_charge_fee: number;
  card_charge_fee_type: 'percentage' | 'fixed' | string;
  user_id: number;
  user_type_key: string;
  payment_amount: number;
  base_amount: number;
  card_charge_fee_amount: number;
}

export interface PaymentFeeResponse {
  status: boolean;
  message: string;
  data: PaymentFeeData;
}

export const paymentFeeService = {
  /**
   * POST /api/payment/fees
   * Fetches dynamic card charge fee and total breakup for taxi transactions.
   * Sends both FormData and query parameter for robust cross-environment compatibility.
   */
  getPaymentFee: async (receiptAmount: number): Promise<PaymentFeeData> => {
    appLogger.info('PAYMENT_FEES', `Fetching payment fee for amount $${receiptAmount}`);
    try {
      const formData = new FormData();
      formData.append('receipt_amount', String(receiptAmount));

      const response = await apiClient.post<PaymentFeeResponse>(
        '/api/payment/fees',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: {
            receipt_amount: receiptAmount,
          },
        }
      );

      appLogger.info('PAYMENT_FEES', 'Payment fee response:', response.data);

      if (!response.data?.status || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to retrieve payment fees');
      }

      const raw = response.data.data;
      const cardChargeFee = Number(raw.card_charge_fee) || 0;
      const feeType = (raw.card_charge_fee_type || 'percentage').toLowerCase();

      const baseAmount =
        raw.base_amount !== null && raw.base_amount !== undefined
          ? Number(raw.base_amount)
          : receiptAmount;

      const feeAmount =
        raw.card_charge_fee_amount !== null && raw.card_charge_fee_amount !== undefined
          ? Number(raw.card_charge_fee_amount)
          : feeType === 'percentage'
            ? Math.round(baseAmount * (cardChargeFee / 100) * 100) / 100
            : cardChargeFee;

      const paymentAmount =
        raw.payment_amount !== null && raw.payment_amount !== undefined
          ? Number(raw.payment_amount)
          : Math.round((baseAmount + feeAmount) * 100) / 100;

      return {
        card_charge_fee: cardChargeFee,
        card_charge_fee_type: feeType,
        user_id: raw.user_id,
        user_type_key: raw.user_type_key,
        payment_amount: paymentAmount,
        base_amount: baseAmount,
        card_charge_fee_amount: feeAmount,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to calculate payment fees';
      appLogger.error('PAYMENT_FEES', `Failed to retrieve payment fees: ${errorMsg}`, err);
      throw new Error(errorMsg);
    }
  },
};

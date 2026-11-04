import { apiClient } from './apiClient';
import { appLogger } from './appLogger';

export interface CashPaymentPayload {
  amount: number;
  shift_session_id: number | string;
  pickup_id?: number | string | null;
  dropoff_id?: number | string | null;
  pickup?: string | null;
  dropoff?: string | null;
}

export interface CashPaymentData {
  id: number;
  transaction_id: string;
  shift_session_id: number;
  user_id: number;
  amount: number;
  amount_formatted: string;
  service_fee: number;
  driver_payout: number;
  payment_method: string;
  account_type: string;
  payment_status: string;
  approval_code: string;
  transaction_date: string;
}

export interface CashPaymentResponse {
  status: boolean;
  message: string;
  data: CashPaymentData;
}

export const cashPaymentService = {
  /**
   * POST /api/payment/cash
   * Records a cash payment against the active shift session.
   * Usable by both Business Owner and Employee.
   */
  recordCashPayment: async (payload: CashPaymentPayload): Promise<CashPaymentData> => {
    appLogger.info('CASH_PAYMENT', 'Sending cash payment to backend:', payload);
    try {
      const response = await apiClient.post<CashPaymentResponse>('/api/payment/cash', payload);
      appLogger.info('CASH_PAYMENT', 'Cash payment response:', response.data);

      if (!response.data?.status || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to record cash payment');
      }

      return response.data.data;
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Cash payment could not be processed.';
      appLogger.error('CASH_PAYMENT', `Cash payment failed: ${errorMsg}`, err);
      throw new Error(errorMsg);
    }
  },
};

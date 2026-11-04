import { apiClient } from './apiClient';
import { appLogger } from './appLogger';

export interface CashPaymentPayload {
  amount: number;
  shift_session_id: number | string;
  service_charges?: number | null;
  pickup_id?: number | string | null;
  dropup_id?: number | string | null;
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
    const cleanPayload: Record<string, any> = {
      amount: payload.amount,
      shift_session_id: payload.shift_session_id,
    };

    if (payload.service_charges !== undefined && payload.service_charges !== null) {
      cleanPayload.service_charges = Number(payload.service_charges) || 0;
    }
    if (payload.pickup_id !== undefined && payload.pickup_id !== null && payload.pickup_id !== '') {
      const pId = Number(payload.pickup_id);
      cleanPayload.pickup_id = !isNaN(pId) ? pId : payload.pickup_id;
    }
    const rawDropId = payload.dropup_id ?? payload.dropoff_id;
    if (rawDropId !== undefined && rawDropId !== null && rawDropId !== '') {
      const dId = Number(rawDropId);
      cleanPayload.dropup_id = !isNaN(dId) ? dId : rawDropId;
      cleanPayload.dropoff_id = !isNaN(dId) ? dId : rawDropId;
    }
    if (payload.pickup) cleanPayload.pickup = payload.pickup;
    if (payload.dropoff) cleanPayload.dropoff = payload.dropoff;

    appLogger.info('CASH_PAYMENT', 'Sending cash payment to backend:', cleanPayload);
    try {
      const response = await apiClient.post<CashPaymentResponse>('/api/payment/cash', cleanPayload);
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

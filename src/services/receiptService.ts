import { apiClient } from './apiClient';
import { appLogger } from './appLogger';
import { normalizeImageUrl } from '../utils/assetUtils';

export interface PaymentBreakDown {
  payable_amount?: number;
  base_amount?: number;
  service_fee?: number;
}

export interface ReceiptData {
  business_name?: string;
  business_logo?: string | null;
  abn?: string | null;
  phone_no?: string | null;
  phone?: string | null;
  address?: string | null;
  employee_id?: string | null;
  amount?: number;
  amount_formatted?: string;
  payment_status?: string;
  date_time?: string;
  payment_type?: string | null;
  payment_method?: string;
  payment_method_badge?: string;
  card_brand?: string;
  card_last4?: string;
  payment_id?: string;
  ad_banner?: boolean;
  banner_image_url?: string | null;
  // Taxi / Driver extensions
  taxi_number?: string | null;
  taxi_no?: string | null;
  dc_number?: string | null;
  pickup_location?: string | null;
  drop_location?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  approval_code?: string | null;
  payment_break_down?: PaymentBreakDown | null;
}

export interface ReceiptApiResponse {
  status: boolean;
  message: string;
  data: ReceiptData;
}

// In-memory cache to share between payment-success and receipt-details
const receiptCache = new Map<string, ReceiptData>();

export const receiptService = {
  /**
   * GET /api/receipt/:id
   * Fetches the official server-verified receipt by payment intent ID or transaction ID.
   */
  getReceipt: async (paymentId: string): Promise<ReceiptData> => {
    if (!paymentId || paymentId.trim() === '' || paymentId === '--') {
      throw new Error('Invalid payment ID for receipt lookup');
    }

    const cleanId = paymentId.trim();

    // Check memory cache first
    const cached = receiptCache.get(cleanId);
    if (cached) {
      return cached;
    }

    try {
      appLogger.info('RECEIPT_SERVICE', `Fetching receipt for ID: ${cleanId}`);
      const response = await apiClient.get<ReceiptApiResponse>(`/api/receipt/${cleanId}`);

      if (!response.data?.status || !response.data?.data) {
        throw new Error(response.data?.message || 'Failed to retrieve receipt.');
      }

      const receipt = response.data.data;
      if (receipt.business_logo) {
        receipt.business_logo = normalizeImageUrl(receipt.business_logo);
      }
      if (receipt.banner_image_url) {
        receipt.banner_image_url = normalizeImageUrl(receipt.banner_image_url);
      }
      receiptCache.set(cleanId, receipt);
      return receipt;
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not fetch receipt from server.';
      appLogger.warn('RECEIPT_SERVICE', `Failed to fetch receipt for ${cleanId}: ${errMsg}`);
      throw new Error(errMsg);
    }
  },

  /**
   * Retrieves cached receipt without network call
   */
  getCachedReceipt: (paymentId?: string | null): ReceiptData | null => {
    if (!paymentId) return null;
    return receiptCache.get(paymentId.trim()) || null;
  },

  /**
   * Stores receipt data manually in memory
   */
  setCachedReceipt: (paymentId: string, data: ReceiptData): void => {
    if (paymentId) {
      receiptCache.set(paymentId.trim(), data);
    }
  },
};

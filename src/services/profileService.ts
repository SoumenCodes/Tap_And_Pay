import { apiClient } from './apiClient';

export interface ProfileAddress {
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface ProfileBankDetails {
  bank_name?: string;
  bank_account_name?: string;
  bsb?: string;
  account_number?: string;
  masked_account_number?: string;
  payout_payment_method?: string;
}

export interface ProfileUser {
  id: number | string;
  role_id?: number | string;
  user_type_key: string;
  user_type_label?: string;
  is_taxi_service?: boolean;
  is_verified?: boolean;
  registration_status?: string;
  header_business_name?: string;
  display_name?: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  business_name?: string;
  business_type?: string;
  driver_type?: string | null;
  email?: string;
  phone_no?: string;
  abn?: string;
  taxi_no?: string;
  emp_id?: string | null;
  employee_code?: string;
  dc_number?: string | null;
  dl_number?: string | null;
  logo_url?: string | null;
  profile_photo_url?: string | null;
  formatted_address?: string;
  address?: ProfileAddress;
  parent_business?: any;
  bank_details?: ProfileBankDetails;
}

export interface SessionRevenueBreakdown {
  amount: number;
  amount_formatted: string;
  count: number;
  count_formatted: string;
}

export interface SessionRevenue {
  total_amount: number;
  total_amount_formatted: string;
  total_transactions: number;
  transaction_label: string;
  card: SessionRevenueBreakdown;
  tap_and_go: SessionRevenueBreakdown;
}

export interface CurrentSession {
  has_active_session: boolean;
  status_badge: string;
  shift_id?: string | null;
  session_uuid?: string | null;
  display_shift_id?: string | null;
  started_at?: string | null;
  started_at_formatted?: string | null;
  duration?: string | null;
  duration_seconds?: number;
  revenue_title?: string;
  end_button_title?: string;
  revenue: SessionRevenue;
}

export interface ProfileMenuOption {
  key: string;
  title: string;
  subtitle: string;
  action: string;
}

export interface ProfileResponseData {
  user: ProfileUser;
  current_session: CurrentSession;
  menu_options: ProfileMenuOption[];
}

export interface ProfileApiResponse {
  status: boolean;
  message: string;
  data: ProfileResponseData;
}

export interface DraftBankDetails {
  bank_account_name?: string;
  bsb?: string;
  account_number?: string;
  masked_account_number?: string;
  bank_name?: string;
  bank_badge?: string;
  submitted_ts?: string;
}

export interface BankDetailsData {
  has_bank_details?: boolean;
  bank_account_name?: string;
  bsb?: string;
  account_number?: string;
  masked_account_number?: string;
  bank_name?: string;
  bank_badge?: string;
  approval_status?: string;
  is_verified?: boolean;
  payout_payment_method?: string;
  has_pending_approval?: boolean;
  draft_bank_details?: DraftBankDetails | null;
}

export interface BankDetailsApiResponse {
  status: boolean;
  message: string;
  data: BankDetailsData;
}

export interface UpdateBankDetailsPayload {
  account_name: string;
  bsb: string;
  account_number: string;
  bank_name: string;
}

export interface UpdateBankDetailsResponse {
  status: boolean;
  message: string;
  data: BankDetailsData;
}

/**
 * Service to manage User Profile and Bank Details API calls
 */
export const profileService = {
  /**
   * Fetch current user profile details
   * GET /api/user/profile
   */
  getProfile: async (): Promise<ProfileResponseData> => {
    const response = await apiClient.get<ProfileApiResponse>('/api/user/profile');
    return response.data.data;
  },

  /**
   * Fetch user bank account details
   * GET /api/user/bank-details
   */
  getBankDetails: async (): Promise<BankDetailsData> => {
    const response = await apiClient.get<BankDetailsApiResponse>('/api/user/bank-details');
    return response.data.data;
  },

  /**
   * Submit bank details update for approval
   * POST /api/user/update-bank-details
   */
  updateBankDetails: async (
    payload: UpdateBankDetailsPayload
  ): Promise<UpdateBankDetailsResponse> => {
    const response = await apiClient.post<UpdateBankDetailsResponse>(
      '/api/user/update-bank-details',
      payload
    );
    return response.data;
  },
};

import { apiClient } from './apiClient';

export interface DashboardHeader {
  title?: string;
  business_name?: string;
  logo_url?: string | null;
  banner_image_url?: string | null;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  identifier_type?: string;
  identifier_value?: string;
  identifier_label?: string;
  shift_start_label?: string | null;
  active_shift_code?: string | null;
  active_shift_label?: string;
  shift_badge_text?: string;
  shift_badge_variant?: string;
}

export interface DashboardSaleButton {
  is_visible?: boolean;
}

export interface RevenueBreakdown {
  amount: number;
  amount_formatted: string;
  count: number;
  count_formatted?: string;
}

export interface DashboardRevenue {
  timeframe: string;
  timeframe_label: string;
  unit: string;
  total_amount: number;
  total_amount_formatted: string;
  total_count: number;
  total_count_formatted?: string;
  card: RevenueBreakdown;
  tap_and_go: RevenueBreakdown;
}

export interface ActiveEmployeesSummary {
  total_count: number;
  on_shift_count: number;
  off_shift_count: number;
  total_label?: string;
  on_shift_label?: string;
  off_shift_label?: string;
}

export interface EmployeeShiftsSummary {
  paid: number;
  unpaid: number;
  paid_label?: string;
  unpaid_label?: string;
}

export interface ActiveEmployeeItem {
  id: number | string;
  name: string;
  first_name?: string;
  last_name?: string;
  initials?: string;
  emp_id: string;
  emp_id_label?: string;
  profile_photo_url?: string | null;
  is_online?: boolean;
  online_badge?: string;
  is_on_shift?: boolean;
  active_shift_revenue: number;
  active_shift_revenue_formatted: string;
  shifts: EmployeeShiftsSummary;
}

export interface ActiveEmployeesSection {
  summary: ActiveEmployeesSummary;
  list: ActiveEmployeeItem[];
}

export interface RecentTransactionItem {
  id: number | string;
  txn_id?: string;
  transaction_id?: string;
  amount: number;
  amount_formatted: string;
  payment_method?: string;
  payment_method_label?: string;
  created_at?: string;
  time_formatted?: string;
  status?: string;
}

export interface RecentTransactionsSection {
  title?: string;
  action?: string;
  count: number;
  list: RecentTransactionItem[];
}

export interface DashboardData {
  user_type_key: string;
  role_id: number;
  is_taxi_service: boolean;
  is_on_shift: boolean;
  start_time?: string | null;
  active_shift?: any;
  active_shift_text?: string;
  shift_status_badge?: string;
  header: DashboardHeader;
  sale_button?: DashboardSaleButton;
  revenue: DashboardRevenue;
  section_type: string;
  active_employees?: ActiveEmployeesSection;
  recent_transactions?: RecentTransactionsSection;
}

export interface DashboardResponse {
  status: boolean;
  message: string;
  data: DashboardData;
}

/**
 * Dashboard API Service
 */
export const dashboardService = {
  /**
   * GET /api/user/dashboard
   * Fetches unified dashboard metrics, shift status, and employee/driver lists
   */
  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await apiClient.get<DashboardResponse>('/api/user/dashboard');
    return response.data;
  },
};

import { apiClient } from './apiClient';
import { ActiveShiftData } from './shiftService';
import { tokenStorage } from './tokenStorage';
import type { UserProfile } from '../context/AuthContext';

export interface DashboardHeader {
  title?: string;
  business_name?: string;
  logo_url?: string | null;
  banner_image_url?: string | null;
  abn?: string;
  phone?: string;
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
  start_at?: string | null;
  active_shift?: ActiveShiftData | null;
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

export type DashboardHeaderSyncCallback = (header: DashboardHeader) => void;
let headerSyncListeners: DashboardHeaderSyncCallback[] = [];
let activeDashboardPromise: Promise<DashboardResponse> | null = null;
let cachedDashboardHeader: DashboardHeader | null = null;

export function getCachedDashboardHeader(): DashboardHeader | null {
  return cachedDashboardHeader;
}

export function onDashboardHeaderSync(callback: DashboardHeaderSyncCallback): () => void {
  headerSyncListeners.push(callback);
  if (cachedDashboardHeader) {
    try {
      callback(cachedDashboardHeader);
    } catch (err) {
      console.warn('⚠️ Error in initial dashboard header callback:', err);
    }
  }
  return () => {
    headerSyncListeners = headerSyncListeners.filter((cb) => cb !== callback);
  };
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
    if (activeDashboardPromise) {
      return activeDashboardPromise;
    }

    activeDashboardPromise = (async () => {
      try {
        const response = await apiClient.get<DashboardResponse>('/api/user/dashboard');
        const resData = response.data;

        if (resData?.data?.header) {
          const h = resData.data.header;
          cachedDashboardHeader = h;

          // 1. Persist abn, phone and business details to stored session on device
          tokenStorage
            .loadStoredSession()
            .then(({ user }) => {
              if (user) {
                const updated: UserProfile = {
                  ...user,
                  abn: h.abn || user.abn,
                  phone: h.phone || user.phone,
                  businessName: h.business_name || user.businessName,
                  empId: h.identifier_value || user.empId,
                  logoUrl: h.logo_url !== undefined ? h.logo_url : user.logoUrl,
                  bannerImageUrl:
                    h.banner_image_url !== undefined ? h.banner_image_url : user.bannerImageUrl,
                };
                tokenStorage.saveUser(updated);
              }
            })
            .catch(() => {});

          // 2. Notify active listeners (AuthContext, etc.)
          headerSyncListeners.forEach((listener) => {
            try {
              listener(h);
            } catch (err) {
              console.warn('⚠️ Error in dashboard header listener:', err);
            }
          });
        }

        return response.data;
      } finally {
        activeDashboardPromise = null;
      }
    })();

    return activeDashboardPromise;
  },
};

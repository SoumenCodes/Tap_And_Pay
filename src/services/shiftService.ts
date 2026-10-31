import { apiClient } from './apiClient';
import { config } from '../constants/config';

export interface ActiveShiftData {
  id: number;
  session_uuid: string;
  display_shift_id: string;
  session_date: string;
  start_at: string;
  start_time: string;
  duration: string;
  duration_seconds: number;
  opening_balance: number;
  opening_amount: number;
  device_id: string;
}

export interface StartShiftData {
  user_id: number;
  user_name: string;
  user_type_key: string;
  active_shift: ActiveShiftData;
}

export interface StartShiftResponse {
  status: boolean;
  message: string;
  data: StartShiftData;
}

export interface StartShiftPayload {
  device_id?: string;
}

export interface EndShiftPayload {
  shift_session_id: number | string;
  user_id?: number | string;
}

export interface EndShiftData {
  user_id?: number;
  shift_id?: number;
  session_uuid?: string;
  status?: string;
  start_at?: string;
  end_at?: string;
  [key: string]: any;
}

export interface EndShiftResponse {
  status: boolean;
  message: string;
  data?: EndShiftData;
}

/**
 * Shift History Types & Interfaces (GET /api/shift/history)
 */
export interface ShiftSelectorEmployee {
  id: number;
  name: string;
  code: string;
  photo: string | null;
  initials: string;
}

export interface ShiftHistoryHeaderSelector {
  is_visible: boolean;
  type: string;
  title: string;
  total_count: number;
  employee_list: ShiftSelectorEmployee[];
}

export interface ShiftHistoryHeader {
  title: string;
  emp_id: string | null;
  taxi_no: string | null;
  selector?: ShiftHistoryHeaderSelector;
}

export interface ShiftFilterTab {
  key: string;
  label: string;
  count: number;
}

export interface ShiftHistoryFilters {
  search: string;
  date_range: string;
  start_date: string | null;
  end_date: string | null;
  active_tab: string;
  tabs: {
    all_shifts: ShiftFilterTab;
    paid_shifts: ShiftFilterTab;
    unpaid_shifts: ShiftFilterTab;
  };
}

export interface ShiftHistorySummary {
  total_shift_collections: number;
  total_shift_collections_formatted: string;
  settled_paid: number;
  settled_paid_formatted: string;
  settled_paid_shifts_count: number;
  settled_paid_subtitle: string;
  pending_unpaid: number;
  pending_unpaid_formatted: string;
  pending_unpaid_shifts_count: number;
  pending_unpaid_subtitle: string;
  paid_percentage: number;
}

export interface ShiftMethodBreakdown {
  txns: number;
  amount: number;
  amount_formatted: string;
}

export interface ShiftRecordItem {
  id: number;
  shift_id: number;
  display_shift_id: string;
  user_name: string;
  employee_code: string;
  session_date: string;
  start_at: string;
  end_at: string | null;
  time_range: string;
  is_paid: boolean;
  status: 'PAID' | 'UNPAID' | string;
  paid_date: string | null;
  total_txns: number;
  amount: number;
  amount_formatted: string;
  card?: ShiftMethodBreakdown;
  tap_and_go?: ShiftMethodBreakdown;
  cash?: ShiftMethodBreakdown;
}

export interface ShiftHistoryData {
  user_type_key: string;
  role_id: number;
  is_taxi_service: boolean;
  header: ShiftHistoryHeader;
  filters: ShiftHistoryFilters;
  summary: ShiftHistorySummary;
  shift_records: ShiftRecordItem[];
}

export interface ShiftHistoryResponse {
  status: boolean;
  message: string;
  data: ShiftHistoryData;
}

export interface ShiftHistoryParams {
  employee_id?: number | string;
  status?: 'all' | 'paid' | 'unpaid' | string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

let lastActiveShift: ActiveShiftData | null = null;
let lastUserId: number | string | null = null;

export const shiftService = {
  /**
   * Shift History API (GET /api/shift/history)
   * Fetches unified shift records, employee selector, filter tabs, and collections summary
   */
  getShiftHistory: async (params?: ShiftHistoryParams): Promise<ShiftHistoryResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.employee_id !== undefined && params?.employee_id !== null && params?.employee_id !== '') {
      queryParams.employee_id = params.employee_id;
    }
    if (params?.status) {
      queryParams.status = params.status;
    }
    if (params?.search && params.search.trim().length > 0) {
      queryParams.search = params.search.trim();
    }
    if (params?.start_date) {
      queryParams.start_date = params.start_date;
    }
    if (params?.end_date) {
      queryParams.end_date = params.end_date;
    }

    const response = await apiClient.get<ShiftHistoryResponse>('/api/shift/history', {
      params: queryParams,
    });
    return response.data;
  },
  /**
   * Start Shift API (POST /api/shift/start)
   * Starts a new work session and captures start time and shift ID.
   */
  startShift: async (payload?: StartShiftPayload): Promise<StartShiftResponse> => {
    const deviceId = payload?.device_id || config.defaultDeviceId;
    const response = await apiClient.post<StartShiftResponse>('/api/shift/start', {
      device_id: deviceId,
    });
    if (response.data?.status && response.data?.data) {
      lastActiveShift = response.data.data.active_shift;
      lastUserId = response.data.data.user_id;
    }
    return response.data;
  },

  /**
   * End Shift API (POST /api/shift/end)
   * Ends an active work session.
   */
  endShift: async (payload: EndShiftPayload): Promise<EndShiftResponse> => {
    const body: Record<string, any> = {
      shift_session_id: payload.shift_session_id,
    };
    if (payload.user_id !== undefined && payload.user_id !== null) {
      body.user_id = payload.user_id;
    } else if (lastUserId !== null) {
      body.user_id = lastUserId;
    }

    const response = await apiClient.post<EndShiftResponse>('/api/shift/end', body);
    if (response.data?.status) {
      lastActiveShift = null;
    }
    return response.data;
  },

  getActiveShift: (): ActiveShiftData | null => lastActiveShift,
  setActiveShift: (shift: ActiveShiftData | null) => {
    lastActiveShift = shift;
  },
  setUserId: (userId: number | string | null) => {
    lastUserId = userId;
  },
};

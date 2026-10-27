import { apiClient } from './apiClient';

export interface DriverItem {
  id: number;
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  initials?: string;
  dc_number?: string;
  dc_display?: string;
  assigned_taxi_no?: string;
  taxi_no_display?: string;
  phone_no?: string;
  email?: string;
  dl_number?: string;
  abn?: string;
  profile_photo_url?: string | null;
  dc_image?: string | null;
  dc_image_url?: string | null;
  dc_photo_rear_url?: string | null;
  dl_front_image_url?: string | null;
  dl_rear_image_url?: string | null;
  registration_status?: string;
  is_pending_approval?: boolean;
  is_active?: number;
  status_label?: string;
  status_badge?: string;
  created_ts?: string;
}

export interface DriversSummary {
  total_drivers: number;
  total_registered_label: string;
  active_drivers: number;
  inactive_drivers: number;
  pending_approval: number;
}

export interface DriversListData {
  summary: DriversSummary;
  drivers: DriverItem[];
}

export interface DriversListApiResponse {
  status: boolean;
  message: string;
  data: DriversListData;
}

export const driverService = {
  /**
   * Fetch drivers list with optional search term
   * GET /api/drivers/list
   * GET /api/drivers/list?search=...
   */
  getDriversList: async (search?: string): Promise<DriversListData> => {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<DriversListApiResponse>('/api/drivers/list', {
      params,
    });
    return response.data.data;
  },
};

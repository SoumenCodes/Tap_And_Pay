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

export interface DriverDocumentDetail {
  title: string;
  url: string | null;
  exists: boolean;
}

export interface DriverDocuments {
  dl_front: DriverDocumentDetail;
  dl_rear: DriverDocumentDetail;
  dc_image: DriverDocumentDetail;
}

export interface DriverAddressDetails {
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

export interface DriverPersonalInfo {
  full_name: string;
  phone_number: string;
  dc: string;
  email: string;
  abn: string;
  address: string;
  dob: string | null;
  dl_number?: string;
  address_details: DriverAddressDetails;
}

export interface DriverBankAccount {
  account_name: string;
  bsb: string;
  account_number: string;
  masked_account_number: string;
  bank_name: string;
  payout_payment_method: number | string;
}

export interface DriverStatusDetail {
  is_active: boolean;
  status_label: string;
  status_badge: string;
  registration_status: string;
  can_toggle: boolean;
}

export interface DriverDetail {
  id: number;
  employee_code: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  initials: string;
  dc_number: string;
  dc_display: string;
  assigned_taxi_no: string;
  taxi_no_display: string;
  profile_photo_url: string | null;
  registration_status: string;
  is_active: boolean;
  status_label: string;
  status_badge: string;
  documents: DriverDocuments;
  personal_information: DriverPersonalInfo;
  bank_account: DriverBankAccount;
  driver_status: DriverStatusDetail;
  can_edit: boolean;
  created_ts: string;
}

export interface DriverDetailApiResponse {
  status: boolean;
  message: string;
  data: {
    driver: DriverDetail;
  };
}

export interface AddDriverCreatedDriver {
  id: number;
  employee_code: string;
  parent_id: number;
  parent_business_name: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_no: string;
  dl_number: string;
  dc_number: string;
  assigned_taxi_no: string;
  business_type: string | null;
  driver_type: string;
  registration_status: string;
  is_active: number;
  profile_photo_url: string | null;
  dc_image: string | null;
  dc_image_url: string | null;
  dc_photo_rear_url: string | null;
  dl_front_image_url: string | null;
  dl_rear_image_url: string | null;
  temporary_password?: string;
  created_ts: string;
}

export interface AddDriverApiResponse {
  status: boolean;
  message: string;
  data: {
    driver: AddDriverCreatedDriver;
  };
}

export interface UpdateDriverProfileApiResponse {
  status: boolean;
  message: string;
  data: {
    driver: DriverDetail;
  };
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

  /**
   * Fetch driver details by ID
   * GET /api/drivers/detail/:id
   */
  getDriverDetail: async (id: number | string): Promise<DriverDetail> => {
    const response = await apiClient.get<DriverDetailApiResponse>(`/api/drivers/detail/${id}`);
    return response.data.data.driver;
  },

  /**
   * Add a new driver
   * POST /api/drivers/add (multipart/form-data)
   */
  addDriver: async (formData: FormData): Promise<AddDriverApiResponse> => {
    const response = await apiClient.post<AddDriverApiResponse>('/api/drivers/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update driver profile
   * POST /api/driver/update-profile/:id (multipart/form-data)
   */
  updateDriverProfile: async (
    id: number | string,
    formData: FormData
  ): Promise<UpdateDriverProfileApiResponse> => {
    const response = await apiClient.post<UpdateDriverProfileApiResponse>(
      `/api/driver/update-profile/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};

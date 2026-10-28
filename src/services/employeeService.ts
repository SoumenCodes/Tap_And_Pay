import { apiClient } from './apiClient';

export interface EmployeeListItem {
  id: number;
  employee_code?: string;
  employee_id?: string;
  emp_id_display?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  initials?: string;
  phone_no?: string;
  email?: string;
  profile_photo_url?: string | null;
  registration_status?: string;
  is_pending_approval?: boolean;
  is_active?: number;
  status_label?: string;
  status_badge?: string;
  created_ts?: string;
}

export interface EmployeesSummary {
  total_employees: number;
  total_registered_label: string;
  active_employees: number;
  inactive_employees: number;
  pending_approval: number;
}

export interface EmployeesListData {
  summary: EmployeesSummary;
  employees: EmployeeListItem[];
}

export interface EmployeesListApiResponse {
  status: boolean;
  message: string;
  data: EmployeesListData;
}

export interface EmployeeDetail {
  id: number;
  employee_code?: string;
  employee_id?: string;
  emp_id_display?: string;
  parent_id?: number;
  parent_business_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_no?: string;
  email?: string;
  profile_photo_url?: string | null;
  registration_status?: string;
  is_pending_approval?: boolean;
  is_active?: boolean;
  status_label?: string;
  status_badge?: string;
  created_ts?: string;
  updated_ts?: string;
}

export interface EmployeeDetailApiResponse {
  status: boolean;
  message: string;
  data: {
    employee: EmployeeDetail;
  };
}

export interface AddEmployeeCreated {
  id: number;
  employee_code?: string;
  employee_id?: string;
  emp_id_display?: string;
  parent_id?: number;
  parent_business_name?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_no?: string;
  profile_photo_url?: string | null;
  registration_status?: string;
  is_pending_approval?: boolean;
  is_active?: number;
  status_label?: string;
  status_badge?: string;
  temporary_password?: string;
  created_ts?: string;
}

export interface AddEmployeeApiResponse {
  status: boolean;
  message: string;
  data: {
    employee: AddEmployeeCreated;
  };
}

export interface UpdateEmployeeApiResponse {
  status: boolean;
  message: string;
  data: {
    employee: EmployeeDetail;
  };
}

export const employeeService = {
  /**
   * Fetch employees list with optional search term
   * GET /api/employees/list
   * GET /api/employees/list?search=...
   */
  getEmployeesList: async (search?: string): Promise<EmployeesListData> => {
    const params: Record<string, string> = {};
    if (search && search.trim()) {
      params.search = search.trim();
    }
    const response = await apiClient.get<EmployeesListApiResponse>('/api/employees/list', {
      params,
    });
    return response.data.data;
  },

  /**
   * Fetch employee details by ID
   * GET /api/employee/detail/:id
   */
  getEmployeeDetail: async (id: number | string): Promise<EmployeeDetail> => {
    const response = await apiClient.get<EmployeeDetailApiResponse>(`/api/employee/detail/${id}`);
    return response.data.data.employee;
  },

  /**
   * Add a new employee
   * POST /api/employees/add (multipart/form-data)
   */
  addEmployee: async (formData: FormData): Promise<AddEmployeeApiResponse> => {
    const response = await apiClient.post<AddEmployeeApiResponse>('/api/employees/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update employee profile
   * POST /api/employee/edit/:id (multipart/form-data)
   */
  updateEmployee: async (
    id: number | string,
    formData: FormData
  ): Promise<UpdateEmployeeApiResponse> => {
    const response = await apiClient.post<UpdateEmployeeApiResponse>(
      `/api/employee/edit/${id}`,
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

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

export const shiftService = {
  /**
   * Start Shift API (POST /api/shift/start)
   * Starts a new work session and captures start time and shift ID.
   */
  startShift: async (payload?: StartShiftPayload): Promise<StartShiftResponse> => {
    const deviceId = payload?.device_id || config.defaultDeviceId;
    const response = await apiClient.post<StartShiftResponse>('/api/shift/start', {
      device_id: deviceId,
    });
    return response.data;
  },
};

export type AttendanceRecord = {
  id: string;
  appointment_id: string;
  client_id: string;
  account_id: string;
  status: string;
  checkin_method: string | null;
  checked_in_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  device_info: string | null;
  created_at: string;
};

export type CheckinTokenRecord = {
  id: string;
  appointment_id: string;
  account_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

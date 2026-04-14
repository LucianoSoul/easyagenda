export type AgendaClientRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type AgendaServiceRecord = {
  id: string;
  name: string;
  duration_minutes: number;
};

export type AgendaPaymentRecord = {
  id: string;
  status: string;
  amount: number;
  method: string;
  gateway: string;
  external_id: string | null;
  created_at: string;
};

export type AgendaAttendanceRecord = {
  id: string;
  status: string;
  checked_in_at: string | null;
  checkin_method: string | null;
  created_at: string;
};

export type AgendaCheckinTokenRecord = {
  id: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
};

export type AgendaAppointmentRow = {
  id: string;
  user_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  original_price: number | null;
  credit_applied_amount: number | null;
  final_price: number | null;
  payment_required_amount: number | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  clients: AgendaClientRecord | AgendaClientRecord[] | null;
  services: AgendaServiceRecord | AgendaServiceRecord[] | null;
  payments: AgendaPaymentRecord[];
  attendance: AgendaAttendanceRecord[];
  checkin_tokens: AgendaCheckinTokenRecord[];
};

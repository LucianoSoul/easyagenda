export type ClientRecord = {
  id: string;
  account_id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type ProviderRecord = {
  id: string;
  name: string;
  email: string;
};

export type ServiceRecord = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
};

export type PaymentRecord = {
  id: string;
  amount: number;
  method: string;
  gateway: string;
  status: string;
  external_id: string | null;
  payment_link: string | null;
  qr_code: string | null;
  created_at: string;
};

export type RefundDecisionRecord = {
  id: string;
  created_at: string;
  decision_status: string;
  execution_status: string;
  refund_amount: number;
  credit_amount: number;
  decision_reason: string | null;
  processed_at: string | null;
  gateway_refund_id: string | null;
  gateway_response: Record<string, unknown> | null;
};

export type CheckinTokenRecord = {
  id: string;
  token: string;
  used: boolean;
  expires_at: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  status: string;
  checkin_method: string | null;
  checked_in_at: string | null;
  created_at: string;
};

export type AccountRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type AppointmentWithRelationsRow = {
  id: string;
  account_id: string;
  client_id: string;
  service_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  final_price: number | null;
  payment_required_amount: number | null;
  notes: string | null;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  checkin_required: boolean;
  original_price: number | null;
  credit_applied_amount: number | null;
  discount_amount: number | null;
  clients: ClientRecord | null;
  services: ServiceRecord | null;
  users: ProviderRecord | null;
  payments: PaymentRecord[];
  refund_decisions: RefundDecisionRecord[];
  checkin_tokens: CheckinTokenRecord[];
  attendance: AttendanceRecord[];
  accounts: AccountRecord | null;
};

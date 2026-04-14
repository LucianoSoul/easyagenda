export type Payment = {
  id: string;
  appointment_id: string;
  user_id: string;
  amount: number;
  method: string;
  gateway: string;
  status: string;
  external_id: string | null;
  payment_link: string | null;
  qr_code: string | null;
  created_at: string;
  account_id: string;
};

export type CheckinToken = {
  id: string;
  appointment_id: string;
  account_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
};

export type GoogleConnection = {
  provider: "google";
  account_id: string;
  user_id: string;
  google_email: string;
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
  scope: string[];
  connected_at: string;
  disconnected_at: string | null;
};

export type GoogleAppointmentEventMapping = {
  appointment_id: string;
  event_id: string;
  html_link: string | null;
  meet_link: string | null;
  synced_at: string;
};

export type GoogleGatewaySettings = {
  connection?: GoogleConnection;
  calendar_events?: Record<string, GoogleAppointmentEventMapping>;
};

export type GoogleSettingsRow = {
  user_id: string;
  account_id: string;
  timezone: string | null;
  gateway_settings: Record<string, unknown> | null;
};

export type GoogleAppointmentSyncContext = {
  id: string;
  account_id: string;
  user_id: string;
  client_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  original_price: number | null;
  credit_applied_amount: number | null;
  final_price: number | null;
  payment_required_amount: number | null;
  delivery_mode: "in_person" | "online" | null;
  service_attendance_mode: "in_person_only" | "online_only" | "hybrid" | null;
  clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  services: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
  } | null;
  users: {
    id: string;
    name: string;
    email: string;
  } | null;
  accounts: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
};

export type GoogleCalendarEventResponse = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
};

export type GoogleOAuthTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

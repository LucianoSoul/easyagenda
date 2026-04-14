export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email?: string | null;
  };
};

export type LookupClient = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type LookupService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  attendance_mode: "in_person_only" | "online_only" | "hybrid";
};

export type AgendaItem = {
  appointment: {
    id: string;
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
    delivery_mode: "in_person" | "online" | null;
    service_attendance_mode: "in_person_only" | "online_only" | "hybrid" | null;
  };
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    duration_minutes: number;
  } | null;
  payment: {
    id: string;
    status: string;
    amount: number;
    method: string;
    gateway: string;
    external_id: string | null;
  } | null;
  attendance: {
    id: string;
    status: string;
    checked_in_at: string | null;
    checkin_method: string | null;
  } | null;
  checkinToken: {
    id: string;
    token: string;
    used: boolean;
    expires_at: string;
  } | null;
};

export type PaymentRecord = {
  id: string;
  appointment_id: string;
  amount: number;
  method: string;
  gateway: string;
  status: string;
  external_id: string | null;
  payment_link?: string | null;
  qr_code?: string | null;
  created_at: string;
};

export type ConsultationCreateInput = {
  clientId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  deliveryMode: "in_person" | "online";
  notes?: string;
};

export type ConsultationCreateResult = {
  appointment: {
    id: string;
    status: string;
    start_time: string;
    end_time: string;
    delivery_mode: "in_person" | "online" | null;
    service_attendance_mode: "in_person_only" | "online_only" | "hybrid" | null;
  };
  payment: {
    id: string;
    status: string;
    amount: number;
  };
  sharePayload: {
    consultationId: string;
    paymentId: string;
    deliveryMode: "in_person" | "online";
    paymentStatus: string;
    amount: number;
    publicStatusUrl: string;
    whatsappText: string;
    emailSubject: string;
    emailBody: string;
  };
};

export type AppointmentDetail = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  delivery_mode: "in_person" | "online" | null;
  service_attendance_mode: "in_person_only" | "online_only" | "hybrid" | null;
  original_price: number | null;
  credit_applied_amount: number | null;
  final_price: number | null;
  payment_required_amount: number | null;
};

export type ConsultationPublicStatus = {
  appointmentId: string;
  appointmentStatus: string;
  deliveryMode: "in_person" | "online" | null;
  paymentStatus: string | null;
  payment: {
    status: string;
    amount: number;
    method: string;
    gateway: string;
    paymentLink: string | null;
    qrCode: string | null;
  } | null;
  serviceName: string | null;
  providerName: string | null;
  startTime: string;
  endTime: string;
  meeting: {
    htmlLink: string | null;
    meetLink: string | null;
  } | null;
};

export type CommunicationPayload = {
  key: string;
  deliveryMode: "in_person" | "online" | null;
  paymentStatus: string | null;
  meetingIncluded: boolean;
  email: {
    to: string | null;
    subject: string;
    body: string;
  };
  whatsapp: {
    to: string | null;
    text: string;
  };
  push: {
    title: string;
    body: string;
    deepLink: string;
  };
};

export type GoogleIntegrationStatus = {
  connected: boolean;
  provider: string;
  googleEmail: string | null;
  scope: string[];
  connectedAt: string | null;
  disconnectedAt: string | null;
};

export type RefundDecision = {
  id: string;
  appointment_id: string;
  decision_status: string;
  execution_status: string;
  refund_amount: number;
  credit_amount: number;
  created_at: string;
};

export type CommunicationsPreview = {
  consultationId: string;
  currentState: {
    deliveryMode: "in_person" | "online" | null;
    paymentStatus: string | null;
    meetingAvailable: boolean;
    publicStatusUrl: string;
  };
  currentlyRelevant: {
    consultation_created_pending_payment?: CommunicationPayload;
    payment_approved?: CommunicationPayload | null;
    consultation_reminder_in_person?: CommunicationPayload;
    consultation_reminder_online?: CommunicationPayload;
  };
};

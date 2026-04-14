import type { AppointmentDeliveryMode, ServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";

export type ConsultationSharePayload = {
  consultationId: string;
  paymentId: string;
  deliveryMode: AppointmentDeliveryMode;
  paymentStatus: string;
  amount: number;
  publicStatusUrl: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
};

export type ConsultationStatusAppointment = {
  id: string;
  account_id: string;
  user_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  delivery_mode: AppointmentDeliveryMode | null;
  service_attendance_mode: ServiceAttendanceMode | null;
  services: {
    id: string;
    name: string;
  } | null;
  users: {
    id: string;
    name: string;
  } | null;
  clients: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export type PublicConsultationStatus = {
  appointmentId: string;
  appointmentStatus: string;
  deliveryMode: AppointmentDeliveryMode | null;
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
    available: boolean;
    htmlLink: string | null;
    meetLink: string | null;
  } | null;
};

import type { AppointmentDeliveryMode } from "../../shared/utils/delivery-modes.js";

export type CommunicationTemplateKey =
  | "consultation_created_pending_payment"
  | "payment_approved_in_person"
  | "payment_approved_online_without_meeting"
  | "payment_approved_online_with_meeting"
  | "consultation_reminder_in_person"
  | "consultation_reminder_online";

export type ConsultationCommunicationContext = {
  consultationId: string;
  publicStatusUrl: string;
  deliveryMode: AppointmentDeliveryMode | null;
  paymentStatus: string | null;
  amount: number | null;
  startTime: string;
  endTime: string;
  serviceName: string | null;
  providerName: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  meeting: {
    htmlLink: string | null;
    meetLink: string | null;
  } | null;
};

export type EmailCommunicationPayload = {
  to: string | null;
  subject: string;
  body: string;
};

export type WhatsAppCommunicationPayload = {
  to: string | null;
  text: string;
};

export type PushCommunicationPayload = {
  title: string;
  body: string;
  deepLink: string;
};

export type CommunicationPayload = {
  key: CommunicationTemplateKey;
  deliveryMode: AppointmentDeliveryMode | null;
  paymentStatus: string | null;
  meetingIncluded: boolean;
  email: EmailCommunicationPayload;
  whatsapp: WhatsAppCommunicationPayload;
  push: PushCommunicationPayload;
};

export type CommunicationDeliveryPayload = {
  email: EmailCommunicationPayload;
  whatsapp: WhatsAppCommunicationPayload;
  push: PushCommunicationPayload;
};

export type ConsultationCommunicationsPreview = {
  consultationId: string;
  currentState: {
    deliveryMode: AppointmentDeliveryMode | null;
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

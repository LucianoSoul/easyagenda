import { AppError } from "../../shared/errors/app-error.js";
import { ConsultationsRepository } from "../consultations/consultations.repository.js";
import type {
  ConsultationCommunicationContext,
  CommunicationDeliveryPayload,
  CommunicationPayload,
  ConsultationCommunicationsPreview
} from "./communications.types.js";
import {
  buildConsultationCreatedPendingPayment,
  buildConsultationReminderInPerson,
  buildConsultationReminderOnline,
  buildPaymentApprovedInPerson,
  buildPaymentApprovedOnlineWithMeeting,
  buildPaymentApprovedOnlineWithoutMeeting
} from "./communications.templates.js";

export class CommunicationsService {
  constructor(private readonly consultationsRepository = new ConsultationsRepository()) {}

  async buildConsultationCreatedPendingPaymentPayload(input: {
    consultationId: string;
    accountId: string;
  }) {
    const context = await this.getContextForAccount(input);
    return buildConsultationCreatedPendingPayment(context);
  }

  async buildPaymentApprovedPayload(input: {
    consultationId: string;
    accountId: string;
  }): Promise<CommunicationPayload> {
    const context = await this.getContextForAccount(input);

    if (context.paymentStatus !== "approved") {
      throw new AppError(
        409,
        "CONSULTATION_NOT_PAYABLE",
        "Consulta ainda nao possui pagamento aprovado."
      );
    }

    if (context.deliveryMode === "in_person") {
      return buildPaymentApprovedInPerson(context);
    }

    if (context.deliveryMode === "online") {
      if (context.meeting?.meetLink || context.meeting?.htmlLink) {
        return buildPaymentApprovedOnlineWithMeeting(context);
      }

      return buildPaymentApprovedOnlineWithoutMeeting(context);
    }

    return buildPaymentApprovedOnlineWithoutMeeting(context);
  }

  async buildPaymentApprovedDeliveryPayload(input: {
    consultationId: string;
    accountId: string;
  }): Promise<CommunicationDeliveryPayload> {
    const payload = await this.buildPaymentApprovedPayload(input);
    return {
      email: payload.email,
      whatsapp: payload.whatsapp,
      push: payload.push
    };
  }

  async buildReminderPayload(input: {
    consultationId: string;
    accountId: string;
  }) {
    const context = await this.getContextForAccount(input);
    return context.deliveryMode === "in_person"
      ? buildConsultationReminderInPerson(context)
      : buildConsultationReminderOnline(context);
  }

  async getCommunicationsPreview(input: {
    consultationId: string;
    accountId: string;
  }): Promise<ConsultationCommunicationsPreview> {
    const context = await this.getContextForAccount(input);

    return {
      consultationId: context.consultationId,
      currentState: {
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingAvailable: !!(context.meeting?.meetLink || context.meeting?.htmlLink),
        publicStatusUrl: context.publicStatusUrl
      },
      currentlyRelevant: {
        consultation_created_pending_payment:
          context.paymentStatus === "pending"
            ? buildConsultationCreatedPendingPayment(context)
            : undefined,
        payment_approved:
          context.paymentStatus === "approved"
            ? await this.buildPaymentApprovedPayload(input)
            : null,
        consultation_reminder_in_person:
          context.deliveryMode === "in_person"
            ? buildConsultationReminderInPerson(context)
            : undefined,
        consultation_reminder_online:
          context.deliveryMode === "online"
            ? buildConsultationReminderOnline(context)
            : undefined
      }
    };
  }

  private async getContextForAccount(input: {
    consultationId: string;
    accountId: string;
  }): Promise<ConsultationCommunicationContext> {
    const consultation = await this.consultationsRepository.getConsultationAppointmentForAccount({
      appointmentId: input.consultationId,
      accountId: input.accountId
    });

    if (!consultation) {
      const exists = await this.consultationsRepository.consultationExists(input.consultationId);

      if (exists) {
        throw new AppError(
          403,
          "CONSULTATION_ACCOUNT_MISMATCH",
          "Consulta nao pertence a conta autenticada."
        );
      }

      throw new AppError(404, "CONSULTATION_NOT_FOUND", "Consulta nao encontrada.");
    }

    const payment = await this.consultationsRepository.getLatestPaymentForAppointment({
      appointmentId: consultation.id,
      accountId: consultation.account_id
    });

    if (!payment) {
      throw new AppError(
        409,
        "CONSULTATION_NOT_PAYABLE",
        "Consulta sem pagamento associado."
      );
    }

    const googleEvent =
      payment.status === "approved" && consultation.delivery_mode === "online"
        ? await this.consultationsRepository.getGoogleEventMappingForAppointment({
            appointmentId: consultation.id,
            userId: consultation.user_id
          })
        : null;

    return {
      consultationId: consultation.id,
      publicStatusUrl: `/consultations/${consultation.id}/public-status`,
      deliveryMode: consultation.delivery_mode,
      paymentStatus: payment.status,
      amount: payment.amount,
      startTime: consultation.start_time,
      endTime: consultation.end_time,
      serviceName: consultation.services?.name ?? null,
      providerName: consultation.users?.name ?? null,
      clientName: consultation.clients?.name ?? null,
      clientEmail: consultation.clients?.email ?? null,
      clientPhone: consultation.clients?.phone ?? null,
      meeting:
        googleEvent && payment.status === "approved" && consultation.delivery_mode === "online"
          ? {
              htmlLink: googleEvent.html_link,
              meetLink: googleEvent.meet_link
            }
          : null
    };
  }
}

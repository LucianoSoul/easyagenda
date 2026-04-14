import { AppError } from "../../shared/errors/app-error.js";
import { AppointmentsService } from "../appointments/appointments.service.js";
import { ConsultationsRepository } from "./consultations.repository.js";
import type { CreateConsultationInput } from "./consultations.schemas.js";
import type { ConsultationSharePayload, PublicConsultationStatus } from "./consultations.types.js";
import { CommunicationsService } from "../communications/communications.service.js";

export class ConsultationsService {
  constructor(
    private readonly appointmentsService = new AppointmentsService(),
    private readonly repository = new ConsultationsRepository(),
    private readonly communicationsService = new CommunicationsService()
  ) {}

  async createConsultation(input: {
    accountId: string;
    userId: string;
    consultation: CreateConsultationInput;
  }) {
    const result = await this.appointmentsService.createAppointment({
      accountId: input.accountId,
      userId: input.userId,
      appointment: input.consultation
    });

    return {
      appointment: result.appointment,
      payment: result.payment,
      sharePayload: this.buildSharePayload(
        await this.communicationsService.buildConsultationCreatedPendingPaymentPayload({
          consultationId: result.appointment.id,
          accountId: input.accountId
        }),
        result.appointment.id,
        result.payment.id,
        result.appointment.delivery_mode,
        result.payment.status,
        result.payment.amount
      )
    };
  }

  async getPublicStatus(appointmentId: string): Promise<PublicConsultationStatus> {
    const appointment = await this.repository.getPublicConsultationAppointment(appointmentId);

    if (!appointment) {
      throw new AppError(404, "CONSULTATION_NOT_FOUND", "Consulta nao encontrada.");
    }

    const payment = await this.repository.getLatestPaymentForAppointment({
      appointmentId: appointment.id,
      accountId: appointment.account_id
    });

    if (!payment) {
      throw new AppError(
        409,
        "CONSULTATION_NOT_PAYABLE",
        "Consulta sem pagamento associado."
      );
    }

    const shouldExposeMeeting =
      payment.status === "approved" && appointment.delivery_mode === "online";

    const googleEvent = shouldExposeMeeting
      ? await this.repository.getGoogleEventMappingForAppointment({
          appointmentId: appointment.id,
          userId: appointment.user_id
        })
      : null;

    return {
      appointmentId: appointment.id,
      appointmentStatus: appointment.status,
      deliveryMode: appointment.delivery_mode,
      paymentStatus: payment.status,
      payment: {
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        gateway: payment.gateway,
        paymentLink: payment.payment_link,
        qrCode: payment.qr_code
      },
      serviceName: appointment.services?.name ?? null,
      providerName: appointment.users?.name ?? null,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      meeting:
        shouldExposeMeeting && googleEvent
          ? {
              available: true,
              htmlLink: googleEvent.html_link,
              meetLink: googleEvent.meet_link
            }
          : null
    };
  }

  async getCommunicationsPreview(input: {
    consultationId: string;
    accountId: string;
  }) {
    return this.communicationsService.getCommunicationsPreview(input);
  }

  private buildSharePayload(
    communication: Awaited<
      ReturnType<CommunicationsService["buildConsultationCreatedPendingPaymentPayload"]>
    >,
    consultationId: string,
    paymentId: string,
    deliveryMode: "in_person" | "online",
    paymentStatus: string,
    amount: number
  ): ConsultationSharePayload {
    return {
      consultationId,
      paymentId,
      deliveryMode,
      paymentStatus,
      amount,
      publicStatusUrl: communication.push.deepLink,
      whatsappText: communication.whatsapp.text,
      emailSubject: communication.email.subject,
      emailBody: communication.email.body
    };
  }
}

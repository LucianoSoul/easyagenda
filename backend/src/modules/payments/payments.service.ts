import { PaymentsRepository } from "./payments.repository.js";
import { AppointmentsRepository } from "../appointments/appointments.repository.js";
import { AppError } from "../../shared/errors/app-error.js";
import { env } from "../../config/env.js";
import type { CreatePaymentInput, DevApprovePaymentInput } from "./payments.schemas.js";
import { GoogleService } from "../google/google.service.js";
import { getAppointmentDeliverySettings } from "../../shared/utils/delivery-modes.js";
import { CommunicationsService } from "../communications/communications.service.js";

export class PaymentsService {
  constructor(
    private readonly paymentsRepository = new PaymentsRepository(),
    private readonly appointmentsRepository = new AppointmentsRepository(),
    private readonly googleService = new GoogleService(),
    private readonly communicationsService = new CommunicationsService()
  ) {}

  async list(accountId: string) {
    return this.paymentsRepository.findAllByAccount(accountId);
  }

  async getPaymentById(input: { paymentId: string; accountId: string }) {
    return this.paymentsRepository.getByIdForAccount(input);
  }

  async create(payload: CreatePaymentInput) {
    return this.paymentsRepository.create(payload);
  }

  async createPaymentForAppointment(input: {
    appointmentId: string;
    userId: string;
    accountId: string;
  }) {
    const paymentId = await this.paymentsRepository.createForAppointment(input);
    return this.paymentsRepository.getByIdForAccount({
      paymentId,
      accountId: input.accountId
    });
  }

  async devApprovePayment(input: {
    paymentId: string;
    accountId: string;
    body: DevApprovePaymentInput;
  }) {
    if (env.NODE_ENV === "production") {
      throw new AppError(404, "NOT_FOUND", "Endpoint indisponivel.");
    }

    const payment = await this.paymentsRepository.getByIdForAccount({
      paymentId: input.paymentId,
      accountId: input.accountId
    });

    if (payment.status !== "pending") {
      throw new AppError(400, "PAYMENT_NOT_PENDING", "Pagamento nao esta pendente.");
    }

    const externalId = payment.external_id ?? input.body.externalId ?? `dev_${payment.id}`;

    const updatedPayment = await this.paymentsRepository.approveForAccount({
      paymentId: input.paymentId,
      accountId: input.accountId,
      externalId
    });

    const appointment = await this.appointmentsRepository.getAppointmentByIdForAccount({
      appointmentId: updatedPayment.appointment_id,
      accountId: input.accountId
    });

    if (!appointment) {
      throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento relacionado nao encontrado.");
    }

    const checkinTokens = await this.paymentsRepository.listCheckinTokensByAppointment({
      appointmentId: updatedPayment.appointment_id,
      accountId: input.accountId
    });

    const scheduling = await this.appointmentsRepository.getSchedulingSettingsByUserId(
      appointment.user_id
    );
    const deliverySettings = getAppointmentDeliverySettings(scheduling.scheduling, appointment.id);

    let googleSync: Awaited<
      ReturnType<GoogleService["createCalendarEventForAppointment"]>
    > | null = null;
    let meetingDelivery:
      | {
          deliveryMode: "online";
          syncAttempted: boolean;
          synced: boolean;
          reason?: string;
          notification?:
            | {
                requested: boolean;
                channel: string | null;
                recipientEmail: string | null;
              }
            | null;
        }
      | null = null;

    if (deliverySettings?.delivery_mode === "online") {
      const googleStatus = await this.googleService.getStatus(appointment.user_id);

      if (googleStatus.connected) {
        try {
          googleSync = await this.googleService.createCalendarEventForAppointment({
            appointmentId: appointment.id,
            accountId: input.accountId,
            userId: appointment.user_id
          });
          meetingDelivery = {
            deliveryMode: "online",
            syncAttempted: true,
            synced: true,
            notification: googleSync.notification
          };
        } catch (error) {
          const appError = error instanceof AppError ? error : null;
          meetingDelivery = {
            deliveryMode: "online",
            syncAttempted: true,
            synced: false,
            reason: appError?.code ?? "GOOGLE_EVENT_SYNC_FAILED"
          };
        }
      } else {
        meetingDelivery = {
          deliveryMode: "online",
          syncAttempted: false,
          synced: false,
          reason: "GOOGLE_NOT_CONNECTED"
        };
      }
    }

    const communication = await this.communicationsService.buildPaymentApprovedDeliveryPayload({
      consultationId: appointment.id,
      accountId: input.accountId
    });

    return {
      payment: updatedPayment,
      appointment: {
        ...appointment,
        delivery_mode: deliverySettings?.delivery_mode ?? null,
        service_attendance_mode: deliverySettings?.attendance_mode ?? null
      },
      checkinTokens,
      googleSync,
      meetingDelivery,
      communication
    };
  }
}

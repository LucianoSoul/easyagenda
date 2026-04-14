import { AppointmentsRepository } from "./appointments.repository.js";
import { PaymentsService } from "../payments/payments.service.js";
import { AppError } from "../../shared/errors/app-error.js";
import { RefundsRepository } from "../refunds/refunds.repository.js";
import {
  getAppointmentDeliverySettings,
  getServiceAttendanceMode,
  isAppointmentDeliveryMode,
  type AppointmentDeliveryMode
} from "../../shared/utils/delivery-modes.js";

export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository = new AppointmentsRepository(),
    private readonly paymentsService = new PaymentsService(),
    private readonly refundsRepository = new RefundsRepository()
  ) {}

  async createAppointment(input: {
    accountId: string;
    userId: string;
    appointment: {
      clientId: string;
      serviceId: string;
      startTime: string;
      endTime: string;
      price?: number;
      notes?: string;
      deliveryMode?: string;
    };
  }) {
    const client = await this.appointmentsRepository.getClientForUser({
      clientId: input.appointment.clientId,
      accountId: input.accountId,
      userId: input.userId
    });

    const service = await this.appointmentsRepository.getServiceForUser({
      serviceId: input.appointment.serviceId,
      accountId: input.accountId,
      userId: input.userId
    });

    if (!client) {
      throw new AppError(404, "CLIENT_NOT_FOUND", "Cliente nao encontrado para este usuario.");
    }

    if (!service) {
      throw new AppError(404, "SERVICE_NOT_FOUND", "Servico nao encontrado para este usuario.");
    }

    if (!service.active) {
      throw new AppError(400, "SERVICE_INACTIVE", "Servico inativo.");
    }

    const settings = await this.appointmentsRepository.getSchedulingSettingsByUserId(input.userId);
    const attendanceMode = getServiceAttendanceMode(settings.scheduling, service.id);
    const requestedDeliveryModeInput = input.appointment.deliveryMode;

    if (
      requestedDeliveryModeInput !== undefined &&
      !isAppointmentDeliveryMode(requestedDeliveryModeInput)
    ) {
      throw new AppError(
        400,
        "INVALID_DELIVERY_MODE",
        "deliveryMode deve ser in_person ou online."
      );
    }

    const requestedDeliveryMode = requestedDeliveryModeInput;

    let deliveryMode: AppointmentDeliveryMode;

    if (attendanceMode === "hybrid") {
      if (!requestedDeliveryMode) {
        throw new AppError(
          400,
          "DELIVERY_MODE_REQUIRED",
          "Servico hibrido exige escolha entre atendimento presencial ou online."
        );
      }

      deliveryMode = requestedDeliveryMode;
    } else if (attendanceMode === "online_only") {
      if (requestedDeliveryMode === "in_person") {
        throw new AppError(
          400,
          "SERVICE_ATTENDANCE_MODE_MISMATCH",
          "Servico configurado como online_only aceita apenas agendamentos online."
        );
      }

      deliveryMode = "online";
    } else {
      if (requestedDeliveryMode === "online") {
        throw new AppError(
          400,
          "SERVICE_ATTENDANCE_MODE_MISMATCH",
          "Servico configurado como in_person_only aceita apenas agendamentos presenciais."
        );
      }

      deliveryMode = "in_person";
    }

    const appointment = await this.appointmentsRepository.createAppointment({
      accountId: input.accountId,
      userId: input.userId,
      clientId: input.appointment.clientId,
      serviceId: input.appointment.serviceId,
      startTime: input.appointment.startTime,
      endTime: input.appointment.endTime,
      price: input.appointment.price ?? Number(service.price),
      notes: input.appointment.notes
    });

    await this.appointmentsRepository.saveAppointmentDeliveryMode({
      userId: input.userId,
      appointmentId: appointment.id,
      deliveryMode,
      attendanceMode
    });

    const payment = await this.paymentsService.createPaymentForAppointment({
      appointmentId: appointment.id,
      userId: input.userId,
      accountId: input.accountId
    });

    return {
      appointment: {
        ...appointment,
        delivery_mode: deliveryMode,
        service_attendance_mode: attendanceMode
      },
      payment
    };
  }

  async cancelAppointment(input: {
    appointmentId: string;
    accountId: string;
    cancelledBy: "client" | "professional" | "system";
    reason?: string;
  }) {
    const currentAppointment = await this.appointmentsRepository.getAppointmentByIdForAccount({
      appointmentId: input.appointmentId,
      accountId: input.accountId
    });

    if (!currentAppointment) {
      throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento nao encontrado.");
    }

    await this.appointmentsRepository.cancelAppointmentFn({
      appointmentId: input.appointmentId,
      cancelledBy: input.cancelledBy,
      reason: input.reason
    });

    const appointment = await this.appointmentsRepository.getAppointmentByIdForAccount({
      appointmentId: input.appointmentId,
      accountId: input.accountId
    });

    const refundDecision = await this.refundsRepository.getLatestByAppointment({
      appointmentId: input.appointmentId,
      accountId: input.accountId
    });

    return {
      appointment,
      refundDecision
    };
  }

  async getAppointmentById(input: { appointmentId: string; accountId: string }) {
    const appointment = await this.appointmentsRepository.getAppointmentByIdForAccount(input);

    if (!appointment) {
      return null;
    }

    const scheduling = await this.appointmentsRepository.getSchedulingSettingsByUserId(
      appointment.user_id
    );
    const deliverySettings = getAppointmentDeliverySettings(scheduling.scheduling, appointment.id);

    return {
      ...appointment,
      delivery_mode: deliverySettings?.delivery_mode ?? null,
      service_attendance_mode:
        deliverySettings?.attendance_mode ??
        getServiceAttendanceMode(scheduling.scheduling, appointment.service_id)
    };
  }

  async listAppointments(accountId: string) {
    return this.appointmentsRepository.listAppointmentsByAccount(accountId);
  }
}

import { AppError } from "../../shared/errors/app-error.js";
import type { ClientHistoryQuery } from "./client.schemas.js";
import { ClientRepository } from "./client.repository.js";
import type {
  AppointmentWithRelationsRow,
  AttendanceRecord,
  CheckinTokenRecord,
  PaymentRecord,
  RefundDecisionRecord
} from "./client.types.js";

export class ClientService {
  constructor(private readonly clientRepository = new ClientRepository()) {}

  async getDashboard(input: { clientId: string; accountId: string }) {
    const nowIso = new Date().toISOString();

    const [
      upcomingConfirmedCount,
      pendingPaymentCount,
      cancelledOrPastCount,
      nextAppointments
    ] = await Promise.all([
      this.clientRepository.countUpcomingConfirmed({
        clientId: input.clientId,
        accountId: input.accountId,
        nowIso
      }),
      this.clientRepository.countPendingPayment({
        clientId: input.clientId,
        accountId: input.accountId,
        nowIso
      }),
      this.clientRepository.countCancelledOrPast({
        clientId: input.clientId,
        accountId: input.accountId,
        nowIso
      }),
      this.clientRepository.listNextAppointments({
        clientId: input.clientId,
        accountId: input.accountId,
        nowIso,
        limit: 5
      })
    ]);

    return {
      upcomingConfirmedCount,
      pendingPaymentCount,
      cancelledOrPastCount,
      nextAppointments: nextAppointments.map((appointment) =>
        this.mapAppointmentSummary(appointment)
      )
    };
  }

  async getAppointmentHistory(input: {
    clientId: string;
    accountId: string;
    query: ClientHistoryQuery;
  }) {
    const nowIso = new Date().toISOString();
    const from = (input.query.page - 1) * input.query.pageSize;
    const to = from + input.query.pageSize - 1;

    const result = await this.clientRepository.listHistory({
      clientId: input.clientId,
      accountId: input.accountId,
      nowIso,
      from,
      to
    });

    return {
      items: result.data.map((appointment) => this.mapAppointmentSummary(appointment)),
      pagination: {
        page: input.query.page,
        pageSize: input.query.pageSize,
        total: result.count,
        totalPages: result.count === 0 ? 0 : Math.ceil(result.count / input.query.pageSize)
      }
    };
  }

  async getAppointmentDetail(input: {
    appointmentId: string;
    clientId: string;
    accountId: string;
  }) {
    const appointment = await this.clientRepository.getAppointmentDetail(input);

    if (!appointment) {
      throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento nao encontrado.");
    }

    return {
      id: appointment.id,
      accountId: appointment.account_id,
      clientId: appointment.client_id,
      status: appointment.status,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      createdAt: appointment.created_at,
      notes: appointment.notes,
      checkinRequired: appointment.checkin_required,
      cancelledAt: appointment.cancelled_at,
      cancelledBy: appointment.cancelled_by,
      cancellationReason: appointment.cancellation_reason,
      pricing: {
        price: appointment.price,
        originalPrice: appointment.original_price,
        finalPrice: appointment.final_price,
        paymentRequiredAmount: appointment.payment_required_amount,
        creditAppliedAmount: appointment.credit_applied_amount,
        discountAmount: appointment.discount_amount
      },
      client: appointment.clients,
      service: appointment.services,
      provider: appointment.users,
      account: appointment.accounts,
      payment: this.getLatestByDate(appointment.payments),
      refundDecision: this.getLatestByDate(appointment.refund_decisions),
      checkinToken: this.getLatestByDate(appointment.checkin_tokens),
      attendance: this.getLatestByDate(appointment.attendance)
    };
  }

  private mapAppointmentSummary(appointment: AppointmentWithRelationsRow) {
    return {
      id: appointment.id,
      status: appointment.status,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      createdAt: appointment.created_at,
      notes: appointment.notes,
      cancelledAt: appointment.cancelled_at,
      cancellationReason: appointment.cancellation_reason,
      pricing: {
        price: appointment.price,
        finalPrice: appointment.final_price,
        paymentRequiredAmount: appointment.payment_required_amount
      },
      client: appointment.clients,
      service: appointment.services,
      provider: appointment.users,
      account: appointment.accounts,
      payment: this.getLatestByDate(appointment.payments),
      refundDecision: this.getLatestByDate(appointment.refund_decisions),
      checkinToken: this.getLatestByDate(appointment.checkin_tokens),
      attendance: this.getLatestByDate(appointment.attendance)
    };
  }

  private getLatestByDate<T extends { created_at: string }>(items: T[]): T | null {
    if (!items || items.length === 0) {
      return null;
    }

    return [...items].sort((left, right) => {
      return Date.parse(right.created_at) - Date.parse(left.created_at);
    })[0];
  }
}

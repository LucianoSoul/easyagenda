import { AgendaRepository } from "./agenda.repository.js";
import { getAppointmentDeliverySettings, getServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";
function pickSingle(value) {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}
export class AgendaService {
    agendaRepository;
    constructor(agendaRepository = new AgendaRepository()) {
        this.agendaRepository = agendaRepository;
    }
    async listAgenda(input) {
        const range = this.resolveRange(input.query);
        const appointments = await this.agendaRepository.listAgenda({
            accountId: input.accountId,
            startTime: range.startTime,
            endTime: range.endTime,
            status: input.query.status
        });
        const schedulingByUserId = await this.agendaRepository.listSchedulingSettingsByUserIds([
            ...new Set(appointments.map((appointment) => appointment.user_id))
        ]);
        return appointments.map((appointment) => this.mapAgendaItem(appointment, schedulingByUserId.get(appointment.user_id)));
    }
    resolveRange(query) {
        if (query.from && query.to) {
            return {
                startTime: new Date(query.from).toISOString(),
                endTime: new Date(query.to).toISOString()
            };
        }
        if (query.date) {
            return this.getDayRange(query.date);
        }
        return this.getTodayRange();
    }
    getTodayRange() {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return {
            startTime: start.toISOString(),
            endTime: end.toISOString()
        };
    }
    getDayRange(date) {
        const start = new Date(`${date}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        return {
            startTime: start.toISOString(),
            endTime: end.toISOString()
        };
    }
    mapAgendaItem(appointment, scheduling = {}) {
        const deliverySettings = getAppointmentDeliverySettings(scheduling, appointment.id);
        return {
            appointment: {
                id: appointment.id,
                start_time: appointment.start_time,
                end_time: appointment.end_time,
                status: appointment.status,
                notes: appointment.notes,
                original_price: appointment.original_price,
                credit_applied_amount: appointment.credit_applied_amount,
                final_price: appointment.final_price,
                payment_required_amount: appointment.payment_required_amount,
                cancelled_at: appointment.cancelled_at,
                cancelled_by: appointment.cancelled_by,
                delivery_mode: deliverySettings?.delivery_mode ?? null,
                service_attendance_mode: deliverySettings?.attendance_mode ??
                    getServiceAttendanceMode(scheduling, appointment.service_id)
            },
            client: pickSingle(appointment.clients),
            service: pickSingle(appointment.services),
            payment: this.getLatestByDate(appointment.payments),
            attendance: this.getLatestByDate(appointment.attendance),
            checkinToken: this.getLatestByDate(appointment.checkin_tokens)
        };
    }
    getLatestByDate(items) {
        if (!items || items.length === 0) {
            return null;
        }
        return [...items].sort((left, right) => {
            return Date.parse(right.created_at) - Date.parse(left.created_at);
        })[0];
    }
}

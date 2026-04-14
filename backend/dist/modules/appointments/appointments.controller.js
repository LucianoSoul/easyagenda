import { ok } from "../../shared/utils/http.js";
import { createAppointmentSchema, cancelAppointmentSchema } from "./appointments.schemas.js";
import { AppointmentsService } from "./appointments.service.js";
import { GoogleService } from "../google/google.service.js";
const service = new AppointmentsService();
const googleService = new GoogleService();
export async function registerAppointmentRoutes(app) {
    app.get("/", async (request) => {
        const context = request.contextUser;
        const appointments = await service.listAppointments(context.accountId);
        return ok(appointments);
    });
    app.get("/:id", async (request) => {
        const params = request.params;
        const context = request.contextUser;
        const appointment = await service.getAppointmentById({
            appointmentId: params.id,
            accountId: context.accountId
        });
        return ok(appointment);
    });
    app.post("/", async (request) => {
        const body = createAppointmentSchema.parse(request.body);
        const context = request.contextUser;
        const result = await service.createAppointment({
            accountId: context.accountId,
            userId: context.userId,
            appointment: body
        });
        return ok(result);
    });
    app.post("/:id/cancel", async (request) => {
        const params = request.params;
        const body = cancelAppointmentSchema.parse(request.body);
        const context = request.contextUser;
        const result = await service.cancelAppointment({
            appointmentId: params.id,
            accountId: context.accountId,
            cancelledBy: body.cancelledBy,
            reason: body.reason
        });
        return ok(result);
    });
    app.post("/:id/google-sync", async (request) => {
        const params = request.params;
        const context = request.contextUser;
        const result = await googleService.createCalendarEventForAppointment({
            appointmentId: params.id,
            accountId: context.accountId,
            userId: context.userId
        });
        return ok(result);
    });
}

import { AppError } from "../../shared/errors/app-error.js";
import { CheckinRepository } from "./checkin.repository.js";
const mapCheckinError = (message) => {
    const normalized = message.toLowerCase();
    if (normalized.includes("inválido") || normalized.includes("invalido")) {
        return new AppError(400, "INVALID_TOKEN", "Token invalido.");
    }
    if (normalized.includes("expirado")) {
        return new AppError(400, "TOKEN_EXPIRED", "Token expirado.");
    }
    if (normalized.includes("já utilizado") || normalized.includes("ja utilizado")) {
        return new AppError(400, "TOKEN_ALREADY_USED", "Token ja utilizado.");
    }
    if (normalized.includes("check-in já realizado") || normalized.includes("check-in ja realizado")) {
        return new AppError(400, "APPOINTMENT_ALREADY_CHECKED_IN", "Agendamento ja realizou check-in.");
    }
    return null;
};
export class CheckinService {
    repository;
    constructor(repository = new CheckinRepository()) {
        this.repository = repository;
    }
    async performByToken(token) {
        try {
            await this.repository.performByToken(token);
        }
        catch (error) {
            if (error && typeof error === "object" && "message" in error) {
                const message = String(error.message ?? "");
                const mappedError = mapCheckinError(message);
                if (mappedError) {
                    throw mappedError;
                }
            }
            throw error;
        }
        const usedToken = await this.repository.getTokenByToken(token);
        if (!usedToken) {
            throw new AppError(404, "TOKEN_NOT_FOUND", "Token nao encontrado.");
        }
        const attendance = await this.repository.getLatestAttendanceByAppointmentId(usedToken.appointment_id);
        if (!attendance) {
            throw new AppError(500, "ATTENDANCE_NOT_FOUND", "Check-in realizado, mas a presenca nao foi encontrada.");
        }
        const appointment = await this.repository.getAppointmentById(usedToken.appointment_id);
        return {
            attendance,
            appointment,
            checkinToken: usedToken
        };
    }
}

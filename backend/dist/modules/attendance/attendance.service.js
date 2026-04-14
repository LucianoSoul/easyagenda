import { attendanceRepository } from "./attendance.repository.js";
export const attendanceService = {
    async list() {
        return attendanceRepository.findAll();
    },
    async create(payload) {
        return attendanceRepository.create(payload);
    }
};

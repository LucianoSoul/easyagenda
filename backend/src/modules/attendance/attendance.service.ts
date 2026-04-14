import { attendanceRepository } from "./attendance.repository.js";
import type { CreateAttendanceInput } from "./attendance.schemas.js";

export const attendanceService = {
  async list() {
    return attendanceRepository.findAll();
  },
  async create(payload: CreateAttendanceInput) {
    return attendanceRepository.create(payload);
  }
};

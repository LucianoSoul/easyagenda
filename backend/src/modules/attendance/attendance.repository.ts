import type { CreateAttendanceInput } from "./attendance.schemas.js";
import type { Attendance } from "./attendance.types.js";

export const attendanceRepository = {
  async findAll(): Promise<Attendance[]> {
    return [];
  },
  async create(payload: CreateAttendanceInput): Promise<Attendance> {
    return { id: "attendance_1", ...payload };
  }
};

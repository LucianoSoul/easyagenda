import type { ServiceAttendanceMode } from "../../shared/utils/delivery-modes.js";

export type LookupClient = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type LookupService = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  attendance_mode: ServiceAttendanceMode;
};

import type { LookupService } from "../types/api";
import { formatCurrency } from "./format";
import { getLabelForValue } from "./ui-labels";

export function joinPresentationParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" • ");
}

export function formatDurationMinutes(value: number | null | undefined) {
  if (!value || value <= 0) return "Duração não informada";
  return `${value} min`;
}

export function formatServiceSummary(service: Pick<LookupService, "duration_minutes" | "attendance_mode" | "price">) {
  return joinPresentationParts([
    formatDurationMinutes(service.duration_minutes),
    getLabelForValue(service.attendance_mode, "attendance-mode"),
    formatCurrency(service.price)
  ]);
}

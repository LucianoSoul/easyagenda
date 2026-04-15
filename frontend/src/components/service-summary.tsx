import { formatCurrency } from "../utils/format";
import { formatDurationMinutes, joinPresentationParts } from "../utils/presentation";
import { getLabelForValue } from "../utils/ui-labels";

type ServiceSummaryProps = {
  serviceName?: string | null;
  durationMinutes?: number | null;
  attendanceMode?: string | null;
  price?: number | null;
  variant?: "compact" | "full";
  className?: string;
};

export function ServiceSummary({
  serviceName,
  durationMinutes,
  attendanceMode,
  price,
  variant = "full",
  className = ""
}: ServiceSummaryProps) {
  const parts =
    variant === "compact"
      ? [
          serviceName ?? "Servico nao informado",
          getLabelForValue(attendanceMode, "delivery-mode")
        ]
      : [
          formatDurationMinutes(durationMinutes),
          getLabelForValue(attendanceMode, "attendance-mode"),
          formatCurrency(price)
        ];

  const nextClassName = ["service-summary", `service-summary--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={nextClassName}>{joinPresentationParts(parts)}</span>;
}

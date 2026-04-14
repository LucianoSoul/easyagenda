type StatusBadgeProps = {
  label: string;
  tone:
    | "neutral"
    | "warning"
    | "success"
    | "danger"
    | "info"
    | "online"
    | "inperson";
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <span className={`badge badge--${tone}`}>{label}</span>;
}

export function appointmentStatusTone(status: string) {
  if (status === "confirmed") return "success" as const;
  if (status === "pending_payment") return "warning" as const;
  if (status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

export function paymentStatusTone(status: string | null | undefined) {
  if (status === "approved") return "success" as const;
  if (status === "pending") return "warning" as const;
  if (status === "failed") return "danger" as const;
  return "neutral" as const;
}

export function deliveryModeTone(mode: string | null | undefined) {
  if (mode === "online") return "online" as const;
  if (mode === "in_person") return "inperson" as const;
  return "neutral" as const;
}

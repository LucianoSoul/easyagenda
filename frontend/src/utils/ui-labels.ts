export type LabelVariant =
  | "appointment-status"
  | "payment-status"
  | "delivery-mode"
  | "attendance-mode"
  | "attendance-status"
  | "checkin-method"
  | "payment-method"
  | "payment-gateway"
  | "communication"
  | "binary"
  | "generic";

const appointmentStatusLabels: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pending: "Pendente",
  confirmed: "Confirmada",
  approved: "Aprovado",
  cancelled: "Cancelada",
  no_show: "Não compareceu",
  completed: "Concluída",
  rescheduled: "Reagendada"
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  authorized: "Autorizado",
  cancelled: "Cancelado",
  failed: "Falhou",
  refunded: "Estornado",
  chargeback: "Contestação"
};

const deliveryModeLabels: Record<string, string> = {
  online: "Online",
  in_person: "Presencial"
};

const attendanceModeLabels: Record<string, string> = {
  online_only: "Somente online",
  in_person_only: "Somente presencial",
  hybrid: "Híbrida"
};

const attendanceStatusLabels: Record<string, string> = {
  checked_in: "Check-in realizado",
  pending: "Aguardando chegada",
  arrived: "Chegou",
  in_progress: "Em atendimento",
  completed: "Concluído",
  missed: "Ausente",
  no_show: "Não compareceu",
  cancelled: "Cancelado"
};

const checkinMethodLabels: Record<string, string> = {
  manual: "Manual",
  qr_code: "QR Code",
  token: "Token",
  link: "Link"
};

const paymentMethodLabels: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  boleto: "Boleto",
  cash: "Dinheiro"
};

const gatewayLabels: Record<string, string> = {
  mercado_pago: "Mercado Pago",
  mercadopago: "Mercado Pago",
  stripe: "Stripe",
  pagarme: "Pagar.me",
  asaas: "Asaas"
};

const communicationLabels: Record<string, string> = {
  consultation_created_pending_payment: "Consulta criada",
  payment_approved: "Pagamento aprovado",
  consultation_reminder_in_person: "Lembrete presencial",
  consultation_reminder_online: "Lembrete online"
};

function humanizeLabel(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalized) return "Não informado";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getLabelForValue(
  value: string | null | undefined,
  variant: LabelVariant = "generic"
) {
  if (!value) return "Não informado";

  const maps: Record<Exclude<LabelVariant, "binary" | "generic">, Record<string, string>> = {
    "appointment-status": appointmentStatusLabels,
    "payment-status": paymentStatusLabels,
    "delivery-mode": deliveryModeLabels,
    "attendance-mode": attendanceModeLabels,
    "attendance-status": attendanceStatusLabels,
    "checkin-method": checkinMethodLabels,
    "payment-method": paymentMethodLabels,
    "payment-gateway": gatewayLabels,
    communication: communicationLabels
  };

  if (variant === "generic") {
    return humanizeLabel(value);
  }

  if (variant === "binary") {
    const normalized = value.trim().toLowerCase();
    if (["true", "sim", "yes", "y", "1", "ok", "conectado"].includes(normalized)) {
      return "Sim";
    }

    if (["false", "nao", "não", "no", "n", "0", "desconectado"].includes(normalized)) {
      return "Não";
    }

    return humanizeLabel(value);
  }

  return maps[variant][value] ?? humanizeLabel(value);
}

export function getBooleanLabel(value: boolean, labels?: { trueLabel?: string; falseLabel?: string }) {
  return value ? labels?.trueLabel ?? "Sim" : labels?.falseLabel ?? "Não";
}

export function getSearchableText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(value));
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value ?? 0);
}

export function formatLongDate(value: string | null | undefined) {
  if (!value) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  }).format(new Date(value));
}

export function toLocalDateInput(date: Date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}

export function toIsoFromLocalDateTime(value: string) {
  return new Date(value).toISOString();
}

export function fromIsoToLocalDateTime(value: string) {
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}

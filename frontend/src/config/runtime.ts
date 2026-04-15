function normalizeBaseUrl(value: string | undefined | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function resolveApiBaseUrl() {
  const configured = normalizeBaseUrl(import.meta.env.VITE_API_URL);

  if (configured) {
    return configured;
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:3006/";
  }

  throw new Error(
    "Missing VITE_API_URL. Set the live Render backend URL before running a production build."
  );
}

export const apiBaseUrl = resolveApiBaseUrl();

export function buildPublicConsultationPath(consultationId: string) {
  return `/public/consultations/${consultationId}`;
}

export function getPublicAppBaseUrl() {
  const configured = normalizeBaseUrl(import.meta.env.VITE_PUBLIC_APP_BASE_URL);

  if (configured) {
    return configured;
  }

  if (import.meta.env.DEV && typeof window !== "undefined" && window.location.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return null;
}

export function buildPublicConsultationUrl(consultationId: string) {
  const publicPath = buildPublicConsultationPath(consultationId);
  const publicBaseUrl = getPublicAppBaseUrl();

  return publicBaseUrl ? new URL(publicPath, publicBaseUrl).toString() : publicPath;
}

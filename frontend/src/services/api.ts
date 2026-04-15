import type {
  AgendaItem,
  ApiEnvelope,
  AppointmentDetail,
  AuthSession,
  CommunicationsPreview,
  ConsultationCreateInput,
  ConsultationCreateResult,
  ConsultationPublicStatus,
  GoogleIntegrationStatus,
  LookupClient,
  LookupService,
  PaymentRecord,
  RefundDecision
} from "../types/api";
import { apiBaseUrl } from "../config/runtime";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path: string, query?: Record<string, string | undefined>) {
  const url = new URL(path, apiBaseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

async function request<T>(
  path: string,
  input: {
    method?: string;
    token?: string | null;
    body?: unknown;
    query?: Record<string, string | undefined>;
  } = {}
): Promise<T> {
  const response = await fetch(buildUrl(path, input.query), {
    method: input.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(input.token ? { Authorization: `Bearer ${input.token}` } : {})
    },
    body: input.body === undefined ? undefined : JSON.stringify(input.body)
  });

  const json = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { error?: { message?: string; code?: string } }
    | null;

  if (!response.ok || !json || !("success" in json) || !json.success) {
    const message =
      (json && "error" in json && json.error?.message) || "Nao foi possivel concluir a operacao.";
    const code = json && "error" in json ? json.error?.code : undefined;
    throw new ApiError(response.status, message, code);
  }

  return json.data;
}

export const api = {
  devLogin(email: string, password: string) {
    return request<AuthSession>("/auth/dev-login", {
      method: "POST",
      body: { email, password }
    });
  },
  getAgenda(token: string, query?: Record<string, string | undefined>) {
    return request<AgendaItem[]>("/agenda", { token, query });
  },
  getPayments(token: string) {
    return request<PaymentRecord[]>("/payments", { token });
  },
  getAppointment(token: string, id: string) {
    return request<AppointmentDetail>(`/appointments/${id}`, { token });
  },
  createConsultation(token: string, body: ConsultationCreateInput) {
    return request<ConsultationCreateResult>("/consultations", {
      method: "POST",
      token,
      body
    });
  },
  getConsultationPublicStatus(id: string) {
    return request<ConsultationPublicStatus>(`/consultations/${id}/public-status`);
  },
  getCommunicationsPreview(token: string, id: string) {
    return request<CommunicationsPreview>(`/consultations/${id}/communications-preview`, {
      token
    });
  },
  cancelAppointment(token: string, appointmentId: string, reason?: string) {
    return request<{ appointment: { id: string; status: string } }>(
      `/appointments/${appointmentId}/cancel`,
      {
        method: "POST",
        token,
        body: {
          cancelledBy: "professional",
          reason
        }
      }
    );
  },
  syncGoogle(token: string, appointmentId: string) {
    return request<{
      google_event_id?: string | null;
      html_link?: string | null;
      meet_link?: string | null;
    }>(`/appointments/${appointmentId}/google-sync`, {
      method: "POST",
      token,
      body: {}
    });
  },
  listClients(token: string) {
    return request<LookupClient[]>("/lookups/clients", { token });
  },
  listServices(token: string) {
    return request<LookupService[]>("/lookups/services", { token });
  },
  getGoogleStatus(token: string) {
    return request<GoogleIntegrationStatus>("/integrations/google/status", { token });
  },
  getPendingRefundDecisions(token: string) {
    return request<RefundDecision[]>("/refund-decisions/pending", { token });
  }
};

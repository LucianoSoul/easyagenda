import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errors/app-error.js";
import { createRequestId } from "../../shared/utils/ids.js";
import { GoogleRepository } from "./google.repository.js";
import type {
  GoogleAppointmentSyncContext,
  GoogleCalendarEventResponse,
  GoogleConnection,
  GoogleOAuthTokenResponse
} from "./google.types.js";

type GoogleStatePayload = {
  accountId: string;
  userId: string;
  redirectUri: string;
  issuedAt: number;
  nonce: string;
};

type ConnectUrlInput = {
  accountId: string;
  userId: string;
  origin?: string;
};

type CallbackInput = {
  code: string;
  state: string;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function joinUrl(base: string, path: string) {
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

export class GoogleService {
  constructor(private readonly repository = new GoogleRepository()) {}

  async getConnectUrl(input: ConnectUrlInput) {
    this.assertGoogleConfigured();

    const redirectUri = this.resolveRedirectUri(input.origin);
    const state = this.signState({
      accountId: input.accountId,
      userId: input.userId,
      redirectUri,
      issuedAt: Date.now(),
      nonce: createRequestId()
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("scope", this.getGoogleScopes().join(" "));
    url.searchParams.set("state", state);

    return {
      url: url.toString(),
      redirectUri,
      scope: this.getGoogleScopes()
    };
  }

  async handleCallback(input: CallbackInput) {
    this.assertGoogleConfigured();

    const state = this.verifyState(input.state);
    const tokenResponse = await this.exchangeCodeForTokens({
      code: input.code,
      redirectUri: state.redirectUri
    });
    const userInfo = await this.fetchGoogleUserInfo(tokenResponse.access_token);
    const current = await this.repository.getGoogleSettingsByUserId(state.userId);
    const currentConnection = current.google.connection;

    const connection: GoogleConnection = {
      provider: "google",
      account_id: state.accountId,
      user_id: state.userId,
      google_email: userInfo.email,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token ?? currentConnection?.refresh_token ?? null,
      expiry_date: tokenResponse.expires_in
        ? Date.now() + tokenResponse.expires_in * 1000
        : currentConnection?.expiry_date ?? null,
      scope: (tokenResponse.scope ?? this.getGoogleScopes().join(" "))
        .split(" ")
        .filter(Boolean),
      connected_at: currentConnection?.connected_at ?? new Date().toISOString(),
      disconnected_at: null
    };

    await this.repository.upsertGoogleConnection({
      userId: state.userId,
      connection
    });

    return this.buildConnectionStatus(connection);
  }

  async getStatus(userId: string) {
    const current = await this.repository.getGoogleSettingsByUserId(userId);
    return this.buildConnectionStatus(current.google.connection ?? null);
  }

  async disconnect(userId: string) {
    const current = await this.repository.getGoogleSettingsByUserId(userId);
    const connection = current.google.connection;

    if (connection?.refresh_token || connection?.access_token) {
      await this.revokeToken(connection.refresh_token ?? connection.access_token).catch((error) => {
        console.error(error);
      });
    }

    const updated = await this.repository.disconnectGoogleConnection(userId);
    return this.buildConnectionStatus(updated.google.connection ?? null);
  }

  async createCalendarEventForAppointment(input: {
    appointmentId: string;
    accountId: string;
    userId: string;
  }) {
    const current = await this.repository.getGoogleSettingsByUserId(input.userId);
    const connection = this.assertConnected(current.google.connection);
    const appointment = await this.repository.getAppointmentSyncContext({
      appointmentId: input.appointmentId,
      accountId: input.accountId
    });

    if (!appointment) {
      throw new AppError(404, "APPOINTMENT_NOT_FOUND", "Agendamento nao encontrado.");
    }

    const accessToken = await this.getValidAccessToken({
      userId: input.userId,
      connection
    });
    const existingMapping = current.google.calendar_events?.[input.appointmentId];
    const wantsMeet = this.shouldCreateMeet(appointment);

    try {
      const event = existingMapping
        ? await this.updateGoogleCalendarEvent({
            accessToken,
            appointment,
            eventId: existingMapping.event_id,
            createMeet: wantsMeet && !existingMapping.meet_link,
            timezone: current.settings.timezone ?? "America/Sao_Paulo"
          })
        : await this.createGoogleCalendarEvent({
            accessToken,
            appointment,
            createMeet: wantsMeet,
            timezone: current.settings.timezone ?? "America/Sao_Paulo"
          });

      const mapping = {
        appointment_id: appointment.id,
        event_id: event.id,
        html_link: event.htmlLink ?? existingMapping?.html_link ?? null,
        meet_link: this.extractMeetLink(event) ?? existingMapping?.meet_link ?? null,
        synced_at: new Date().toISOString()
      };

      await this.repository.saveAppointmentEventMapping({
        userId: input.userId,
        appointmentId: appointment.id,
        mapping
      });

      return {
        appointment,
        delivery_mode: appointment.delivery_mode,
        google_event_id: mapping.event_id,
        html_link: mapping.html_link,
        meet_link: mapping.meet_link,
        notification: this.buildNotificationStatus({
          appointment,
          sendUpdates: wantsMeet && !!appointment.clients?.email
        })
      };
    } catch (error) {
      console.error(error);
      throw new AppError(
        502,
        "GOOGLE_EVENT_SYNC_FAILED",
        "Nao foi possivel sincronizar o agendamento com o Google Calendar."
      );
    }
  }

  async updateCalendarEventForAppointment(input: {
    appointmentId: string;
    accountId: string;
    userId: string;
  }) {
    return this.createCalendarEventForAppointment(input);
  }

  async cancelCalendarEventForAppointment(input: {
    appointmentId: string;
    accountId: string;
    userId: string;
  }) {
    const current = await this.repository.getGoogleSettingsByUserId(input.userId);
    const connection = this.assertConnected(current.google.connection);
    const mapping = current.google.calendar_events?.[input.appointmentId];

    if (!mapping) {
      throw new AppError(404, "GOOGLE_EVENT_NOT_FOUND", "Evento Google nao encontrado para este agendamento.");
    }

    const accessToken = await this.getValidAccessToken({
      userId: input.userId,
      connection
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(mapping.event_id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: "cancelled"
        })
      }
    );

    if (!response.ok) {
      throw new AppError(
        502,
        "GOOGLE_EVENT_SYNC_FAILED",
        "Nao foi possivel cancelar o evento no Google Calendar."
      );
    }

    return {
      appointmentId: input.appointmentId,
      googleEventId: mapping.event_id,
      cancelled: true
    };
  }

  private getGoogleScopes() {
    return [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar.events"
    ];
  }

  private assertGoogleConfigured() {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new AppError(
        503,
        "GOOGLE_NOT_CONFIGURED",
        "Integracao Google nao configurada no ambiente."
      );
    }
  }

  private resolveRedirectUri(origin?: string) {
    if (env.GOOGLE_OAUTH_REDIRECT_URI) {
      return env.GOOGLE_OAUTH_REDIRECT_URI;
    }

    if (!origin) {
      throw new AppError(
        503,
        "GOOGLE_NOT_CONFIGURED",
        "Redirect URI do Google nao configurada."
      );
    }

    return joinUrl(origin, "/integrations/google/callback");
  }

  private signState(payload: GoogleStatePayload) {
    const payloadJson = JSON.stringify(payload);
    const encodedPayload = encodeBase64Url(payloadJson);
    const signature = createHmac("sha256", this.getStateSecret())
      .update(encodedPayload)
      .digest("base64url");

    return `${encodedPayload}.${signature}`;
  }

  private verifyState(state: string): GoogleStatePayload {
    const [encodedPayload, signature] = state.split(".");

    if (!encodedPayload || !signature) {
      throw new AppError(400, "GOOGLE_OAUTH_FAILED", "State OAuth invalido.");
    }

    const expected = createHmac("sha256", this.getStateSecret())
      .update(encodedPayload)
      .digest("base64url");

    if (
      expected.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      throw new AppError(400, "GOOGLE_OAUTH_FAILED", "State OAuth invalido.");
    }

    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as GoogleStatePayload;

    if (Date.now() - payload.issuedAt > 15 * 60 * 1000) {
      throw new AppError(400, "GOOGLE_OAUTH_FAILED", "State OAuth expirado.");
    }

    return payload;
  }

  private getStateSecret() {
    return env.GOOGLE_OAUTH_STATE_SECRET ?? env.SUPABASE_SERVICE_ROLE_KEY;
  }

  private async exchangeCodeForTokens(input: {
    code: string;
    redirectUri: string;
  }) {
    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      throw new AppError(502, "GOOGLE_OAUTH_FAILED", "Falha ao trocar o codigo OAuth do Google.");
    }

    return (await response.json()) as GoogleOAuthTokenResponse;
  }

  private async fetchGoogleUserInfo(accessToken: string) {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new AppError(
        502,
        "GOOGLE_OAUTH_FAILED",
        "Falha ao carregar os dados da conta Google conectada."
      );
    }

    const payload = (await response.json()) as { email?: string };

    if (!payload.email) {
      throw new AppError(
        502,
        "GOOGLE_OAUTH_FAILED",
        "Email da conta Google nao retornado."
      );
    }

    return {
      email: payload.email
    };
  }

  private assertConnected(connection: GoogleConnection | null | undefined) {
    if (
      !connection ||
      connection.disconnected_at ||
      !connection.access_token ||
      !connection.refresh_token
    ) {
      throw new AppError(400, "GOOGLE_NOT_CONNECTED", "Conta Google nao conectada.");
    }

    return connection;
  }

  private async getValidAccessToken(input: {
    userId: string;
    connection: GoogleConnection;
  }) {
    if (!input.connection.expiry_date || input.connection.expiry_date > Date.now() + 60_000) {
      return input.connection.access_token;
    }

    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: input.connection.refresh_token ?? ""
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!response.ok) {
      throw new AppError(502, "GOOGLE_OAUTH_FAILED", "Falha ao renovar o token Google.");
    }

    const refreshed = (await response.json()) as GoogleOAuthTokenResponse;
    const nextConnection: GoogleConnection = {
      ...input.connection,
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token ?? input.connection.refresh_token,
      expiry_date: refreshed.expires_in
        ? Date.now() + refreshed.expires_in * 1000
        : input.connection.expiry_date,
      scope: (refreshed.scope ?? input.connection.scope.join(" "))
        .split(" ")
        .filter(Boolean)
    };

    await this.repository.upsertGoogleConnection({
      userId: input.userId,
      connection: nextConnection
    });

    return nextConnection.access_token;
  }

  private buildEventPayload(input: {
    appointment: GoogleAppointmentSyncContext;
    createMeet: boolean;
    timezone: string;
  }) {
    const description = [
      `Easy Agenda`,
      `Cliente: ${input.appointment.clients?.name ?? "Nao informado"}`,
      `Servico: ${input.appointment.services?.name ?? "Nao informado"}`,
      `Modalidade: ${input.appointment.delivery_mode === "online" ? "Online" : "Presencial"}`,
      `Status: ${input.appointment.status}`,
      input.appointment.notes ? `Notas: ${input.appointment.notes}` : null
    ]
      .filter(Boolean)
      .join("\n");

    const payload: Record<string, unknown> = {
      summary: `${input.appointment.services?.name ?? "Agendamento"} - ${input.appointment.clients?.name ?? "Cliente"}`,
      description,
      start: {
        dateTime: input.appointment.start_time,
        timeZone: input.timezone
      },
      end: {
        dateTime: input.appointment.end_time,
        timeZone: input.timezone
      },
      extendedProperties: {
        private: {
          easy_agenda_appointment_id: input.appointment.id,
          easy_agenda_account_id: input.appointment.account_id
        }
      }
    };

    if (input.appointment.delivery_mode === "online" && input.appointment.clients?.email) {
      payload.attendees = [
        {
          email: input.appointment.clients.email,
          displayName: input.appointment.clients.name
        }
      ];
    }

    if (input.createMeet) {
      payload.conferenceData = {
        createRequest: {
          requestId: createRequestId(),
          conferenceSolutionKey: {
            type: "hangoutsMeet"
          }
        }
      };
    }

    return payload;
  }

  private async createGoogleCalendarEvent(input: {
    accessToken: string;
    appointment: GoogleAppointmentSyncContext;
    createMeet: boolean;
    timezone: string;
  }) {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    if (input.createMeet) {
      url.searchParams.set("conferenceDataVersion", "1");
    }
    if (input.appointment.delivery_mode === "online" && input.appointment.clients?.email) {
      url.searchParams.set("sendUpdates", "all");
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          this.buildEventPayload({
            appointment: input.appointment,
            createMeet: input.createMeet,
            timezone: input.timezone
          })
        )
      });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as GoogleCalendarEventResponse;
  }

  private async updateGoogleCalendarEvent(input: {
    accessToken: string;
    appointment: GoogleAppointmentSyncContext;
    eventId: string;
    createMeet: boolean;
    timezone: string;
  }) {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(input.eventId)}`
    );
    if (input.createMeet) {
      url.searchParams.set("conferenceDataVersion", "1");
    }
    if (input.appointment.delivery_mode === "online" && input.appointment.clients?.email) {
      url.searchParams.set("sendUpdates", "all");
    }

    const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          this.buildEventPayload({
            appointment: input.appointment,
            createMeet: input.createMeet,
            timezone: input.timezone
          })
        )
      });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return (await response.json()) as GoogleCalendarEventResponse;
  }

  private extractMeetLink(event: GoogleCalendarEventResponse) {
    return (
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.entryPointType === "video")
        ?.uri ??
      null
    );
  }

  private shouldCreateMeet(appointment: GoogleAppointmentSyncContext) {
    return (
      appointment.delivery_mode === "online" ||
      (!appointment.delivery_mode &&
        /\b(google meet|meet|video|online|virtual|teleconsulta|remote)\b/i.test(
          appointment.notes ?? ""
        ))
    );
  }

  private buildNotificationStatus(input: {
    appointment: GoogleAppointmentSyncContext;
    sendUpdates: boolean;
  }) {
    if (input.appointment.delivery_mode !== "online") {
      return null;
    }

    return {
      requested: input.sendUpdates,
      channel: input.sendUpdates ? "google_calendar_invite" : null,
      recipientEmail: input.appointment.clients?.email ?? null
    };
  }

  private async revokeToken(token: string) {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        token
      })
    });
  }

  private buildConnectionStatus(connection: GoogleConnection | null) {
    return {
      connected:
        !!connection &&
        !connection.disconnected_at &&
        !!connection.access_token &&
        !!connection.refresh_token,
      provider: "google" as const,
      googleEmail: connection?.google_email ?? null,
      scope: connection?.scope ?? [],
      connectedAt: connection?.connected_at ?? null,
      disconnectedAt: connection?.disconnected_at ?? null
    };
  }
}

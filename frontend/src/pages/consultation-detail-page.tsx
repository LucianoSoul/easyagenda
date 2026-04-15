import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth";
import { buildPublicConsultationUrl } from "../config/runtime";
import { LoadingBlock } from "../components/loading-block";
import {
  StatusBadge,
  appointmentStatusTone,
  deliveryModeTone,
  paymentStatusTone
} from "../components/status-badge";
import { api } from "../services/api";
import type {
  AgendaItem,
  AppointmentDetail,
  CommunicationsPreview,
  ConsultationPublicStatus,
  GoogleIntegrationStatus,
  PaymentRecord
} from "../types/api";
import { copyToClipboard, formatCurrency, formatDateTime, toLocalDateInput } from "../utils/format";
import { getBooleanLabel, getLabelForValue } from "../utils/ui-labels";

type DetailState = {
  appointment: AppointmentDetail;
  publicStatus: ConsultationPublicStatus;
  preview: CommunicationsPreview;
  payment: PaymentRecord | null;
  agendaItem: AgendaItem | null;
  googleStatus: GoogleIntegrationStatus;
};

export function ConsultationDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [state, setState] = useState<DetailState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;

    Promise.all([
      api.getAppointment(token, id),
      api.getConsultationPublicStatus(id),
      api.getCommunicationsPreview(token, id),
      api.getPayments(token),
      api.getGoogleStatus(token)
    ])
      .then(async ([appointment, publicStatus, preview, payments, googleStatus]) => {
        const appointmentDay = toLocalDateInput(new Date(appointment.start_time));
        const dayAgenda = await api.getAgenda(token, { date: appointmentDay });
        const agendaItem = dayAgenda.find((item) => item.appointment.id === appointment.id) ?? null;
        const payment = payments.find((entry) => entry.appointment_id === appointment.id) ?? null;

        setState({
          appointment,
          publicStatus,
          preview,
          payment,
          agendaItem,
          googleStatus
        });
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar a consulta."
        );
      });
  }, [id, token]);

  const communicationCards = useMemo(() => {
    if (!state) return [];

    return Object.values(state.preview.currentlyRelevant).filter(
      (payload): payload is NonNullable<typeof payload> => Boolean(payload)
    );
  }, [state]);

  if (!token || !id) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!state) return <LoadingBlock label="Carregando consulta..." />;

  const consultationId = id;
  const detail = state;

  async function handleCopyPublicUrl() {
    const value = buildPublicConsultationUrl(consultationId);
    await copyToClipboard(value);
    setFeedback("Link público copiado.");
    window.setTimeout(() => setFeedback(null), 2000);
  }

  async function handleCopyWhatsApp() {
    const whatsappText =
      detail.preview.currentlyRelevant.payment_approved?.whatsapp.text ??
      detail.preview.currentlyRelevant.consultation_created_pending_payment?.whatsapp.text ??
      detail.preview.currentlyRelevant.consultation_reminder_online?.whatsapp.text ??
      detail.preview.currentlyRelevant.consultation_reminder_in_person?.whatsapp.text;

    if (!whatsappText) return;

    await copyToClipboard(whatsappText);
    setFeedback("Mensagem copiada.");
    window.setTimeout(() => setFeedback(null), 2000);
  }

  async function handleGoogleSync() {
    if (!token) return;

    try {
      await api.syncGoogle(token, consultationId);
      setFeedback("Sincronização solicitada.");
    } catch (requestError) {
      setFeedback(requestError instanceof Error ? requestError.message : "Falha ao sincronizar.");
    }
  }

  async function handleCancel() {
    if (!token) return;

    if (!window.confirm("Deseja cancelar esta consulta?")) {
      return;
    }

    try {
      await api.cancelAppointment(token, consultationId, "Cancelado pelo profissional");
      setFeedback("Consulta cancelada.");
    } catch (requestError) {
      setFeedback(requestError instanceof Error ? requestError.message : "Falha ao cancelar.");
    }
  }

  return (
    <div className="stack-xl">
      <section className="page-hero">
        <div className="stack-sm">
          <div className="eyebrow">Detalhe operacional</div>
          <h1>Detalhe da consulta</h1>
          <p>
            Acompanhamento completo de pagamento, comunicação, modalidade e ações críticas do
            atendimento.
          </p>
        </div>
        <Link className="button button--secondary" to="/consultations">
          Voltar para consultas
        </Link>
      </section>

      {feedback ? <div className="alert">{feedback}</div> : null}

      <div className="detail-grid">
        <div className="stack-md">
          <section className="card card--highlight stack-md">
            <div className="section-heading">
              <div>
                <h2>Resumo da consulta</h2>
                <p>
                  {state.publicStatus.serviceName ?? "Consulta"} com{" "}
                  {state.publicStatus.providerName ?? "profissional"}
                </p>
              </div>
              <div className="badge-row">
                <StatusBadge
                  label={state.publicStatus.appointmentStatus}
                  tone={appointmentStatusTone(state.publicStatus.appointmentStatus)}
                  variant="appointment-status"
                />
                <StatusBadge
                  label={state.publicStatus.paymentStatus ?? "pending"}
                  tone={paymentStatusTone(state.publicStatus.paymentStatus)}
                  variant="payment-status"
                />
                <StatusBadge
                  label={state.publicStatus.deliveryMode ?? "nao informado"}
                  tone={deliveryModeTone(state.publicStatus.deliveryMode)}
                  variant="delivery-mode"
                />
              </div>
            </div>

            <div className="summary-grid">
              <div>
                <span className="summary-label">Início</span>
                <strong>{formatDateTime(state.publicStatus.startTime)}</strong>
              </div>
              <div>
                <span className="summary-label">Fim</span>
                <strong>{formatDateTime(state.publicStatus.endTime)}</strong>
              </div>
              <div>
                <span className="summary-label">Modalidade</span>
                <strong>{getLabelForValue(state.appointment.delivery_mode, "delivery-mode")}</strong>
              </div>
              <div>
                <span className="summary-label">Modelo do serviço</span>
                <strong>
                  {getLabelForValue(state.appointment.service_attendance_mode, "attendance-mode")}
                </strong>
              </div>
            </div>

            {state.appointment.notes ? (
              <div className="note-box">
                <span className="summary-label">Observações</span>
                <p>{state.appointment.notes}</p>
              </div>
            ) : null}
          </section>

          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Pagamento</h2>
                <p>Estado financeiro e dados refletidos no acompanhamento público da consulta.</p>
              </div>
            </div>

            <div className="summary-grid">
              <div>
                <span className="summary-label">Valor</span>
                <strong>{formatCurrency(state.publicStatus.payment?.amount)}</strong>
              </div>
              <div>
                <span className="summary-label">Método</span>
                <strong>
                  {getLabelForValue(state.publicStatus.payment?.method, "payment-method")}
                </strong>
              </div>
              <div>
                <span className="summary-label">Gateway</span>
                <strong>
                  {getLabelForValue(state.publicStatus.payment?.gateway, "payment-gateway")}
                </strong>
              </div>
              <div>
                <span className="summary-label">Situação</span>
                <StatusBadge
                  label={state.publicStatus.paymentStatus ?? "pending"}
                  tone={paymentStatusTone(state.publicStatus.paymentStatus)}
                  variant="payment-status"
                />
              </div>
            </div>

            {state.publicStatus.payment?.paymentLink ? (
              <a
                className="text-link"
                href={state.publicStatus.payment.paymentLink}
                rel="noreferrer"
                target="_blank"
              >
                Abrir link de pagamento
              </a>
            ) : null}
          </section>

          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>
                  {state.publicStatus.deliveryMode === "online"
                    ? "Atendimento online"
                    : "Atendimento presencial"}
                </h2>
                <p>
                  Contexto da execução da consulta com foco em reunião, check-in e visibilidade do
                  fluxo real.
                </p>
              </div>
            </div>

            {state.publicStatus.deliveryMode === "online" ? (
              <>
                <div className="summary-grid">
                  <div>
                    <span className="summary-label">Integração com Google</span>
                    <StatusBadge
                      label={state.googleStatus.connected ? "conectado" : "desconectado"}
                      tone={state.googleStatus.connected ? "success" : "warning"}
                    />
                  </div>
                  <div>
                    <span className="summary-label">Reunião disponível</span>
                    <StatusBadge
                      label={getBooleanLabel(Boolean(state.publicStatus.meeting))}
                      tone={state.publicStatus.meeting ? "success" : "neutral"}
                    />
                  </div>
                </div>

                {state.publicStatus.meeting ? (
                  <div className="meeting-box">
                    <span className="summary-label">Link da reunião</span>
                    <a
                      href={
                        state.publicStatus.meeting.meetLink ??
                        state.publicStatus.meeting.htmlLink ??
                        "#"
                      }
                      rel="noreferrer"
                      target="_blank"
                    >
                      {state.publicStatus.meeting.meetLink ?? state.publicStatus.meeting.htmlLink}
                    </a>
                  </div>
                ) : (
                  <div className="empty-state">
                    A reunião ainda não foi liberada ou depende de pagamento e sincronização.
                  </div>
                )}
              </>
            ) : (
              <div className="summary-grid">
                <div>
                  <span className="summary-label">Check-in</span>
                  <strong>
                    {getLabelForValue(state.agendaItem?.attendance?.status, "attendance-status")}
                  </strong>
                </div>
                <div>
                  <span className="summary-label">Token</span>
                  <strong>
                    {getBooleanLabel(Boolean(state.agendaItem?.checkinToken?.used), {
                      trueLabel: "Utilizado",
                      falseLabel: "Disponível"
                    })}
                  </strong>
                </div>
                <div>
                  <span className="summary-label">Expira em</span>
                  <strong>
                    {state.agendaItem?.checkinToken?.expires_at
                      ? formatDateTime(state.agendaItem.checkinToken.expires_at)
                      : "Não disponível"}
                  </strong>
                </div>
                <div>
                  <span className="summary-label">Método</span>
                  <strong>
                    {getLabelForValue(state.agendaItem?.attendance?.checkin_method, "checkin-method")}
                  </strong>
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="stack-md">
          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Comunicações</h2>
                <p>Mensagens prontas para e-mail, WhatsApp e envio direto.</p>
              </div>
            </div>

            {communicationCards.length === 0 ? (
              <div className="empty-state">Nenhuma comunicação relevante encontrada.</div>
            ) : (
              communicationCards.map((payload) => (
                <article className="communication-card" key={payload.key}>
                  <div className="communication-card__header">
                    <strong>{getLabelForValue(payload.key, "communication")}</strong>
                    <StatusBadge
                      label={getBooleanLabel(payload.meetingIncluded, {
                        trueLabel: "Com acesso",
                        falseLabel: "Sem acesso"
                      })}
                      tone={payload.meetingIncluded ? "info" : "neutral"}
                    />
                  </div>
                  <div className="stack-sm">
                    <div>
                      <span className="summary-label">E-mail</span>
                      <p>{payload.email.subject}</p>
                    </div>
                    <div>
                      <span className="summary-label">WhatsApp</span>
                      <p>{payload.whatsapp.text}</p>
                    </div>
                    <div>
                      <span className="summary-label">Notificação</span>
                      <p>
                        {payload.push.title}: {payload.push.body}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Ações rápidas</h2>
                <p>Atalhos para compartilhar, sincronizar e ajustar o atendimento.</p>
              </div>
            </div>

            <div className="stack-sm">
              <button className="button button--block" onClick={handleCopyPublicUrl} type="button">
                Copiar link público
              </button>
              <button
                className="button button--secondary button--block"
                onClick={handleCopyWhatsApp}
                type="button"
              >
                Copiar mensagem
              </button>
              <button className="button button--ghost button--block" onClick={handleGoogleSync} type="button">
                Sincronizar agenda
              </button>
              <button
                className="button button--ghost button--danger button--block"
                onClick={handleCancel}
                type="button"
              >
                Cancelar consulta
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

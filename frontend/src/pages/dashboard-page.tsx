import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth";
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
  GoogleIntegrationStatus,
  PaymentRecord,
  RefundDecision
} from "../types/api";
import { formatCurrency, formatLongDate, formatTime, toLocalDateInput } from "../utils/format";

type DashboardState = {
  todayItems: AgendaItem[];
  upcomingItems: AgendaItem[];
  payments: PaymentRecord[];
  googleStatus: GoogleIntegrationStatus;
  refundDecisions: RefundDecision[];
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getFirstName(email: string | null | undefined) {
  if (!email) return "profissional";

  return email
    .split("@")[0]
    .split(/[._-]+/)[0]
    .replace(/^./, (value) => value.toUpperCase());
}

export function DashboardPage() {
  const { token, session } = useAuth();
  const [state, setState] = useState<DashboardState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const today = new Date();
    const future = new Date();
    future.setDate(future.getDate() + 21);

    Promise.all([
      api.getAgenda(token, { date: toLocalDateInput(today) }),
      api.getAgenda(token, {
        from: today.toISOString(),
        to: future.toISOString()
      }),
      api.getPayments(token),
      api.getGoogleStatus(token),
      api.getPendingRefundDecisions(token)
    ])
      .then(([todayItems, upcomingItems, payments, googleStatus, refundDecisions]) => {
        setState({ todayItems, upcomingItems, payments, googleStatus, refundDecisions });
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar a visao geral."
        );
      });
  }, [token]);

  const nextAppointments = useMemo(() => {
    if (!state) return [];

    const now = Date.now();

    return state.upcomingItems
      .filter(
        (item) =>
          Date.parse(item.appointment.start_time) >= now && item.appointment.status !== "cancelled"
      )
      .slice(0, 6);
  }, [state]);

  if (!token) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!state) return <LoadingBlock label="Carregando visao da operacao..." />;

  const pendingPayments = state.payments.filter((payment) => payment.status === "pending");
  const onlineToday = state.todayItems.filter(
    (item) => item.appointment.delivery_mode === "online"
  ).length;
  const confirmedRevenueToday = state.todayItems.reduce((total, item) => {
    if (item.payment?.status !== "approved") return total;
    return total + (item.payment.amount ?? 0);
  }, 0);
  const cancelledOrNoShow = state.todayItems.filter((item) =>
    ["cancelled", "no_show"].includes(item.appointment.status)
  ).length;
  const onlineWithoutGoogle =
    !state.googleStatus.connected
      ? state.upcomingItems.filter((item) => item.appointment.delivery_mode === "online").length
      : 0;
  const firstName = getFirstName(session?.user.email);
  const nextPriority = nextAppointments[0] ?? null;

  return (
    <div className="stack-xl">
      <section className="executive-grid">
        <article className="hero-panel hero-panel--main">
          <div className="eyebrow">{formatLongDate(new Date().toISOString())}</div>
          <div className="stack-sm">
            <h1>
              {getGreeting()}, {firstName}
            </h1>
            <p>
              O dia está organizado em uma visão mais estratégica, com foco em agenda, cobrança e
              execução clínica sem aparência de painel genérico.
            </p>
          </div>

          <div className="hero-panel__actions">
            <Link className="button" to="/consultations/new">
              Nova consulta
            </Link>
            <Link className="button button--secondary" to="/consultations">
              Abrir agenda
            </Link>
          </div>
        </article>

        <article className="hero-panel hero-panel--spotlight">
          <span className="summary-label">Próximo foco</span>
          <strong>
            {nextPriority
              ? `${nextPriority.client?.name ?? "Cliente"} às ${formatTime(
                  nextPriority.appointment.start_time
                )}`
              : "Agenda sem urgências"}
          </strong>
          <p>
            {nextPriority
              ? `${nextPriority.service?.name ?? "Consulta"} · ${formatLongDate(
                  nextPriority.appointment.start_time
                )}`
              : "Nenhum atendimento futuro exige atenção imediata."}
          </p>

          {nextPriority ? (
            <div className="hero-panel__badges">
              <StatusBadge
                label={nextPriority.payment?.status ?? "pending"}
                tone={paymentStatusTone(nextPriority.payment?.status)}
                variant="payment-status"
              />
              <StatusBadge
                label={nextPriority.appointment.delivery_mode ?? "nao informado"}
                tone={deliveryModeTone(nextPriority.appointment.delivery_mode)}
                variant="delivery-mode"
              />
            </div>
          ) : null}
        </article>

        <article className="hero-panel hero-panel--metric">
          <span className="summary-label">Receita aprovada hoje</span>
          <strong>{formatCurrency(confirmedRevenueToday)}</strong>
          <p>Valor já confirmado para os atendimentos do dia.</p>
        </article>
      </section>

      <section className="metric-ribbon">
        <article className="metric-ribbon__card">
          <span>Consultas hoje</span>
          <strong>{state.todayItems.length}</strong>
        </article>
        <article className="metric-ribbon__card">
          <span>Pagamentos pendentes</span>
          <strong>{pendingPayments.length}</strong>
        </article>
        <article className="metric-ribbon__card">
          <span>Online hoje</span>
          <strong>{onlineToday}</strong>
        </article>
        <article className="metric-ribbon__card">
          <span>Ocorrências do dia</span>
          <strong>{cancelledOrNoShow}</strong>
        </article>
      </section>

      <div className="editorial-grid">
        <section className="ledger-shell">
          <div className="section-heading">
            <div>
              <h2>Agenda prioritária</h2>
              <p>Uma leitura mais sofisticada dos próximos atendimentos, sem cara de tabela datada.</p>
            </div>
            <Link className="text-link" to="/consultations">
              Ver todas
            </Link>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="empty-state">Nenhuma consulta futura encontrada.</div>
          ) : (
            <div className="ledger-list">
              {nextAppointments.map((item) => (
                <Link className="ledger-row" key={item.appointment.id} to={`/consultations/${item.appointment.id}`}>
                  <div className="ledger-row__time">
                    <strong>{formatTime(item.appointment.start_time)}</strong>
                    <span>{formatLongDate(item.appointment.start_time)}</span>
                  </div>

                  <div className="ledger-row__main">
                    <div className="stack-xs">
                      <strong>{item.client?.name ?? "Cliente"}</strong>
                      <span className="ledger-row__service">{item.service?.name ?? "Serviço"}</span>
                    </div>
                    <div className="hero-panel__badges">
                      <StatusBadge
                        label={item.appointment.delivery_mode ?? "nao informado"}
                        tone={deliveryModeTone(item.appointment.delivery_mode)}
                        variant="delivery-mode"
                      />
                      <StatusBadge
                        label={item.appointment.status}
                        tone={appointmentStatusTone(item.appointment.status)}
                        variant="appointment-status"
                      />
                    </div>
                  </div>

                  <div className="ledger-row__aside">
                    <StatusBadge
                      label={item.payment?.status ?? "pending"}
                      tone={paymentStatusTone(item.payment?.status)}
                      variant="payment-status"
                    />
                    <strong>{formatCurrency(item.payment?.amount ?? item.appointment.final_price)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="insight-column">
          <section className="insight-card insight-card--dark">
            <span className="summary-label">Pontos de atenção</span>
            <div className="insight-list">
              <div className="insight-item">
                <strong>{pendingPayments.length}</strong>
                <span>pagamentos aguardando avanço</span>
              </div>
              <div className="insight-item">
                <strong>{onlineWithoutGoogle}</strong>
                <span>consultas online sem automação</span>
              </div>
              <div className="insight-item">
                <strong>{state.refundDecisions.length}</strong>
                <span>estornos em análise</span>
              </div>
            </div>
          </section>

          <section className="insight-card">
            <span className="summary-label">Acesso rápido</span>
            <div className="quick-stack">
              <Link className="quick-stack__item" to="/consultations/new">
                <strong>Registrar atendimento</strong>
                <span>Inicie um novo fluxo de agendamento e cobrança.</span>
              </Link>
              <Link className="quick-stack__item" to="/consultations">
                <strong>Revisar agenda</strong>
                <span>Abra a lista completa e trate pendências por consulta.</span>
              </Link>
              <Link className="quick-stack__item" to="/finance">
                <strong>Acompanhar financeiro</strong>
                <span>Consulte pagamentos, receita e repasses.</span>
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

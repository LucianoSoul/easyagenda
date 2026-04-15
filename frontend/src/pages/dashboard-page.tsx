import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth";
import { LoadingBlock } from "../components/loading-block";
import { StatCard } from "../components/stat-card";
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
import { formatCurrency, formatDateTime, formatLongDate, formatTime, toLocalDateInput } from "../utils/format";

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
      .slice(0, 4);
  }, [state]);

  if (!token) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!state) return <LoadingBlock label="Carregando visao da operacao..." />;

  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full"
  }).format(new Date());
  const pendingPayments = state.payments.filter((payment) => payment.status === "pending");
  const onlineToday = state.todayItems.filter(
    (item) => item.appointment.delivery_mode === "online"
  ).length;
  const inPersonToday = state.todayItems.filter(
    (item) => item.appointment.delivery_mode === "in_person"
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
  const nextPriority = nextAppointments[0];

  return (
    <div className="stack-xl">
      <section className="dashboard-hero">
        <div className="dashboard-hero__content stack-md">
          <div className="eyebrow">{todayLabel}</div>
          <div className="stack-sm">
            <h1>
              {getGreeting()}, {firstName}
            </h1>
            <p>
              A operação do dia está organizada em uma visão mais objetiva, com foco em agenda,
              pagamento e execução sem ruído visual.
            </p>
          </div>

          <div className="hero-tags">
            <span className="hero-tag">Agenda profissional</span>
            <span className="hero-tag">Financeiro visível</span>
            <span className="hero-tag">Fluxo clínico organizado</span>
          </div>
        </div>

        <div className="dashboard-hero__panel">
          <span className="summary-label">Foco imediato</span>
          <strong>
            {nextPriority
              ? `${nextPriority.client?.name ?? "Cliente"} às ${formatTime(
                  nextPriority.appointment.start_time
                )}`
              : "Agenda sem urgências"}
          </strong>
          <p>
            {nextPriority
              ? `${nextPriority.service?.name ?? "Consulta"} em ${formatLongDate(
                  nextPriority.appointment.start_time
                )}`
              : "Nenhum atendimento futuro exige atenção imediata."}
          </p>

          <div className="dashboard-hero__panel-actions">
            <Link className="button" to="/consultations/new">
              Nova consulta
            </Link>
            <Link className="button button--secondary" to="/consultations">
              Abrir agenda completa
            </Link>
          </div>
        </div>
      </section>

      <div className="stats-grid stats-grid--five">
        <StatCard
          helper="compromissos ativos na agenda"
          label="Consultas hoje"
          tone="info"
          value={state.todayItems.length}
        />
        <StatCard
          helper="precisam de confirmação financeira"
          label="Pagamentos pendentes"
          tone="warning"
          value={pendingPayments.length}
        />
        <StatCard helper="atendimentos virtuais do dia" label="Online hoje" value={onlineToday} />
        <StatCard
          helper="atendimentos em consultório"
          label="Presenciais hoje"
          value={inPersonToday}
        />
        <StatCard
          helper="valor confirmado para hoje"
          label="Receita aprovada"
          tone="success"
          value={formatCurrency(confirmedRevenueToday)}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card card--highlight stack-md">
          <div className="section-heading">
            <div>
              <h2>Próximos atendimentos</h2>
              <p>Os compromissos mais próximos, com leitura rápida e prioridade visual correta.</p>
            </div>
            <Link className="text-link" to="/consultations">
              Ver agenda completa
            </Link>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="empty-state">Nenhuma consulta futura encontrada.</div>
          ) : (
            <div className="list-grid">
              {nextAppointments.map((item) => (
                <Link
                  className="list-card list-card--premium"
                  key={item.appointment.id}
                  to={`/consultations/${item.appointment.id}`}
                >
                  <div className="list-card__top">
                    <div className="stack-xs">
                      <strong>{item.client?.name ?? "Cliente"}</strong>
                      <span className="list-card__meta">
                        {item.service?.name ?? "Serviço"} · {formatDateTime(item.appointment.start_time)}
                      </span>
                    </div>
                    <StatusBadge
                      label={item.appointment.delivery_mode ?? "nao informado"}
                      tone={deliveryModeTone(item.appointment.delivery_mode)}
                      variant="delivery-mode"
                    />
                  </div>

                  <div className="list-card__footer">
                    <div className="badge-row">
                      <StatusBadge
                        label={item.payment?.status ?? "pending"}
                        tone={paymentStatusTone(item.payment?.status)}
                        variant="payment-status"
                      />
                      <StatusBadge
                        label={item.appointment.status}
                        tone={appointmentStatusTone(item.appointment.status)}
                        variant="appointment-status"
                      />
                    </div>
                    <span>{formatCurrency(item.payment?.amount ?? item.appointment.final_price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="stack-md">
          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Pontos de atenção</h2>
                <p>Indicadores operacionais que merecem acompanhamento ao longo do dia.</p>
              </div>
            </div>

            <div className="ops-list">
              <div className="ops-item">
                <div>
                  <strong>Confirmações financeiras</strong>
                  <p>{pendingPayments.length} consulta(s) aguardando avanço no pagamento.</p>
                </div>
                <StatusBadge
                  label={String(pendingPayments.length)}
                  tone={pendingPayments.length > 0 ? "warning" : "neutral"}
                />
              </div>

              <div className="ops-item">
                <div>
                  <strong>Integração com Google</strong>
                  <p>
                    {state.googleStatus.connected
                      ? "Integração conectada e pronta para liberar reuniões online."
                      : `${onlineWithoutGoogle} consulta(s) online sem automatização de reunião.`}
                  </p>
                </div>
                <StatusBadge
                  label={state.googleStatus.connected ? "ok" : String(onlineWithoutGoogle)}
                  tone={state.googleStatus.connected ? "success" : "warning"}
                />
              </div>

              <div className="ops-item">
                <div>
                  <strong>Estornos em análise</strong>
                  <p>{state.refundDecisions.length} decisão(ões) aguardando tratamento.</p>
                </div>
                <StatusBadge
                  label={String(state.refundDecisions.length)}
                  tone={state.refundDecisions.length > 0 ? "warning" : "neutral"}
                />
              </div>
            </div>
          </section>

          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Atalhos essenciais</h2>
                <p>Ações frequentes com acabamento mais limpo e direto.</p>
              </div>
            </div>

            <div className="quick-actions">
              <Link className="quick-action" to="/consultations/new">
                <strong>Registrar nova consulta</strong>
                <span>Inicie o fluxo de agendamento, cobrança e compartilhamento.</span>
              </Link>
              <Link className="quick-action" to="/consultations">
                <strong>Revisar agenda</strong>
                <span>Filtre clientes, acompanhe status e concentre as ações por consulta.</span>
              </Link>
              <Link className="quick-action" to="/finance">
                <strong>Acompanhar financeiro</strong>
                <span>Abra a área de pagamentos, repasses e pendências financeiras.</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section className="card stack-md">
        <div className="section-heading">
          <div>
            <h2>Agenda do dia</h2>
            <p>Leitura rápida dos atendimentos de hoje, sem aparência de tabela antiga.</p>
          </div>
          <StatusBadge
            label={`${cancelledOrNoShow} ocorrencias`}
            tone={cancelledOrNoShow > 0 ? "danger" : "neutral"}
          />
        </div>

        {state.todayItems.length === 0 ? (
          <div className="empty-state">Nenhuma consulta programada para hoje.</div>
        ) : (
          <div className="agenda-grid">
            {state.todayItems.map((item) => (
              <Link
                className="agenda-card"
                key={item.appointment.id}
                to={`/consultations/${item.appointment.id}`}
              >
                <div className="agenda-card__time">
                  <span>{formatTime(item.appointment.start_time)}</span>
                  <small>{formatLongDate(item.appointment.start_time)}</small>
                </div>

                <div className="agenda-card__content">
                  <div className="stack-xs">
                    <strong>{item.client?.name ?? "Cliente"}</strong>
                    <span className="list-card__meta">{item.service?.name ?? "Serviço"}</span>
                  </div>

                  <div className="agenda-card__badges">
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
                    <StatusBadge
                      label={item.payment?.status ?? "pending"}
                      tone={paymentStatusTone(item.payment?.status)}
                      variant="payment-status"
                    />
                  </div>
                </div>

                <div className="agenda-card__value">
                  {formatCurrency(item.payment?.amount ?? item.appointment.final_price)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

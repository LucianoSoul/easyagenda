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
import { formatCurrency, formatDateTime, formatTime, toLocalDateInput } from "../utils/format";

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
            : "Nao foi possivel carregar o dashboard."
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
      .slice(0, 5);
  }, [state]);

  if (!token) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!state) return <LoadingBlock label="Carregando operação do dia..." />;

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
  const firstName = session?.user.email?.split("@")[0].split(".")[0] ?? "profissional";

  return (
    <div className="stack-lg">
      <div className="dashboard-hero">
        <div className="stack-sm">
          <div className="eyebrow">{todayLabel}</div>
          <h1>
            {getGreeting()}, {firstName}
          </h1>
          <p>Resumo diário da operação de consultas pagas, com foco no que precisa de ação agora.</p>
        </div>

        <div className="dashboard-hero__actions">
          <Link className="button" to="/consultations/new">
            Criar consulta
          </Link>
          <Link className="button button--secondary" to="/consultations">
            Ver consultas
          </Link>
        </div>
      </div>

      <div className="stats-grid stats-grid--five">
        <StatCard label="Consultas hoje" value={state.todayItems.length} />
        <StatCard label="Pagamentos pendentes" value={pendingPayments.length} />
        <StatCard label="Online hoje" value={onlineToday} />
        <StatCard label="Presenciais hoje" value={inPersonToday} />
        <StatCard
          helper="aprovada hoje"
          label="Receita confirmada"
          value={formatCurrency(confirmedRevenueToday)}
        />
      </div>

      <div className="dashboard-grid">
        <section className="card stack-md">
          <div className="section-heading">
            <div>
              <h2>Próximas consultas</h2>
              <p>Os próximos atendimentos que merecem atenção imediata.</p>
            </div>
            <Link className="text-link" to="/consultations">
              Abrir lista completa
            </Link>
          </div>

          {nextAppointments.length === 0 ? (
            <div className="empty-state">Nenhuma consulta futura encontrada.</div>
          ) : (
            <div className="list-grid">
              {nextAppointments.map((item) => (
                <Link
                  className="list-card"
                  key={item.appointment.id}
                  to={`/consultations/${item.appointment.id}`}
                >
                  <div className="list-card__top">
                    <strong>{item.client?.name ?? "Cliente"}</strong>
                    <div className="badge-row">
                      <StatusBadge
                        label={item.payment?.status ?? "sem pagamento"}
                        tone={paymentStatusTone(item.payment?.status)}
                      />
                      <StatusBadge
                        label={item.appointment.delivery_mode ?? "sem modo"}
                        tone={deliveryModeTone(item.appointment.delivery_mode)}
                      />
                    </div>
                  </div>
                  <div className="list-card__meta">
                    <span>{item.service?.name ?? "Serviço"}</span>
                    <span>{formatDateTime(item.appointment.start_time)}</span>
                  </div>
                  <div className="list-card__footer">
                    <StatusBadge
                      label={item.appointment.status}
                      tone={appointmentStatusTone(item.appointment.status)}
                    />
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
                <h2>Pendências operacionais</h2>
                <p>O que precisa de atenção para a operação fluir sem fricção.</p>
              </div>
            </div>

            <div className="ops-list">
              <div className="ops-item">
                <div>
                  <strong>Pagamentos pendentes</strong>
                  <p>{pendingPayments.length} consulta(s) aguardando confirmação.</p>
                </div>
                <StatusBadge
                  label={String(pendingPayments.length)}
                  tone={pendingPayments.length > 0 ? "warning" : "neutral"}
                />
              </div>

              <div className="ops-item">
                <div>
                  <strong>Online sem Google conectado</strong>
                  <p>
                    {state.googleStatus.connected
                      ? "Integração Google conectada."
                      : `${onlineWithoutGoogle} consulta(s) online sem liberação automática de Meet.`}
                  </p>
                </div>
                <StatusBadge
                  label={state.googleStatus.connected ? "ok" : String(onlineWithoutGoogle)}
                  tone={state.googleStatus.connected ? "success" : "warning"}
                />
              </div>

              <div className="ops-item">
                <div>
                  <strong>Refund decisions pendentes</strong>
                  <p>{state.refundDecisions.length} decisão(ões) aguardando processamento.</p>
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
                <h2>Quick actions</h2>
                <p>Atalhos para as tarefas mais recorrentes.</p>
              </div>
            </div>

            <div className="quick-actions">
              <Link className="quick-action" to="/consultations/new">
                <strong>Criar consulta</strong>
                <span>Iniciar o fluxo pago com compartilhamento.</span>
              </Link>
              <Link className="quick-action" to="/consultations">
                <strong>Consultar operação</strong>
                <span>Filtrar status, copiar link e sincronizar Google.</span>
              </Link>
              <Link className="quick-action" to="/finance">
                <strong>Ir para financeiro</strong>
                <span>Revisar pagamentos pendentes e receita.</span>
              </Link>
            </div>
          </section>
        </div>
      </div>

      <section className="card stack-md">
        <div className="section-heading">
          <div>
            <h2>Consultas hoje</h2>
            <p>Painel compacto do dia com pagamento, status e modo de atendimento.</p>
          </div>
          <StatusBadge
            label={`${cancelledOrNoShow} canceladas / no-show`}
            tone={cancelledOrNoShow > 0 ? "danger" : "neutral"}
          />
        </div>

        {state.todayItems.length === 0 ? (
          <div className="empty-state">Nenhuma consulta programada para hoje.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Modo</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {state.todayItems.map((item) => (
                  <tr key={item.appointment.id}>
                    <td>{formatTime(item.appointment.start_time)}</td>
                    <td>{item.client?.name ?? "Cliente"}</td>
                    <td>{item.service?.name ?? "Serviço"}</td>
                    <td>
                      <StatusBadge
                        label={item.appointment.delivery_mode ?? "sem modo"}
                        tone={deliveryModeTone(item.appointment.delivery_mode)}
                      />
                    </td>
                    <td>
                      <StatusBadge
                        label={item.appointment.status}
                        tone={appointmentStatusTone(item.appointment.status)}
                      />
                    </td>
                    <td>
                      <div className="stack-xs">
                        <StatusBadge
                          label={item.payment?.status ?? "sem pagamento"}
                          tone={paymentStatusTone(item.payment?.status)}
                        />
                        <span>{formatCurrency(item.payment?.amount ?? item.appointment.final_price)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

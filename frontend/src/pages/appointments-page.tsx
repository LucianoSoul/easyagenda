import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import type { AgendaItem } from "../types/api";
import { copyToClipboard, formatCurrency, formatDate, formatDateTime, formatTime, toLocalDateInput } from "../utils/format";
import { getLabelForValue, getSearchableText } from "../utils/ui-labels";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

const statusOptions = ["all", "pending_payment", "confirmed", "cancelled", "no_show"];
const deliveryOptions = ["all", "online", "in_person"];

function AppointmentActionMenu({
  item,
  onCancel,
  onCopyLink,
  onCopyWhatsApp,
  onGoogleSync
}: {
  item: AgendaItem;
  onCancel: (appointmentId: string) => void;
  onCopyLink: (appointmentId: string) => void;
  onCopyWhatsApp: (appointmentId: string) => void;
  onGoogleSync: (appointmentId: string) => void;
}) {
  return (
    <details className="action-menu">
      <summary className="action-menu__trigger">Ações</summary>
      <div className="action-menu__panel">
        <Link className="action-menu__item" to={`/consultations/${item.appointment.id}`}>
          Abrir detalhes
        </Link>
        <button
          className="action-menu__item"
          onClick={() => onCopyLink(item.appointment.id)}
          type="button"
        >
          Copiar link público
        </button>
        <button
          className="action-menu__item"
          onClick={() => onCopyWhatsApp(item.appointment.id)}
          type="button"
        >
          Copiar mensagem
        </button>
        <button
          className="action-menu__item"
          onClick={() => onGoogleSync(item.appointment.id)}
          type="button"
        >
          Sincronizar agenda
        </button>
        <button
          className="action-menu__item action-menu__item--danger"
          onClick={() => onCancel(item.appointment.id)}
          type="button"
        >
          Cancelar consulta
        </button>
      </div>
    </details>
  );
}

export function AppointmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AgendaItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!token) return;

    const from = new Date();
    from.setDate(from.getDate() - 30);

    const to = new Date();
    to.setDate(to.getDate() + 90);

    api
      .getAgenda(token, {
        from: from.toISOString(),
        to: to.toISOString()
      })
      .then((response) => {
        const ordered = [...response].sort(
          (left, right) =>
            Date.parse(left.appointment.start_time) - Date.parse(right.appointment.start_time)
        );
        setItems(ordered);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar as consultas."
        );
      });
  }, [token]);

  const serviceOptions = useMemo(() => {
    if (!items) return [];

    return Array.from(
      new Set(items.map((item) => item.service?.name).filter((value): value is string => Boolean(value)))
    ).sort((left, right) => left.localeCompare(right, "pt-BR"));
  }, [items]);

  const clientSuggestions = useMemo(() => {
    if (!items || deferredSearch.trim().length < 1) return [];

    const term = getSearchableText(deferredSearch);

    return Array.from(
      new Set(items.map((item) => item.client?.name).filter((value): value is string => Boolean(value)))
    )
      .filter((name) => getSearchableText(name).includes(term))
      .sort((left, right) => left.localeCompare(right, "pt-BR"))
      .slice(0, 6);
  }, [deferredSearch, items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    const normalizedSearch = getSearchableText(deferredSearch);

    return items.filter((item) => {
      const clientName = getSearchableText(item.client?.name);
      const serviceName = item.service?.name ?? "";
      const appointmentDate = toLocalDateInput(new Date(item.appointment.start_time));

      if (normalizedSearch && !clientName.includes(normalizedSearch)) return false;
      if (statusFilter !== "all" && item.appointment.status !== statusFilter) return false;
      if (deliveryFilter !== "all" && item.appointment.delivery_mode !== deliveryFilter) return false;
      if (serviceFilter !== "all" && serviceName !== serviceFilter) return false;
      if (dateFilter && appointmentDate !== dateFilter) return false;

      return true;
    });
  }, [dateFilter, deferredSearch, deliveryFilter, items, serviceFilter, statusFilter]);

  const metrics = useMemo(() => {
    const total = filteredItems.length;
    const pending = filteredItems.filter((item) => item.payment?.status === "pending").length;
    const online = filteredItems.filter((item) => item.appointment.delivery_mode === "online").length;
    const approved = filteredItems.reduce((totalValue, item) => {
      if (item.payment?.status !== "approved") return totalValue;
      return totalValue + (item.payment.amount ?? 0);
    }, 0);

    return { total, pending, online, approved };
  }, [filteredItems]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setDeliveryFilter("all");
    setServiceFilter("all");
    setDateFilter("");
  }

  async function handleCopyLink(appointmentId: string) {
    const value = buildPublicConsultationUrl(appointmentId);
    await copyToClipboard(value);
    setFeedback({ type: "success", message: "Link público copiado." });
  }

  async function handleCopyWhatsApp(appointmentId: string) {
    if (!token) return;

    try {
      const preview = await api.getCommunicationsPreview(token, appointmentId);
      const whatsappText =
        preview.currentlyRelevant.payment_approved?.whatsapp.text ??
        preview.currentlyRelevant.consultation_created_pending_payment?.whatsapp.text ??
        preview.currentlyRelevant.consultation_reminder_online?.whatsapp.text ??
        preview.currentlyRelevant.consultation_reminder_in_person?.whatsapp.text;

      if (!whatsappText) {
        throw new Error("Nenhuma mensagem disponível para copiar.");
      }

      await copyToClipboard(whatsappText);
      setFeedback({ type: "success", message: "Mensagem copiada." });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message:
          requestError instanceof Error ? requestError.message : "Nao foi possivel copiar a mensagem."
      });
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!token) return;

    if (!window.confirm("Deseja cancelar esta consulta?")) {
      return;
    }

    try {
      await api.cancelAppointment(token, appointmentId, "Cancelado pelo profissional");
      setItems((current) =>
        current?.map((item) =>
          item.appointment.id === appointmentId
            ? {
                ...item,
                appointment: {
                  ...item.appointment,
                  status: "cancelled"
                }
              }
            : item
        ) ?? null
      );
      setFeedback({ type: "success", message: "Consulta cancelada." });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message: requestError instanceof Error ? requestError.message : "Nao foi possivel cancelar."
      });
    }
  }

  async function handleGoogleSync(appointmentId: string) {
    if (!token) return;

    try {
      await api.syncGoogle(token, appointmentId);
      setFeedback({ type: "success", message: "Sincronização solicitada." });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel sincronizar com o Google."
      });
    }
  }

  if (!token) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!items) return <LoadingBlock label="Carregando consultas..." />;

  return (
    <div className="stack-xl">
      <section className="page-hero page-hero--consultations">
        <div className="stack-sm">
          <div className="eyebrow">Agenda operacional</div>
          <h1>Consultas</h1>
          <p>
            Uma visão mais sofisticada para buscar clientes, filtrar agenda e executar ações sem
            bagunça visual.
          </p>
        </div>

        <div className="page-hero__actions">
          <Link className="button" to="/consultations/new">
            Nova consulta
          </Link>
        </div>
      </section>

      <div className="stats-grid stats-grid--four">
        <section className="card metric-card">
          <span className="summary-label">Consultas filtradas</span>
          <strong>{metrics.total}</strong>
        </section>
        <section className="card metric-card">
          <span className="summary-label">Pendências financeiras</span>
          <strong>{metrics.pending}</strong>
        </section>
        <section className="card metric-card">
          <span className="summary-label">Atendimentos online</span>
          <strong>{metrics.online}</strong>
        </section>
        <section className="card metric-card">
          <span className="summary-label">Valor aprovado</span>
          <strong>{formatCurrency(metrics.approved)}</strong>
        </section>
      </div>

      <section className="card card--highlight stack-md">
        <div className="section-heading">
          <div>
            <h2>Busca e filtros</h2>
            <p>Pesquisa rápida por cliente com apoio visual mais refinado e sugestões ao digitar.</p>
          </div>
          <button className="button button--ghost" onClick={clearFilters} type="button">
            Limpar filtros
          </button>
        </div>

        <div className="filters-grid filters-grid--consultations">
          <label className="field search-field">
            <span>Buscar cliente</span>
            <div className="search-field__control">
              <input
                placeholder="Digite o nome do cliente"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {clientSuggestions.length > 0 ? (
                <div className="suggestions-panel">
                  {clientSuggestions.map((suggestion) => (
                    <button
                      className="suggestions-panel__item"
                      key={suggestion}
                      onClick={() => setSearch(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todos" : getLabelForValue(option, "appointment-status")}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Modalidade</span>
            <select value={deliveryFilter} onChange={(event) => setDeliveryFilter(event.target.value)}>
              {deliveryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todas" : getLabelForValue(option, "delivery-mode")}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Serviço</span>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
              <option value="all">Todos</option>
              {serviceOptions.map((serviceName) => (
                <option key={serviceName} value={serviceName}>
                  {serviceName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Data</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>
        </div>

        {feedback ? (
          <div className={`alert ${feedback.type === "error" ? "alert--error" : ""}`}>
            {feedback.message}
          </div>
        ) : null}
      </section>

      {filteredItems.length === 0 ? (
        <section className="card empty-state">
          Nenhuma consulta encontrada para os filtros aplicados.
        </section>
      ) : (
        <div className="consultation-list">
          {filteredItems.map((item) => (
            <article className="consultation-card" key={item.appointment.id}>
              <div className="consultation-card__main">
                <div className="consultation-card__headline">
                  <div className="stack-xs">
                    <strong>{item.client?.name ?? "Cliente"}</strong>
                    <span className="consultation-card__datetime">
                      {formatDate(item.appointment.start_time)} às {formatTime(item.appointment.start_time)}
                    </span>
                  </div>

                  <AppointmentActionMenu
                    item={item}
                    onCancel={handleCancel}
                    onCopyLink={handleCopyLink}
                    onCopyWhatsApp={handleCopyWhatsApp}
                    onGoogleSync={handleGoogleSync}
                  />
                </div>

                <div className="consultation-card__details">
                  <div className="consultation-card__detail">
                    <span className="summary-label">Serviço</span>
                    <strong>{item.service?.name ?? "Serviço não informado"}</strong>
                  </div>

                  <div className="consultation-card__detail">
                    <span className="summary-label">Modalidade</span>
                    <StatusBadge
                      label={item.appointment.delivery_mode ?? "nao informado"}
                      tone={deliveryModeTone(item.appointment.delivery_mode)}
                      variant="delivery-mode"
                    />
                  </div>

                  <div className="consultation-card__detail">
                    <span className="summary-label">Pagamento</span>
                    <div className="stack-xs">
                      <StatusBadge
                        label={item.payment?.status ?? "pending"}
                        tone={paymentStatusTone(item.payment?.status)}
                        variant="payment-status"
                      />
                      <strong>{formatCurrency(item.payment?.amount ?? item.appointment.final_price)}</strong>
                    </div>
                  </div>

                  <div className="consultation-card__detail">
                    <span className="summary-label">Situação</span>
                    <StatusBadge
                      label={item.appointment.status}
                      tone={appointmentStatusTone(item.appointment.status)}
                      variant="appointment-status"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth";
import { AppointmentCardMobile } from "../components/appointment-card-mobile";
import { AppointmentListDesktop } from "../components/appointment-list-desktop";
import { LoadingBlock } from "../components/loading-block";
import { buildPublicConsultationUrl } from "../config/runtime";
import { api } from "../services/api";
import type { AgendaItem } from "../types/api";
import { copyToClipboard, formatCurrency, formatDate, toLocalDateInput } from "../utils/format";
import { getLabelForValue, getSearchableText } from "../utils/ui-labels";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

const statusOptions = ["all", "pending_payment", "confirmed", "cancelled", "no_show"];
const deliveryOptions = ["all", "online", "in_person"];

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
    const approved = filteredItems.reduce((totalValue, item) => {
      if (item.payment?.status !== "approved") return totalValue;
      return totalValue + (item.payment.amount ?? 0);
    }, 0);

    return {
      total,
      pending,
      approved,
      nextDate: filteredItems[0]?.appointment.start_time ?? null
    };
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
    setFeedback({ type: "success", message: "Link publico copiado." });
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
        throw new Error("Nenhuma mensagem disponivel para copiar.");
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
      setFeedback({ type: "success", message: "Sincronizacao solicitada." });
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
      <section className="appointments-stage">
        <div className="appointments-stage__hero">
          <div className="eyebrow">Centro operacional</div>
          <h1>Consultas</h1>
          <p>
            A agenda diaria agora aparece como uma lista premium, com leitura rapida, contexto claro
            e acoes discretas por consulta.
          </p>
        </div>

        <div className="appointments-stage__stats">
          <div className="appointments-stage__stat">
            <span>Consultas filtradas</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="appointments-stage__stat">
            <span>Pagamentos pendentes</span>
            <strong>{metrics.pending}</strong>
          </div>
          <div className="appointments-stage__stat">
            <span>Valor aprovado</span>
            <strong>{formatCurrency(metrics.approved)}</strong>
          </div>
          <div className="appointments-stage__stat">
            <span>Proxima data</span>
            <strong>{metrics.nextDate ? formatDate(metrics.nextDate) : "Sem agenda"}</strong>
          </div>
        </div>
      </section>

      <section className="appointments-toolbar">
        <div className="appointments-toolbar__search">
          <label className="field appointments-search">
            <span>Buscar cliente</span>
            <div className="appointments-search__control">
              <input
                placeholder="Digite o nome do cliente"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {clientSuggestions.length > 0 ? (
                <div className="appointments-search__suggestions">
                  {clientSuggestions.map((suggestion) => (
                    <button
                      className="appointments-search__option"
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
        </div>

        <div className="appointments-toolbar__filters">
          <label className="field appointments-filter">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todos" : getLabelForValue(option, "appointment-status")}
                </option>
              ))}
            </select>
          </label>

          <label className="field appointments-filter">
            <span>Modalidade</span>
            <select value={deliveryFilter} onChange={(event) => setDeliveryFilter(event.target.value)}>
              {deliveryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "Todas" : getLabelForValue(option, "delivery-mode")}
                </option>
              ))}
            </select>
          </label>

          <label className="field appointments-filter">
            <span>Servico</span>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
              <option value="all">Todos</option>
              {serviceOptions.map((serviceName) => (
                <option key={serviceName} value={serviceName}>
                  {serviceName}
                </option>
              ))}
            </select>
          </label>

          <label className="field appointments-filter">
            <span>Data</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>

          <button className="button button--ghost appointments-toolbar__clear" onClick={clearFilters} type="button">
            Limpar filtros
          </button>
        </div>
      </section>

      {feedback ? (
        <div className={`alert ${feedback.type === "error" ? "alert--error" : ""}`}>
          {feedback.message}
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <section className="card empty-state">
          Nenhuma consulta encontrada para os filtros aplicados.
        </section>
      ) : (
        <>
          <AppointmentListDesktop
            items={filteredItems}
            onCancel={handleCancel}
            onCopyLink={handleCopyLink}
            onCopyWhatsApp={handleCopyWhatsApp}
            onGoogleSync={handleGoogleSync}
          />

          <section className="appointment-list-mobile">
            {filteredItems.map((item) => (
              <AppointmentCardMobile
                item={item}
                key={item.appointment.id}
                onCancel={handleCancel}
                onCopyLink={handleCopyLink}
                onCopyWhatsApp={handleCopyWhatsApp}
                onGoogleSync={handleGoogleSync}
              />
            ))}
          </section>
        </>
      )}

      <div className="appointments-toolbar__footer">
        <Link className="button" to="/consultations/new">
          Nova consulta
        </Link>
      </div>
    </div>
  );
}

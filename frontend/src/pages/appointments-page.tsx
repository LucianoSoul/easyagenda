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
import type { AgendaItem } from "../types/api";
import { copyToClipboard, formatCurrency, formatDateTime, toLocalDateInput } from "../utils/format";

type FeedbackState = {
  type: "success" | "error";
  message: string;
};

function buildPublicConsultationPath(appointmentId: string) {
  return `/public/consultations/${appointmentId}`;
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
      .then(setItems)
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
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item) => {
      const clientName = item.client?.name?.toLowerCase() ?? "";
      const serviceName = item.service?.name ?? "";
      const appointmentDate = toLocalDateInput(new Date(item.appointment.start_time));

      if (search && !clientName.includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && item.appointment.status !== statusFilter) return false;
      if (deliveryFilter !== "all" && item.appointment.delivery_mode !== deliveryFilter) return false;
      if (serviceFilter !== "all" && serviceName !== serviceFilter) return false;
      if (dateFilter && appointmentDate !== dateFilter) return false;

      return true;
    });
  }, [dateFilter, deliveryFilter, items, search, serviceFilter, statusFilter]);

  async function handleCopyLink(appointmentId: string) {
    const base = import.meta.env.VITE_PUBLIC_APP_BASE_URL;
    const relative = buildPublicConsultationPath(appointmentId);
    const value = base ? new URL(relative, base).toString() : relative;
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
      setFeedback({ type: "success", message: "Texto de WhatsApp copiado." });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message:
          requestError instanceof Error ? requestError.message : "Não foi possível copiar a mensagem."
      });
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!token) return;

    if (!window.confirm("Cancelar esta consulta?")) {
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
        message:
          requestError instanceof Error ? requestError.message : "Não foi possível cancelar."
      });
    }
  }

  async function handleGoogleSync(appointmentId: string) {
    if (!token) return;

    try {
      await api.syncGoogle(token, appointmentId);
      setFeedback({ type: "success", message: "Sincronização Google solicitada." });
    } catch (requestError) {
      setFeedback({
        type: "error",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível sincronizar com o Google."
      });
    }
  }

  if (!token) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!items) return <LoadingBlock label="Carregando consultas..." />;

  return (
    <div className="stack-lg">
      <div className="page-hero">
        <div>
          <h1>Consultas</h1>
          <p>Lista operacional com busca, filtros e ações rápidas para o fluxo pago da plataforma.</p>
        </div>
        <Link className="button" to="/consultations/new">
          Criar consulta
        </Link>
      </div>

      <section className="card stack-md">
        <div className="filters-grid">
          <label className="field">
            <span>Buscar cliente</span>
            <input
              placeholder="Nome do cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="pending_payment">pending_payment</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="field">
            <span>Modo</span>
            <select value={deliveryFilter} onChange={(event) => setDeliveryFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="online">online</option>
              <option value="in_person">in_person</option>
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

        {filteredItems.length === 0 ? (
          <div className="empty-state">Nenhuma consulta encontrada para esse filtro.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data / hora</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Modo</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.appointment.id}>
                    <td>{formatDateTime(item.appointment.start_time)}</td>
                    <td>{item.client?.name ?? "Cliente"}</td>
                    <td>{item.service?.name ?? "Serviço"}</td>
                    <td>
                      <StatusBadge
                        label={item.appointment.delivery_mode ?? "sem modo"}
                        tone={deliveryModeTone(item.appointment.delivery_mode)}
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
                    <td>
                      <StatusBadge
                        label={item.appointment.status}
                        tone={appointmentStatusTone(item.appointment.status)}
                      />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="text-link" to={`/consultations/${item.appointment.id}`}>
                          Ver detalhes
                        </Link>
                        <button
                          className="text-button"
                          onClick={() => handleCopyLink(item.appointment.id)}
                          type="button"
                        >
                          Copiar link
                        </button>
                        <button
                          className="text-button"
                          onClick={() => handleCopyWhatsApp(item.appointment.id)}
                          type="button"
                        >
                          Copiar WhatsApp
                        </button>
                        <button
                          className="text-button"
                          onClick={() => handleCancel(item.appointment.id)}
                          type="button"
                        >
                          Cancelar
                        </button>
                        <button
                          className="text-button"
                          onClick={() => handleGoogleSync(item.appointment.id)}
                          type="button"
                        >
                          Sincronizar Google
                        </button>
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

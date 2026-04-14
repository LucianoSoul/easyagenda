import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/auth";
import { LoadingBlock } from "../components/loading-block";
import { SharePanel } from "../components/share-panel";
import {
  StatusBadge,
  appointmentStatusTone,
  deliveryModeTone,
  paymentStatusTone
} from "../components/status-badge";
import { api } from "../services/api";
import type {
  ConsultationCreateResult,
  LookupClient,
  LookupService
} from "../types/api";
import {
  formatCurrency,
  formatDateTime,
  fromIsoToLocalDateTime,
  toIsoFromLocalDateTime
} from "../utils/format";

export function CreateConsultationPage() {
  const { token } = useAuth();
  const [clients, setClients] = useState<LookupClient[] | null>(null);
  const [services, setServices] = useState<LookupService[] | null>(null);
  const [result, setResult] = useState<ConsultationCreateResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<"in_person" | "online">("in_person");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!token) return;

    Promise.all([api.listClients(token), api.listServices(token)])
      .then(([nextClients, nextServices]) => {
        setClients(nextClients);
        setServices(nextServices);
        if (nextClients[0]) {
          setClientId((current) => current || nextClients[0].id);
        }
        if (nextServices[0]) {
          setServiceId((current) => current || nextServices[0].id);
        }
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar os dados da consulta."
        );
      });
  }, [token]);

  const selectedClient = useMemo(
    () => clients?.find((client) => client.id === clientId) ?? null,
    [clientId, clients]
  );
  const selectedService = useMemo(
    () => services?.find((service) => service.id === serviceId) ?? null,
    [serviceId, services]
  );

  useEffect(() => {
    if (!selectedService) return;

    if (selectedService.attendance_mode === "online_only") {
      setDeliveryMode("online");
    } else if (selectedService.attendance_mode === "in_person_only") {
      setDeliveryMode("in_person");
    }
  }, [selectedService]);

  useEffect(() => {
    if (!selectedService || !startTime) return;
    if (endTime) return;

    const nextEnd = new Date(startTime);
    nextEnd.setMinutes(nextEnd.getMinutes() + selectedService.duration_minutes);
    setEndTime(fromIsoToLocalDateTime(nextEnd.toISOString()));
  }, [endTime, selectedService, startTime]);

  function resetForm() {
    setResult(null);
    setStartTime("");
    setEndTime("");
    setNotes("");
    if (selectedService?.attendance_mode === "online_only") {
      setDeliveryMode("online");
    } else {
      setDeliveryMode("in_person");
    }
  }

  if (!token) return null;
  if (!clients || !services) {
    return error ? (
      <div className="alert alert--error">{error}</div>
    ) : (
      <LoadingBlock label="Preparando formulário..." />
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createConsultation(token, {
        clientId,
        serviceId,
        startTime: toIsoFromLocalDateTime(startTime),
        endTime: toIsoFromLocalDateTime(endTime),
        deliveryMode,
        notes: notes || undefined
      });

      setResult(created);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel criar a consulta."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const deliveryModeLocked =
    selectedService?.attendance_mode === "online_only" ||
    selectedService?.attendance_mode === "in_person_only";

  const ruleText =
    deliveryMode === "online"
      ? "O link da reunião será liberado automaticamente após a aprovação do pagamento."
      : "O comparecimento presencial será confirmado após a aprovação do pagamento.";

  return (
    <div className="stack-lg">
      <div className="page-hero">
        <div>
          <h1>Criar consulta</h1>
          <p>O fluxo mais valioso do produto: criar, cobrar e compartilhar uma consulta paga.</p>
        </div>
      </div>

      <div className="content-grid">
        <form className="card stack-md" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <h2>Dados da consulta</h2>
              <p>Preencha o mínimo necessário e deixe o backend cuidar do fluxo pago.</p>
            </div>
          </div>

          <label className="field">
            <span>Cliente</span>
            <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Serviço</span>
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)}
                </option>
              ))}
            </select>
          </label>

          {selectedService ? (
            <div className="info-strip">
              <span>{selectedService.duration_minutes} min</span>
              <span>{selectedService.attendance_mode}</span>
              <span>{formatCurrency(selectedService.price)}</span>
            </div>
          ) : null}

          <div className="form-row">
            <label className="field">
              <span>Início</span>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Fim</span>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Modo de atendimento</span>
            <select
              disabled={deliveryModeLocked}
              value={deliveryMode}
              onChange={(event) => setDeliveryMode(event.target.value as "in_person" | "online")}
            >
              <option value="in_person">Presencial</option>
              <option value="online">Online</option>
            </select>
          </label>

          <label className="field">
            <span>Notas</span>
            <textarea
              rows={5}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observações relevantes para a consulta"
            />
          </label>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <button className="button button--block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Criando..." : "Criar consulta"}
          </button>
        </form>

        <div className="stack-md">
          <section className="card stack-md">
            <div className="section-heading">
              <div>
                <h2>Prévia</h2>
                <p>O que o profissional vê antes de criar e o que será compartilhado depois.</p>
              </div>
            </div>

            <div className="summary-grid">
              <div>
                <span className="summary-label">Cliente</span>
                <strong>{selectedClient?.name ?? "Selecione um cliente"}</strong>
              </div>
              <div>
                <span className="summary-label">Serviço</span>
                <strong>{selectedService?.name ?? "Selecione um serviço"}</strong>
              </div>
              <div>
                <span className="summary-label">Início</span>
                <strong>{startTime ? formatDateTime(new Date(startTime).toISOString()) : "--"}</strong>
              </div>
              <div>
                <span className="summary-label">Fim</span>
                <strong>{endTime ? formatDateTime(new Date(endTime).toISOString()) : "--"}</strong>
              </div>
              <div>
                <span className="summary-label">Modo</span>
                <StatusBadge label={deliveryMode} tone={deliveryModeTone(deliveryMode)} />
              </div>
              <div>
                <span className="summary-label">Pagamento estimado</span>
                <strong>{formatCurrency(selectedService?.price)}</strong>
              </div>
            </div>

            <div className="note-box">
              <span className="summary-label">Regra de liberação</span>
              <p>{ruleText}</p>
            </div>
          </section>

          {result ? (
            <>
              <section className="card stack-md">
                <div className="section-heading">
                  <div>
                    <h2>Consulta criada com sucesso</h2>
                    <p>Resumo final do agendamento e do pagamento gerado.</p>
                  </div>
                  <Link className="text-link" to={`/consultations/${result.appointment.id}`}>
                    Ver detalhe
                  </Link>
                </div>

                <div className="summary-grid">
                  <div>
                    <span className="summary-label">Consulta</span>
                    <strong>{result.appointment.id}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Horário</span>
                    <strong>{formatDateTime(result.appointment.start_time)}</strong>
                  </div>
                  <div>
                    <span className="summary-label">Agendamento</span>
                    <StatusBadge
                      label={result.appointment.status}
                      tone={appointmentStatusTone(result.appointment.status)}
                    />
                  </div>
                  <div>
                    <span className="summary-label">Pagamento</span>
                    <StatusBadge
                      label={result.payment.status}
                      tone={paymentStatusTone(result.payment.status)}
                    />
                  </div>
                  <div>
                    <span className="summary-label">Modo</span>
                    <StatusBadge
                      label={result.appointment.delivery_mode ?? "sem modo"}
                      tone={deliveryModeTone(result.appointment.delivery_mode)}
                    />
                  </div>
                  <div>
                    <span className="summary-label">Valor</span>
                    <strong>{formatCurrency(result.payment.amount)}</strong>
                  </div>
                </div>

                <button className="button button--ghost" onClick={resetForm} type="button">
                  Criar outra consulta
                </button>
              </section>

              <SharePanel result={result} />
            </>
          ) : (
            <section className="card empty-state">
              Após criar a consulta, o resumo final e o payload de compartilhamento aparecem aqui.
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

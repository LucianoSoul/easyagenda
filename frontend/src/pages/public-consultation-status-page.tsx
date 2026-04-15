import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingBlock } from "../components/loading-block";
import {
  StatusBadge,
  appointmentStatusTone,
  deliveryModeTone,
  paymentStatusTone
} from "../components/status-badge";
import { api } from "../services/api";
import type { ConsultationPublicStatus } from "../types/api";
import { formatCurrency, formatDateTime } from "../utils/format";
import { getLabelForValue } from "../utils/ui-labels";

export function PublicConsultationStatusPage() {
  const { id } = useParams();
  const [data, setData] = useState<ConsultationPublicStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    api
      .getConsultationPublicStatus(id)
      .then(setData)
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar o status da consulta."
        );
      });
  }, [id]);

  if (!id) return null;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!data) return <LoadingBlock label="Carregando status da consulta..." />;

  const primaryAction = (() => {
    if (data.paymentStatus === "pending" && data.payment?.paymentLink) {
      return {
        label: "Pagar agora",
        href: data.payment.paymentLink
      };
    }

    if (
      data.paymentStatus === "approved" &&
      data.deliveryMode === "online" &&
      data.meeting?.meetLink
    ) {
      return {
        label: "Entrar na consulta",
        href: data.meeting.meetLink
      };
    }

    if (data.paymentStatus === "approved" && data.deliveryMode === "in_person") {
      return {
        label: "Ver orientações de comparecimento",
        href: "#attendance"
      };
    }

    return null;
  })();

  return (
    <div className="public-page">
      <section className="public-card stack-lg">
        <div className="brand brand--large">
          <div className="brand__mark">EA</div>
          <div>
            <div className="brand__title">Easy Agenda</div>
            <div className="brand__subtitle public-subtitle">Acompanhamento da consulta</div>
          </div>
        </div>

        <div className="stack-sm">
          <h1>{data.serviceName ?? "Consulta"}</h1>
          <p>
            com {data.providerName ?? "profissional"} em {formatDateTime(data.startTime)}
          </p>
        </div>

        <div className="badge-row">
          <StatusBadge
            label={data.appointmentStatus}
            tone={appointmentStatusTone(data.appointmentStatus)}
            variant="appointment-status"
          />
          <StatusBadge
            label={data.paymentStatus ?? "pending"}
            tone={paymentStatusTone(data.paymentStatus)}
            variant="payment-status"
          />
          <StatusBadge
            label={data.deliveryMode ?? "nao informado"}
            tone={deliveryModeTone(data.deliveryMode)}
            variant="delivery-mode"
          />
        </div>

        <div className="summary-grid">
          <div>
            <span className="summary-label">Início</span>
            <strong>{formatDateTime(data.startTime)}</strong>
          </div>
          <div>
            <span className="summary-label">Fim</span>
            <strong>{formatDateTime(data.endTime)}</strong>
          </div>
          <div>
            <span className="summary-label">Valor</span>
            <strong>{formatCurrency(data.payment?.amount)}</strong>
          </div>
          <div>
            <span className="summary-label">Forma de pagamento</span>
            <strong>{getLabelForValue(data.payment?.method, "payment-method")}</strong>
          </div>
        </div>

        {primaryAction ? (
          <a
            className="button button--block"
            href={primaryAction.href}
            rel="noreferrer"
            target={primaryAction.href.startsWith("http") ? "_blank" : undefined}
          >
            {primaryAction.label}
          </a>
        ) : null}

        {data.paymentStatus !== "approved" ? (
          <div className="note-box">
            O acesso à reunião online é liberado somente após a confirmação do pagamento.
          </div>
        ) : null}

        {data.payment?.qrCode ? (
          <div className="note-box">
            <span className="summary-label">Código para pagamento</span>
            <p>{data.payment.qrCode}</p>
          </div>
        ) : null}

        <section className="public-section" id="attendance">
          <h2>Orientações do atendimento</h2>
          {data.deliveryMode === "online" ? (
            data.meeting ? (
              <div className="meeting-box">
                <span className="summary-label">Link da reunião</span>
                <a
                  href={data.meeting.meetLink ?? data.meeting.htmlLink ?? "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  {data.meeting.meetLink ?? data.meeting.htmlLink}
                </a>
              </div>
            ) : (
              <div className="empty-state">
                O link ainda não está disponível. Ele será liberado automaticamente assim que o
                fluxo estiver pronto.
              </div>
            )
          ) : (
            <div className="empty-state">
              Seu atendimento será presencial. Compareça no horário marcado com alguns minutos de
              antecedência.
            </div>
          )}
        </section>

        <Link className="text-link" to="/login">
          Acessar área profissional
        </Link>
      </section>
    </div>
  );
}

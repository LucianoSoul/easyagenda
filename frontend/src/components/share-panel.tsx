import { useMemo, useState } from "react";
import {
  buildPublicConsultationPath,
  buildPublicConsultationUrl
} from "../config/runtime";
import type { ConsultationCreateResult } from "../types/api";
import { copyToClipboard } from "../utils/format";
import { getLabelForValue } from "../utils/ui-labels";

export function SharePanel({
  result
}: {
  result: ConsultationCreateResult;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const hasConfiguredPublicBaseUrl = Boolean(import.meta.env.VITE_PUBLIC_APP_BASE_URL?.trim());

  const publicUrl = useMemo(() => {
    return buildPublicConsultationUrl(result.sharePayload.consultationId);
  }, [result.sharePayload.consultationId]);

  const publicPath = useMemo(() => {
    return buildPublicConsultationPath(result.sharePayload.consultationId);
  }, [result.sharePayload.consultationId]);

  async function handleCopy(label: string, value: string) {
    await copyToClipboard(value);
    setFeedback(`${label} copiado.`);
    window.setTimeout(() => setFeedback(null), 2400);
  }

  return (
    <section className="card stack-md">
      <div className="section-heading">
        <div>
          <h2>Compartilhamento</h2>
          <p>Use os conteúdos prontos para enviar a confirmação da consulta por WhatsApp ou e-mail.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <span className="summary-label">Endereço público</span>
          <strong>{publicUrl}</strong>
        </div>
        <div>
          <span className="summary-label">Caminho interno</span>
          <strong>{publicPath}</strong>
        </div>
        <div>
          <span className="summary-label">Situação do pagamento</span>
          <strong>{getLabelForValue(result.sharePayload.paymentStatus, "payment-status")}</strong>
        </div>
      </div>

      <div className="share-actions">
        <button
          className="button"
          type="button"
          onClick={() => handleCopy("Texto do WhatsApp", result.sharePayload.whatsappText)}
        >
          Copiar texto do WhatsApp
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => handleCopy("Corpo do e-mail", result.sharePayload.emailBody)}
        >
          Copiar corpo do e-mail
        </button>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
        >
          Abrir página pública
        </button>
      </div>

      <label className="field">
        <span>Mensagem para WhatsApp</span>
        <textarea readOnly rows={6} value={result.sharePayload.whatsappText} />
      </label>

      <label className="field">
        <span>Mensagem para e-mail</span>
        <textarea readOnly rows={8} value={result.sharePayload.emailBody} />
      </label>

      {feedback ? <div className="helper-text">{feedback}</div> : null}
      {!hasConfiguredPublicBaseUrl ? (
        <div className="helper-text">
          Em desenvolvimento, o link usa a origem atual. Em produção, configure{" "}
          <code>VITE_PUBLIC_APP_BASE_URL</code> com o domínio oficial da aplicação.
        </div>
      ) : null}
    </section>
  );
}

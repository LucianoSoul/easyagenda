import { useMemo, useState } from "react";
import type { ConsultationCreateResult } from "../types/api";
import { copyToClipboard } from "../utils/format";

export function SharePanel({
  result
}: {
  result: ConsultationCreateResult;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const publicBaseUrl = import.meta.env.VITE_PUBLIC_APP_BASE_URL;

  const publicUrl = useMemo(() => {
    if (!publicBaseUrl) return null;
    return new URL(`/public/consultations/${result.sharePayload.consultationId}`, publicBaseUrl).toString();
  }, [publicBaseUrl, result.sharePayload.consultationId]);
  const publicPath = `/public/consultations/${result.sharePayload.consultationId}`;

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
          <p>Use o texto pronto para WhatsApp ou e-mail logo após criar a consulta.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div>
          <span className="summary-label">URL pública</span>
          <strong>{publicPath}</strong>
        </div>
        <div>
          <span className="summary-label">Pagamento</span>
          <strong>{result.sharePayload.paymentStatus}</strong>
        </div>
      </div>

      <div className="share-actions">
        <button
          className="button"
          type="button"
          onClick={() => handleCopy("Texto do WhatsApp", result.sharePayload.whatsappText)}
        >
          Copiar WhatsApp
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => handleCopy("Corpo do e-mail", result.sharePayload.emailBody)}
        >
          Copiar e-mail
        </button>
        <button
          className="button button--ghost"
          type="button"
          disabled={!publicUrl}
          onClick={() => publicUrl && window.open(publicUrl, "_blank", "noopener,noreferrer")}
        >
          Abrir status público
        </button>
      </div>

      <label className="field">
        <span>WhatsApp</span>
        <textarea readOnly rows={6} value={result.sharePayload.whatsappText} />
      </label>

      <label className="field">
        <span>E-mail</span>
        <textarea readOnly rows={8} value={result.sharePayload.emailBody} />
      </label>

      {feedback ? <div className="helper-text">{feedback}</div> : null}
      {!publicUrl ? (
        <div className="helper-text">
          Configure <code>VITE_PUBLIC_APP_BASE_URL</code> para abrir o link completo.
        </div>
      ) : null}
    </section>
  );
}

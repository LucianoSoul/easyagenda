import type { AgendaItem } from "../types/api";
import { formatCurrency, formatDate, formatTime } from "../utils/format";
import {
  StatusBadge,
  appointmentStatusTone,
  paymentStatusTone
} from "./status-badge";
import { AppointmentActionsMenu } from "./appointment-actions-menu";
import { ServiceSummary } from "./service-summary";

type AppointmentCardMobileProps = {
  item: AgendaItem;
  onCopyLink: (appointmentId: string) => Promise<void>;
  onCopyWhatsApp: (appointmentId: string) => Promise<void>;
  onGoogleSync: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
};

export function AppointmentCardMobile({
  item,
  onCopyLink,
  onCopyWhatsApp,
  onGoogleSync,
  onCancel
}: AppointmentCardMobileProps) {
  return (
    <article className="appointment-card-mobile">
      <div className="appointment-card-mobile__top">
        <div className="stack-xs">
          <strong>{item.client?.name ?? "Cliente"}</strong>
          <ServiceSummary
            attendanceMode={item.appointment.delivery_mode}
            className="appointment-card-mobile__summary"
            serviceName={item.service?.name}
            variant="compact"
          />
        </div>

        <AppointmentActionsMenu
          item={item}
          onCancel={onCancel}
          onCopyLink={onCopyLink}
          onCopyWhatsApp={onCopyWhatsApp}
          onGoogleSync={onGoogleSync}
        />
      </div>

      <div className="appointment-card-mobile__meta">
        <div>
          <span className="summary-label">Horario</span>
          <strong>
            {formatDate(item.appointment.start_time)} as {formatTime(item.appointment.start_time)}
          </strong>
        </div>

        <div>
          <span className="summary-label">Valor</span>
          <strong>{formatCurrency(item.payment?.amount ?? item.appointment.final_price)}</strong>
        </div>
      </div>

      <div className="appointment-card-mobile__badges">
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
    </article>
  );
}

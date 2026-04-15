import type { AgendaItem } from "../types/api";
import { formatCurrency, formatDate, formatTime } from "../utils/format";
import {
  StatusBadge,
  appointmentStatusTone,
  paymentStatusTone
} from "./status-badge";
import { AppointmentActionsMenu } from "./appointment-actions-menu";
import { ServiceSummary } from "./service-summary";

type AppointmentListItemProps = {
  item: AgendaItem;
  onCopyLink: (appointmentId: string) => Promise<void>;
  onCopyWhatsApp: (appointmentId: string) => Promise<void>;
  onGoogleSync: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
};

export function AppointmentListItem({
  item,
  onCopyLink,
  onCopyWhatsApp,
  onGoogleSync,
  onCancel
}: AppointmentListItemProps) {
  return (
    <article className="ea-card-appointment">
      <div className="ea-card-appointment__body">
        <strong className="ea-card-appointment__client">{item.client?.name ?? "Cliente"}</strong>

        <ServiceSummary
          attendanceMode={item.appointment.delivery_mode}
          className="ea-card-appointment__summary"
          serviceName={item.service?.name}
          variant="compact"
        />

        <div className="ea-card-appointment__schedule">
          <span className="ea-card-appointment__schedule-icon">📅</span>
          <span className="ea-card-appointment__schedule-text">
            {formatDate(item.appointment.start_time)} as {formatTime(item.appointment.start_time)}
          </span>
        </div>

        <div className="ea-card-appointment__badges">
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

        <div className="ea-card-appointment__footer">
          <strong className="ea-card-appointment__value">
            {formatCurrency(item.payment?.amount ?? item.appointment.final_price)}
          </strong>
          <AppointmentActionsMenu
            item={item}
            onCancel={onCancel}
            onCopyLink={onCopyLink}
            onCopyWhatsApp={onCopyWhatsApp}
            onGoogleSync={onGoogleSync}
          />
        </div>
      </div>
    </article>
  );
}

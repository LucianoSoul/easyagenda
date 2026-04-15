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
    <article className="appointment-list-item">
      <div className="appointment-list-item__identity">
        <strong>{item.client?.name ?? "Cliente"}</strong>
        <ServiceSummary
          attendanceMode={item.appointment.delivery_mode}
          className="appointment-list-item__summary"
          serviceName={item.service?.name}
          variant="compact"
        />
      </div>

      <div className="appointment-list-item__schedule">
        <strong>{formatDate(item.appointment.start_time)}</strong>
        <span>as {formatTime(item.appointment.start_time)}</span>
      </div>

      <div className="appointment-list-item__status">
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

      <div className="appointment-list-item__aside">
        <strong className="appointment-list-item__amount">
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
    </article>
  );
}

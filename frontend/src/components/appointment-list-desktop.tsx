import type { AgendaItem } from "../types/api";
import { AppointmentListItem } from "./appointment-list-item";

type AppointmentListDesktopProps = {
  items: AgendaItem[];
  onCopyLink: (appointmentId: string) => Promise<void>;
  onCopyWhatsApp: (appointmentId: string) => Promise<void>;
  onGoogleSync: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
};

export function AppointmentListDesktop({
  items,
  onCopyLink,
  onCopyWhatsApp,
  onGoogleSync,
  onCancel
}: AppointmentListDesktopProps) {
  return (
    <section className="appointment-list-desktop">
      <div className="appointment-list-desktop__head">
        <span>Cliente e contexto</span>
        <span>Data e horario</span>
        <span>Status</span>
        <span>Valor e acoes</span>
      </div>

      <div className="appointment-list-desktop__body">
        {items.map((item) => (
          <AppointmentListItem
            item={item}
            key={item.appointment.id}
            onCancel={onCancel}
            onCopyLink={onCopyLink}
            onCopyWhatsApp={onCopyWhatsApp}
            onGoogleSync={onGoogleSync}
          />
        ))}
      </div>
    </section>
  );
}

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
    <section className="ea-appointments-desktop-list">
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
    </section>
  );
}

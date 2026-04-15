import { useNavigate } from "react-router-dom";
import type { AgendaItem } from "../types/api";
import { OverflowMenu } from "./overflow-menu";

type AppointmentActionsMenuProps = {
  item: AgendaItem;
  onCopyLink: (appointmentId: string) => Promise<void>;
  onCopyWhatsApp: (appointmentId: string) => Promise<void>;
  onGoogleSync: (appointmentId: string) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
};

export function AppointmentActionsMenu({
  item,
  onCopyLink,
  onCopyWhatsApp,
  onGoogleSync,
  onCancel
}: AppointmentActionsMenuProps) {
  const navigate = useNavigate();

  return (
    <OverflowMenu
      actions={[
        {
          label: "Ver detalhes",
          onSelect: () => navigate(`/consultations/${item.appointment.id}`)
        },
        {
          label: "Copiar link",
          onSelect: () => {
            void onCopyLink(item.appointment.id);
          }
        },
        {
          label: "Copiar WhatsApp",
          onSelect: () => {
            void onCopyWhatsApp(item.appointment.id);
          }
        },
        {
          label: "Sincronizar Google",
          onSelect: () => {
            void onGoogleSync(item.appointment.id);
          }
        },
        {
          label: "Cancelar consulta",
          onSelect: () => {
            void onCancel(item.appointment.id);
          },
          tone: "danger"
        }
      ]}
      label="Acoes da consulta"
    />
  );
}

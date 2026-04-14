export const serviceAttendanceModes = ["in_person_only", "online_only", "hybrid"] as const;

export type ServiceAttendanceMode = (typeof serviceAttendanceModes)[number];

export const appointmentDeliveryModes = ["in_person", "online"] as const;

export type AppointmentDeliveryMode = (typeof appointmentDeliveryModes)[number];

export type SchedulingAppointmentDelivery = {
  delivery_mode: AppointmentDeliveryMode;
  attendance_mode: ServiceAttendanceMode;
  synced_at?: string | null;
  notified_at?: string | null;
  notification_channel?: "google_calendar_invite" | null;
  google_event_id?: string | null;
  html_link?: string | null;
  meet_link?: string | null;
};

export type SchedulingGatewaySettings = {
  service_delivery_modes?: Record<string, ServiceAttendanceMode>;
  appointment_delivery_modes?: Record<string, SchedulingAppointmentDelivery>;
};

export function isServiceAttendanceMode(value: unknown): value is ServiceAttendanceMode {
  return typeof value === "string" && serviceAttendanceModes.includes(value as ServiceAttendanceMode);
}

export function isAppointmentDeliveryMode(value: unknown): value is AppointmentDeliveryMode {
  return (
    typeof value === "string" &&
    appointmentDeliveryModes.includes(value as AppointmentDeliveryMode)
  );
}

export function getSchedulingGatewaySettings(
  gatewaySettings: Record<string, unknown> | null | undefined
): SchedulingGatewaySettings {
  if (!gatewaySettings || typeof gatewaySettings !== "object") {
    return {};
  }

  const scheduling = gatewaySettings.scheduling;

  if (!scheduling || typeof scheduling !== "object") {
    return {};
  }

  return scheduling as SchedulingGatewaySettings;
}

export function mergeSchedulingGatewaySettings(input: {
  currentGatewaySettings: Record<string, unknown> | null | undefined;
  schedulingSettings: SchedulingGatewaySettings;
}) {
  return {
    ...(input.currentGatewaySettings ?? {}),
    scheduling: input.schedulingSettings
  };
}

export function getServiceAttendanceMode(
  schedulingSettings: SchedulingGatewaySettings,
  serviceId: string
): ServiceAttendanceMode {
  const configuredValue = schedulingSettings.service_delivery_modes?.[serviceId];
  return isServiceAttendanceMode(configuredValue) ? configuredValue : "in_person_only";
}

export function getAppointmentDeliverySettings(
  schedulingSettings: SchedulingGatewaySettings,
  appointmentId: string
): SchedulingAppointmentDelivery | null {
  const value = schedulingSettings.appointment_delivery_modes?.[appointmentId];

  if (!value || typeof value !== "object") {
    return null;
  }

  if (!isAppointmentDeliveryMode(value.delivery_mode) || !isServiceAttendanceMode(value.attendance_mode)) {
    return null;
  }

  return {
    delivery_mode: value.delivery_mode,
    attendance_mode: value.attendance_mode,
    synced_at: typeof value.synced_at === "string" ? value.synced_at : null,
    notified_at: typeof value.notified_at === "string" ? value.notified_at : null,
    notification_channel:
      value.notification_channel === "google_calendar_invite"
        ? value.notification_channel
        : null,
    google_event_id: typeof value.google_event_id === "string" ? value.google_event_id : null,
    html_link: typeof value.html_link === "string" ? value.html_link : null,
    meet_link: typeof value.meet_link === "string" ? value.meet_link : null
  };
}

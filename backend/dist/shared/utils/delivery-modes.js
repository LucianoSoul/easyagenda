export const serviceAttendanceModes = ["in_person_only", "online_only", "hybrid"];
export const appointmentDeliveryModes = ["in_person", "online"];
export function isServiceAttendanceMode(value) {
    return typeof value === "string" && serviceAttendanceModes.includes(value);
}
export function isAppointmentDeliveryMode(value) {
    return (typeof value === "string" &&
        appointmentDeliveryModes.includes(value));
}
export function getSchedulingGatewaySettings(gatewaySettings) {
    if (!gatewaySettings || typeof gatewaySettings !== "object") {
        return {};
    }
    const scheduling = gatewaySettings.scheduling;
    if (!scheduling || typeof scheduling !== "object") {
        return {};
    }
    return scheduling;
}
export function mergeSchedulingGatewaySettings(input) {
    return {
        ...(input.currentGatewaySettings ?? {}),
        scheduling: input.schedulingSettings
    };
}
export function getServiceAttendanceMode(schedulingSettings, serviceId) {
    const configuredValue = schedulingSettings.service_delivery_modes?.[serviceId];
    return isServiceAttendanceMode(configuredValue) ? configuredValue : "in_person_only";
}
export function getAppointmentDeliverySettings(schedulingSettings, appointmentId) {
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
        notification_channel: value.notification_channel === "google_calendar_invite"
            ? value.notification_channel
            : null,
        google_event_id: typeof value.google_event_id === "string" ? value.google_event_id : null,
        html_link: typeof value.html_link === "string" ? value.html_link : null,
        meet_link: typeof value.meet_link === "string" ? value.meet_link : null
    };
}

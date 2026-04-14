function formatAmount(amount) {
    if (amount === null) {
        return "A confirmar";
    }
    return `R$ ${amount.toFixed(2)}`;
}
function buildEmail(to, subject, bodyLines) {
    return {
        to,
        subject,
        body: bodyLines.join("\n")
    };
}
function buildWhatsApp(to, textLines) {
    return {
        to,
        text: textLines.join(" ")
    };
}
function buildPush(title, body, deepLink) {
    return {
        title,
        body,
        deepLink
    };
}
export function buildConsultationCreatedPendingPayment(context) {
    const message = context.deliveryMode === "online"
        ? "Apos a confirmacao do pagamento, o link da consulta online sera liberado automaticamente."
        : "A consulta presencial sera confirmada apos a aprovacao do pagamento.";
    return {
        key: "consultation_created_pending_payment",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: false,
        email: buildEmail(context.clientEmail, "Consulta agendada - pagamento pendente", [
            `Sua consulta foi reservada com ${context.providerName ?? "o profissional"}.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            `Valor: ${formatAmount(context.amount)}`,
            `Status do pagamento: ${context.paymentStatus ?? "pendente"}`,
            message,
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Sua consulta foi criada no Easy Agenda.`,
            `Servico: ${context.serviceName ?? "Consulta"}.`,
            `Horario: ${context.startTime} ate ${context.endTime}.`,
            `Valor: ${formatAmount(context.amount)}.`,
            message,
            `Acesse para acompanhar e concluir o pagamento: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Consulta criada", "Sua consulta foi criada e aguarda confirmacao do pagamento.", context.publicStatusUrl)
    };
}
export function buildPaymentApprovedInPerson(context) {
    return {
        key: "payment_approved_in_person",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: false,
        email: buildEmail(context.clientEmail, "Pagamento confirmado - consulta presencial", [
            `Recebemos o pagamento da sua consulta.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            `Sua consulta presencial esta confirmada.`,
            `Acompanhe os detalhes em: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Pagamento confirmado.`,
            `Sua consulta presencial esta confirmada para ${context.startTime}.`,
            `Detalhes: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Pagamento confirmado", "Sua consulta presencial foi confirmada.", context.publicStatusUrl)
    };
}
export function buildPaymentApprovedOnlineWithoutMeeting(context) {
    return {
        key: "payment_approved_online_without_meeting",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: false,
        email: buildEmail(context.clientEmail, "Pagamento confirmado - consulta online", [
            `Recebemos o pagamento da sua consulta online.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            `O link de acesso sera liberado automaticamente assim que estiver disponivel.`,
            `Acompanhe a pagina da consulta: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Pagamento confirmado para sua consulta online.`,
            `O link de acesso sera liberado automaticamente assim que estiver disponivel.`,
            `Acompanhe em: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Pagamento confirmado", "Sua consulta online foi confirmada. O link sera liberado assim que estiver disponivel.", context.publicStatusUrl)
    };
}
export function buildPaymentApprovedOnlineWithMeeting(context) {
    const meetingLink = context.meeting?.meetLink ?? context.meeting?.htmlLink ?? context.publicStatusUrl;
    return {
        key: "payment_approved_online_with_meeting",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: true,
        email: buildEmail(context.clientEmail, "Pagamento confirmado - link da consulta online", [
            `Recebemos o pagamento da sua consulta online.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            `Link da consulta: ${meetingLink}`,
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Pagamento confirmado para sua consulta online.`,
            `Link de acesso: ${meetingLink}`,
            `Detalhes da consulta: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Link da consulta liberado", "Sua consulta online esta confirmada e o link ja esta disponivel.", meetingLink)
    };
}
export function buildConsultationReminderInPerson(context) {
    return {
        key: "consultation_reminder_in_person",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: false,
        email: buildEmail(context.clientEmail, "Lembrete da consulta", [
            `Lembrete da sua consulta com ${context.providerName ?? "o profissional"}.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            "Sua consulta sera presencial.",
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Lembrete da sua consulta.`,
            `Horario: ${context.startTime}.`,
            "Sua consulta sera presencial.",
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Lembrete da consulta", "Sua consulta presencial esta se aproximando.", context.publicStatusUrl)
    };
}
export function buildConsultationReminderOnline(context) {
    const deliveryLine = context.meeting?.meetLink || context.meeting?.htmlLink
        ? `Seu link de acesso: ${context.meeting.meetLink ?? context.meeting.htmlLink}`
        : "Se o link ainda nao estiver disponivel, ele sera liberado automaticamente na pagina da consulta.";
    return {
        key: "consultation_reminder_online",
        deliveryMode: context.deliveryMode,
        paymentStatus: context.paymentStatus,
        meetingIncluded: !!(context.meeting?.meetLink || context.meeting?.htmlLink),
        email: buildEmail(context.clientEmail, "Lembrete da consulta online", [
            `Lembrete da sua consulta com ${context.providerName ?? "o profissional"}.`,
            "",
            `Servico: ${context.serviceName ?? "Consulta"}`,
            `Horario: ${context.startTime} ate ${context.endTime}`,
            deliveryLine,
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        whatsapp: buildWhatsApp(context.clientPhone, [
            `Lembrete da sua consulta online.`,
            `Horario: ${context.startTime}.`,
            deliveryLine,
            `Pagina da consulta: ${context.publicStatusUrl}`
        ]),
        push: buildPush("Lembrete da consulta", "Sua consulta online esta se aproximando.", context.publicStatusUrl)
    };
}

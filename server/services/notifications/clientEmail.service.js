import { sendSystemEmail } from '../../lib/mailer.js'
import { safeCreateAuditLog } from '../../utils/createAuditLog.js'
import { getClientIp } from '../../utils/getClientIp.js'
import { createEmailLog } from './emailLog.service.js'

export const sendTrackedClientEmail = async ({ req, context, messageType, subject, text, html }) => {
  if (!context?.client_email) {
    return {
      ok: false,
      status: 400,
      message: 'Client email is missing.',
    }
  }

  try {
    await sendSystemEmail({
      to: context.client_email,
      subject,
      text,
      html,
    })

    await createEmailLog({
      clientId: context.client_id,
      clientUnitId: context.client_unit_id,
      sentTo: context.client_email,
      subject,
      messageType,
      messageBody: text,
      status: 'sent',
      sentBy: req.user?.id || null,
    })

    await safeCreateAuditLog({
      userId: req.user?.id || null,
      action: 'send_email',
      module: 'Client Notifications',
      description: `Sent ${messageType} email to ${context.client_name} (${context.client_email})`,
      ipAddress: getClientIp(req),
    })

    return {
      ok: true,
      status: 200,
      message: 'Email sent successfully.',
    }
  } catch (error) {
    await createEmailLog({
      clientId: context.client_id,
      clientUnitId: context.client_unit_id,
      sentTo: context.client_email,
      subject,
      messageType,
      messageBody: text,
      status: 'failed',
      errorMessage: error.message,
      sentBy: req.user?.id || null,
    })

    return {
      ok: false,
      status: 500,
      message: error.message || 'Email failed to send.',
    }
  }
}

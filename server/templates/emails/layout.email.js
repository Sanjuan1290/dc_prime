const AUTO_GENERATED_FOOTER = '**** This is an auto-generated email. DO NOT REPLY TO THIS MESSAGE ****'

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const getCompanyLogoUrl = () => {
  if (process.env.EMAIL_LOGO_URL) return process.env.EMAIL_LOGO_URL
  if (process.env.CLIENT_URL) return `${process.env.CLIENT_URL.replace(/\/$/, '')}/logo2.png`
  return ''
}

export const buildPlainEmail = ({ greeting, lines = [], details = [] }) => {
  const detailLines = details
    .filter((item) => item && item.label && item.value !== undefined && item.value !== null && item.value !== '')
    .map((item) => `${item.label}: ${item.value}`)

  return [
    greeting,
    '',
    ...lines,
    ...(detailLines.length ? ['', ...detailLines] : []),
    '',
    AUTO_GENERATED_FOOTER,
  ].join('\n')
}

export const buildHtmlEmail = ({ title, greeting, paragraphs = [], details = [], listTitle, listItems = [] }) => {
  const logoUrl = getCompanyLogoUrl()
  const safeDetails = details.filter((item) => item && item.label && item.value !== undefined && item.value !== null && item.value !== '')

  return `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:#ffffff;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="D&C Prime Realty" style="height:46px;display:block;" />` : '<strong style="font-size:18px;">D&C Prime Realty</strong>'}
                      </td>
                      <td align="right" style="font-size:12px;color:#64748b;vertical-align:middle;">D&C Prime Realty</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px;">
                  <h1 style="margin:0 0 18px;font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(title)}</h1>
                  <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${escapeHtml(greeting)}</p>
                  ${paragraphs.map((paragraph) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;">${escapeHtml(paragraph)}</p>`).join('')}

                  ${listItems.length ? `
                    <div style="margin:18px 0;padding:16px;border:1px solid #dbeafe;border-radius:12px;background:#eff6ff;">
                      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#1e3a8a;">${escapeHtml(listTitle || 'Details')}</p>
                      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;">
                        ${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}

                  ${safeDetails.length ? `
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                      ${safeDetails.map((item, index) => `
                        <tr style="background:${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                          <td style="width:180px;padding:10px 12px;font-size:12px;font-weight:700;color:#475569;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.label)}</td>
                          <td style="padding:10px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.value)}</td>
                        </tr>
                      `).join('')}
                    </table>
                  ` : ''}

                  <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;font-weight:700;color:#64748b;">${AUTO_GENERATED_FOOTER}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

export { AUTO_GENERATED_FOOTER, escapeHtml }

import { useMemo, useState, type ReactElement, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiBell, FiFileText, FiMail, FiMessageSquare, FiRefreshCw } from "react-icons/fi"
import Alert from "../components/ui/Alert"
import Button from "../components/ui/Button"
import EmptyState from "../components/ui/EmptyState"
import Input from "../components/ui/Input"
import LoadingState from "../components/ui/LoadingState"
import Modal from "../components/ui/Modal"
import PageHeader from "../components/ui/PageHeader"
import TableContainer from "../components/ui/TableContainer"
import { API_URL, getErrorMessage } from "../utils/api"
import { formatDateOnly, formatMoney } from "../utils/formatters"

type NotificationType = "payment_due" | "missing_documents" | "past_due" | "custom"
type TabKey = "due" | "documents" | "pastDue"

type PaymentNotification = {
  client_id: number
  client_unit_id: number
  client_name: string
  client_email: string | null
  unit_id: string
  project_name: string
  schedule_id: number
  description: string
  due_date: string
  amount_due: number | string
  amount_due_display?: string
  days_until_due: number
  last_email_sent_at?: string | null
}

type PastDueNotification = PaymentNotification & {
  days_late: number
  penalty?: number | string
  penalty_display?: string
}

type MissingDocumentNotification = {
  client_id: number
  client_unit_id: number
  client_name: string
  client_email: string | null
  unit_id: string
  project_name: string
  reserved_date: string
  days_since_reserved: number
  missing_count: number
  missing_documents: string[]
  last_email_sent_at?: string | null
}

type EmailLog = {
  id: number
  sent_to: string
  subject: string
  message_type: string
  status: string
  error_message?: string | null
  sent_at: string
  sent_by_name?: string | null
}

type ConfirmEmailState = {
  clientUnitId: number
  scheduleId?: number
  clientName: string
  clientEmail: string | null
  title: string
  message: string
  endpoint: string
}

type CustomEmailState = {
  clientUnitId: number
  clientName: string
  clientEmail: string | null
  unitId: string
  subject: string
  message: string
  messageType: NotificationType
}

const getJson = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, { credentials: "include" })
  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const postJson = async (path: string, body: Record<string, unknown>) => {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(await getErrorMessage(response))
  return response.json()
}

const getLastEmailText = (value?: string | null) => {
  return value ? formatDateOnly(value) : "Not yet sent"
}

const Notifications = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>("due")
  const [successMessage, setSuccessMessage] = useState("")
  const [confirmEmail, setConfirmEmail] = useState<ConfirmEmailState | null>(null)
  const [customEmail, setCustomEmail] = useState<CustomEmailState | null>(null)
  const [logsClientUnitId, setLogsClientUnitId] = useState<number | null>(null)

  const dueQuery = useQuery<{ notifications: PaymentNotification[] }>({
    queryKey: ["notifications", "payment-due-soon"],
    queryFn: () => getJson("/notifications/payment-due-soon"),
  })

  const docsQuery = useQuery<{ notifications: MissingDocumentNotification[] }>({
    queryKey: ["notifications", "missing-documents"],
    queryFn: () => getJson("/notifications/missing-documents"),
  })

  const pastDueQuery = useQuery<{ notifications: PastDueNotification[] }>({
    queryKey: ["notifications", "past-due"],
    queryFn: () => getJson("/notifications/past-due"),
  })

  const logsQuery = useQuery<{ logs: EmailLog[] }>({
    queryKey: ["notifications", "email-logs", logsClientUnitId],
    queryFn: () => getJson(`/notifications/email-logs/${logsClientUnitId}`),
    enabled: Boolean(logsClientUnitId),
  })

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] })
  }

  const sendEmailMutation = useMutation({
    mutationFn: ({ endpoint, payload }: { endpoint: string; payload: Record<string, unknown> }) =>
      postJson(endpoint, payload),
    onSuccess: () => {
      setConfirmEmail(null)
      setCustomEmail(null)
      setSuccessMessage("Email sent successfully")
      invalidateNotifications()
    },
  })

  const dueRows = dueQuery.data?.notifications || []
  const documentRows = docsQuery.data?.notifications || []
  const pastDueRows = pastDueQuery.data?.notifications || []

  const statRows = useMemo(
    () => [
      { label: "Due this week", value: dueRows.length },
      { label: "Missing docs 30+ days", value: documentRows.length },
      { label: "Past due", value: pastDueRows.length },
    ],
    [dueRows.length, documentRows.length, pastDueRows.length],
  )

  const openPaymentConfirm = (row: PaymentNotification) => {
    setConfirmEmail({
      clientUnitId: row.client_unit_id,
      scheduleId: row.schedule_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      title: `Send payment reminder to ${row.client_name}?`,
      message: `Unit ${row.unit_id} is due on ${formatDateOnly(row.due_date)} for ${row.amount_due_display || formatMoney(row.amount_due)}.`,
      endpoint: "/notifications/send-payment-due-email",
    })
  }

  const openPastDueConfirm = (row: PastDueNotification) => {
    setConfirmEmail({
      clientUnitId: row.client_unit_id,
      scheduleId: row.schedule_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      title: `Send past due notice to ${row.client_name}?`,
      message: `Unit ${row.unit_id} is ${row.days_late} day(s) late. Amount due: ${row.amount_due_display || formatMoney(row.amount_due)}.`,
      endpoint: "/notifications/send-past-due-email",
    })
  }

  const openMissingDocsConfirm = (row: MissingDocumentNotification) => {
    setConfirmEmail({
      clientUnitId: row.client_unit_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      title: `Send missing document reminder to ${row.client_name}?`,
      message: `Missing documents: ${row.missing_documents.join(", ")}`,
      endpoint: "/notifications/send-missing-documents-email",
    })
  }

  const openCustomEmail = (row: PaymentNotification | PastDueNotification | MissingDocumentNotification, messageType: NotificationType) => {
    setCustomEmail({
      clientUnitId: row.client_unit_id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      unitId: row.unit_id,
      subject: "",
      message: "",
      messageType,
    })
  }

  const handleConfirmSend = () => {
    if (!confirmEmail) return

    sendEmailMutation.mutate({
      endpoint: confirmEmail.endpoint,
      payload: {
        clientUnitId: confirmEmail.clientUnitId,
        scheduleId: confirmEmail.scheduleId,
      },
    })
  }

  const handleCustomSend = () => {
    if (!customEmail) return

    sendEmailMutation.mutate({
      endpoint: "/notifications/send-custom-email",
      payload: {
        clientUnitId: customEmail.clientUnitId,
        subject: customEmail.subject,
        message: customEmail.message,
        messageType: customEmail.messageType,
      },
    })
  }

  return (
    <div className="p-6">
      <PageHeader
        icon={<FiBell />}
        title="Notifications"
        subtitle="Review due payments, missing documents, and past due accounts before sending client emails."
        actions={
          <Button icon={<FiRefreshCw />} onClick={invalidateNotifications}>
            Refresh
          </Button>
        }
      />

      {successMessage ? <Alert variant="success" title={successMessage} /> : null}
      {sendEmailMutation.error ? (
        <Alert variant="error" title={(sendEmailMutation.error as Error).message} />
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {statRows.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant={activeTab === "due" ? "primary" : "secondary"} onClick={() => setActiveTab("due")}>Due This Week</Button>
        <Button variant={activeTab === "documents" ? "primary" : "secondary"} onClick={() => setActiveTab("documents")}>Missing Documents</Button>
        <Button variant={activeTab === "pastDue" ? "primary" : "secondary"} onClick={() => setActiveTab("pastDue")}>Past Due</Button>
      </div>

      {activeTab === "due" ? (
        <NotificationSection isLoading={dueQuery.isLoading} error={dueQuery.error} emptyTitle="No payments due this week">
          <PaymentDueTable
            rows={dueRows}
            onCustom={(row) => openCustomEmail(row, "payment_due")}
            onHistory={(row) => setLogsClientUnitId(row.client_unit_id)}
            onSend={openPaymentConfirm}
          />
        </NotificationSection>
      ) : null}

      {activeTab === "documents" ? (
        <NotificationSection isLoading={docsQuery.isLoading} error={docsQuery.error} emptyTitle="No missing document follow-ups">
          <MissingDocumentsTable
            rows={documentRows}
            onCustom={(row) => openCustomEmail(row, "missing_documents")}
            onHistory={(row) => setLogsClientUnitId(row.client_unit_id)}
            onSend={openMissingDocsConfirm}
          />
        </NotificationSection>
      ) : null}

      {activeTab === "pastDue" ? (
        <NotificationSection isLoading={pastDueQuery.isLoading} error={pastDueQuery.error} emptyTitle="No past due accounts">
          <PastDueTable
            rows={pastDueRows}
            onCustom={(row) => openCustomEmail(row, "past_due")}
            onHistory={(row) => setLogsClientUnitId(row.client_unit_id)}
            onSend={openPastDueConfirm}
          />
        </NotificationSection>
      ) : null}

      {confirmEmail ? (
        <Modal
          title={confirmEmail.title}
          onClose={() => setConfirmEmail(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setConfirmEmail(null)}>Cancel</Button>
              <Button disabled={sendEmailMutation.isPending} icon={<FiMail />} onClick={handleConfirmSend} variant="primary">
                Send Email
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-sm text-slate-700">
            <p>{confirmEmail.message}</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p><span className="font-semibold">To:</span> {confirmEmail.clientEmail || "No email"}</p>
              <p><span className="font-semibold">Client:</span> {confirmEmail.clientName}</p>
            </div>
          </div>
        </Modal>
      ) : null}

      {customEmail ? (
        <Modal
          title={`Custom email - ${customEmail.clientName}`}
          onClose={() => setCustomEmail(null)}
          size="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCustomEmail(null)}>Cancel</Button>
              <Button
                disabled={sendEmailMutation.isPending || !customEmail.subject.trim() || !customEmail.message.trim()}
                icon={<FiMessageSquare />}
                onClick={handleCustomSend}
                variant="primary"
              >
                Send Custom Email
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p><span className="font-semibold">To:</span> {customEmail.clientEmail || "No email"}</p>
              <p><span className="font-semibold">Unit:</span> {customEmail.unitId}</p>
            </div>

            <Input
              label="Subject"
              value={customEmail.subject}
              onChange={(event) => setCustomEmail({ ...customEmail, subject: event.target.value })}
              required
            />

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Message</span>
              <textarea
                className="min-h-[180px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                value={customEmail.message}
                onChange={(event) => setCustomEmail({ ...customEmail, message: event.target.value })}
                placeholder="Write the message you want to send to the client."
                required
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {logsClientUnitId ? (
        <Modal title="Email History" onClose={() => setLogsClientUnitId(null)} size="lg">
          {logsQuery.isLoading ? <LoadingState label="Loading email history..." /> : null}
          {logsQuery.error ? <Alert variant="error" title={(logsQuery.error as Error).message} /> : null}
          {!logsQuery.isLoading && !logsQuery.error && (logsQuery.data?.logs || []).length === 0 ? (
            <EmptyState title="No email history" description="No emails were sent for this client unit yet." />
          ) : null}
          {(logsQuery.data?.logs || []).length > 0 ? (
            <div className="space-y-3">
              {(logsQuery.data?.logs || []).map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-900">{log.subject}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{log.status}</span>
                  </div>
                  <p className="mt-1 text-slate-500">To: {log.sent_to}</p>
                  <p className="text-slate-500">Type: {log.message_type} • Sent: {formatDateOnly(log.sent_at)} • By: {log.sent_by_name || "-"}</p>
                  {log.error_message ? <p className="mt-2 text-red-600">{log.error_message}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}

const NotificationSection = ({ children, emptyTitle, error, isLoading }: { children: ReactNode; emptyTitle: string; error: unknown; isLoading: boolean }) => {
  if (isLoading) return <LoadingState label="Loading notifications..." />
  if (error) return <Alert variant="error" title={(error as Error).message} />

  const hasRows = Array.isArray((children as ReactElement)?.props?.rows)
    ? (children as ReactElement).props.rows.length > 0
    : true

  if (!hasRows) return <EmptyState title={emptyTitle} description="There are no client records that match this follow-up rule." />

  return <>{children}</>
}

const ActionButtons = ({ onCustom, onHistory, onSend }: { onCustom: () => void; onHistory: () => void; onSend: () => void }) => (
  <div className="flex flex-wrap gap-2">
    <Button icon={<FiMail />} onClick={onSend} variant="primary">Send Email</Button>
    <Button icon={<FiMessageSquare />} onClick={onCustom}>Custom</Button>
    <Button icon={<FiFileText />} onClick={onHistory}>History</Button>
  </div>
)

const PaymentDueTable = ({ rows, onCustom, onHistory, onSend }: { rows: PaymentNotification[]; onCustom: (row: PaymentNotification) => void; onHistory: (row: PaymentNotification) => void; onSend: (row: PaymentNotification) => void }) => (
  <TableContainer>
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-4 py-3">Client</th>
          <th className="px-4 py-3">Project / Unit</th>
          <th className="px-4 py-3">Due</th>
          <th className="px-4 py-3">Amount</th>
          <th className="px-4 py-3">Last Email</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row) => (
          <tr key={`${row.client_unit_id}-${row.schedule_id}`}>
            <td className="px-4 py-3"><p className="font-bold text-slate-900">{row.client_name}</p><p className="text-xs text-slate-500">{row.client_email || "No email"}</p></td>
            <td className="px-4 py-3"><p>{row.project_name}</p><p className="text-xs font-semibold text-slate-500">{row.unit_id}</p></td>
            <td className="px-4 py-3"><p>{formatDateOnly(row.due_date)}</p><p className="text-xs text-slate-500">{row.days_until_due} day(s) left</p></td>
            <td className="px-4 py-3 font-bold text-slate-900">{row.amount_due_display || formatMoney(row.amount_due)}</td>
            <td className="px-4 py-3 text-slate-600">{getLastEmailText(row.last_email_sent_at)}</td>
            <td className="px-4 py-3"><ActionButtons onCustom={() => onCustom(row)} onHistory={() => onHistory(row)} onSend={() => onSend(row)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableContainer>
)

const MissingDocumentsTable = ({ rows, onCustom, onHistory, onSend }: { rows: MissingDocumentNotification[]; onCustom: (row: MissingDocumentNotification) => void; onHistory: (row: MissingDocumentNotification) => void; onSend: (row: MissingDocumentNotification) => void }) => (
  <TableContainer>
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-4 py-3">Client</th>
          <th className="px-4 py-3">Project / Unit</th>
          <th className="px-4 py-3">Reserved</th>
          <th className="px-4 py-3">Missing Documents</th>
          <th className="px-4 py-3">Last Email</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row) => (
          <tr key={row.client_unit_id}>
            <td className="px-4 py-3"><p className="font-bold text-slate-900">{row.client_name}</p><p className="text-xs text-slate-500">{row.client_email || "No email"}</p></td>
            <td className="px-4 py-3"><p>{row.project_name}</p><p className="text-xs font-semibold text-slate-500">{row.unit_id}</p></td>
            <td className="px-4 py-3"><p>{formatDateOnly(row.reserved_date)}</p><p className="text-xs text-slate-500">{row.days_since_reserved} day(s)</p></td>
            <td className="px-4 py-3"><div className="flex max-w-md flex-wrap gap-1">{row.missing_documents.map((document) => <span key={document} className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">{document}</span>)}</div></td>
            <td className="px-4 py-3 text-slate-600">{getLastEmailText(row.last_email_sent_at)}</td>
            <td className="px-4 py-3"><ActionButtons onCustom={() => onCustom(row)} onHistory={() => onHistory(row)} onSend={() => onSend(row)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableContainer>
)

const PastDueTable = ({ rows, onCustom, onHistory, onSend }: { rows: PastDueNotification[]; onCustom: (row: PastDueNotification) => void; onHistory: (row: PastDueNotification) => void; onSend: (row: PastDueNotification) => void }) => (
  <TableContainer>
    <table className="min-w-full divide-y divide-slate-200 text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="px-4 py-3">Client</th>
          <th className="px-4 py-3">Project / Unit</th>
          <th className="px-4 py-3">Due</th>
          <th className="px-4 py-3">Amount</th>
          <th className="px-4 py-3">Penalty</th>
          <th className="px-4 py-3">Last Email</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {rows.map((row) => (
          <tr key={`${row.client_unit_id}-${row.schedule_id}`}>
            <td className="px-4 py-3"><p className="font-bold text-slate-900">{row.client_name}</p><p className="text-xs text-slate-500">{row.client_email || "No email"}</p></td>
            <td className="px-4 py-3"><p>{row.project_name}</p><p className="text-xs font-semibold text-slate-500">{row.unit_id}</p></td>
            <td className="px-4 py-3"><p>{formatDateOnly(row.due_date)}</p><p className="text-xs text-red-600">{row.days_late} day(s) late</p></td>
            <td className="px-4 py-3 font-bold text-slate-900">{row.amount_due_display || formatMoney(row.amount_due)}</td>
            <td className="px-4 py-3 text-slate-700">{row.penalty_display || formatMoney(row.penalty || 0)}</td>
            <td className="px-4 py-3 text-slate-600">{getLastEmailText(row.last_email_sent_at)}</td>
            <td className="px-4 py-3"><ActionButtons onCustom={() => onCustom(row)} onHistory={() => onHistory(row)} onSend={() => onSend(row)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableContainer>
)

export default Notifications

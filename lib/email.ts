type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "AyuPulse Scheduler <onboarding@resend.dev>";

  if (!apiKey) {
    console.log("Email skipped because RESEND_API_KEY is not set.", payload);
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Email failed: ${errorText}`);
  }

  return response.json();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildHostConfirmationEmail(params: {
  hostName: string;
  guestName: string;
  guestEmail: string;
  guestTelegram: string;
  agenda?: string;
  meetingTitle: string;
  formattedTime: string;
  dashboardUrl: string;
  outlookUrl: string;
}) {
  const agenda = params.agenda?.trim() ? params.agenda : "Not provided";

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#050505;color:#f8f0df;padding:28px;border-radius:18px">
      <h1 style="color:#f3d28f;margin:0 0 12px">New AyuPulse booking request</h1>
      <p style="color:#c6b895">Hi ${escapeHtml(params.hostName)}, someone has requested a meeting with you.</p>

      <div style="border:1px solid rgba(218,177,99,.35);border-radius:16px;padding:18px;margin:22px 0;background:#111">
        <p><strong>Meeting:</strong> ${escapeHtml(params.meetingTitle)}</p>
        <p><strong>Time:</strong> ${escapeHtml(params.formattedTime)} Singapore time</p>
        <p><strong>Guest:</strong> ${escapeHtml(params.guestName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(params.guestEmail)}</p>
        <p><strong>Telegram:</strong> ${escapeHtml(params.guestTelegram)}</p>
        <p><strong>Agenda:</strong> ${escapeHtml(agenda)}</p>
      </div>

      <p style="color:#c6b895">
        Confirm the appointment from your private dashboard. Only the respective host account can confirm it.
      </p>

      <p>
        <a href="${params.dashboardUrl}" style="display:inline-block;background:#d4ad68;color:#080808;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:800;margin-right:8px">
          Open private dashboard
        </a>
        <a href="${params.outlookUrl}" style="display:inline-block;border:1px solid #d4ad68;color:#f3d28f;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:800">
          Add to Outlook
        </a>
      </p>

      <p style="color:#8f805f;font-size:13px;margin-top:22px">
        This meeting remains pending until you confirm it in the AyuPulse dashboard.
      </p>
    </div>
  `;
}

export function buildGuestPendingEmail(params: {
  guestName: string;
  hostName: string;
  meetingTitle: string;
  formattedTime: string;
  outlookUrl: string;
}) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#050505;color:#f8f0df;padding:28px;border-radius:18px">
      <h1 style="color:#f3d28f;margin:0 0 12px">Booking request received</h1>
      <p style="color:#c6b895">Hi ${escapeHtml(params.guestName)}, your AyuPulse meeting request has been received.</p>

      <div style="border:1px solid rgba(218,177,99,.35);border-radius:16px;padding:18px;margin:22px 0;background:#111">
        <p><strong>Meeting:</strong> ${escapeHtml(params.meetingTitle)}</p>
        <p><strong>Host:</strong> ${escapeHtml(params.hostName)}</p>
        <p><strong>Time:</strong> ${escapeHtml(params.formattedTime)} Singapore time</p>
        <p><strong>Status:</strong> Pending host confirmation</p>
      </div>

      <p style="color:#c6b895">
        The host will confirm the appointment. You can still add the tentative slot to Outlook below.
      </p>

      <p>
        <a href="${params.outlookUrl}" style="display:inline-block;background:#d4ad68;color:#080808;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:800">
          Add tentative slot to Outlook
        </a>
      </p>
    </div>
  `;
}

export function buildGuestConfirmedEmail(params: {
  guestName: string;
  hostName: string;
  meetingTitle: string;
  formattedTime: string;
  outlookUrl: string;
}) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#050505;color:#f8f0df;padding:28px;border-radius:18px">
      <h1 style="color:#f3d28f;margin:0 0 12px">Your AyuPulse meeting is confirmed</h1>
      <p style="color:#c6b895">Hi ${escapeHtml(params.guestName)}, ${escapeHtml(params.hostName)} has confirmed your meeting.</p>

      <div style="border:1px solid rgba(218,177,99,.35);border-radius:16px;padding:18px;margin:22px 0;background:#111">
        <p><strong>Meeting:</strong> ${escapeHtml(params.meetingTitle)}</p>
        <p><strong>Time:</strong> ${escapeHtml(params.formattedTime)} Singapore time</p>
        <p><strong>Status:</strong> Confirmed</p>
      </div>

      <p>
        <a href="${params.outlookUrl}" style="display:inline-block;background:#d4ad68;color:#080808;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:800">
          Add confirmed meeting to Outlook
        </a>
      </p>
    </div>
  `;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "info@leaft.io";

type Attachment = { filename: string; content: string };

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set – email not sent to", to);
    return null;
  }

  const body: Record<string, unknown> = {
    from: `Leaft <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  };

  if (attachments?.length) {
    body.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content).toString("base64"),
    }));
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return null;
  }

  return res.json();
}

export function generateICS({
  summary,
  description,
  dtStart,
  dtEnd,
  organizerEmail,
  attendeeEmail,
}: {
  summary: string;
  description: string;
  dtStart: Date;
  dtEnd: Date;
  organizerEmail: string;
  attendeeEmail: string;
}) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Leaft//Entretien//FR",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(dtStart)}`,
    `DTEND:${fmt(dtEnd)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    `ORGANIZER;CN=Leaft:mailto:${organizerEmail}`,
    `ATTENDEE;RSVP=TRUE;CN=${attendeeEmail}:mailto:${attendeeEmail}`,
    `UID:${crypto.randomUUID()}@leaft.io`,
    `DTSTAMP:${fmt(new Date())}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

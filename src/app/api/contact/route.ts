import { NextResponse } from "next/server";
import { emailLayout } from "@/lib/email";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM || "Leaft <info@leaft.io>";
// Destinataires des demandes du formulaire de contact (séparés par des virgules dans CONTACT_TO).
const DEFAULT_CONTACT_RECIPIENTS = ["info@leaft.io", "pierre-loic@leaft.io", "chloe@leaft.io"];

function getContactRecipients(): string[] {
  const raw = process.env.CONTACT_TO;
  if (raw?.trim()) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return DEFAULT_CONTACT_RECIPIENTS;
}

const COMPANY_SIZES = ["1 – 5", "6 – 19", "20 – 99", "100+"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendViaResend(payload: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[contact] RESEND_API_KEY non défini – email non envoyé à", payload.to);
    return false;
  }
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[contact] Resend error", res.status, body);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[contact] Resend request failed", error);
    return false;
  }
}

export async function POST(request: Request) {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const firstName = typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName = typeof data.lastName === "string" ? data.lastName.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const companySize = typeof data.companySize === "string" ? data.companySize.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (!firstName || !lastName || !email) {
    return NextResponse.json({ error: "Merci de renseigner votre nom, prénom et email." }, { status: 400 });
  }
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  const size = COMPANY_SIZES.includes(companySize) ? companySize : "Non précisé";
  const fullName = `${firstName} ${lastName}`;
  const contactRecipients = getContactRecipients();

  // 1) Notification interne (équipe Leaft)
  const internalHtml = emailLayout(
    "",
    `
      <p style="margin:0 0 16px;font-size:15px;">Nouvelle demande depuis le formulaire de contact :</p>
      <div style="margin:16px 0;padding:16px 20px;background:#e8f5ec;border-radius:12px;border-left:4px solid #0d5c2e;">
        <ul style="margin:0;padding-left:18px;font-size:14px;">
          <li style="margin:6px 0;">Nom : <strong>${escapeHtml(fullName)}</strong></li>
          <li style="margin:6px 0;">Email : <strong>${escapeHtml(email)}</strong></li>
          <li style="margin:6px 0;">Taille de l'entreprise : <strong>${escapeHtml(size)}</strong></li>
        </ul>
      </div>
      <p style="margin:0 0 6px;font-size:14px;font-weight:600;">Message</p>
      <p style="margin:0;font-size:14px;white-space:pre-wrap;color:#333;">${message ? escapeHtml(message) : "<em>(aucun message)</em>"}</p>
    `,
  );
  const internalText = `Nouvelle demande de contact\n\nNom : ${fullName}\nEmail : ${email}\nTaille : ${size}\n\nMessage :\n${message || "(aucun message)"}`;

  const internalSent = await sendViaResend({
    to: contactRecipients,
    subject: `Nouveau contact – ${fullName} (${size})`,
    html: internalHtml,
    text: internalText,
    replyTo: email,
  });

  // 2) Accusé de réception automatique au visiteur
  const autoReplyHtml = emailLayout(
    firstName,
    `
      <p style="margin:0 0 16px;font-size:15px;">Merci d'avoir pris contact avec Leaft. Nous avons bien reçu votre demande et reviendrons vers vous sous 24h ouvrées.</p>
      <p style="margin:0 0 16px;font-size:15px;">En attendant, vous pouvez réserver directement un créneau de démonstration de 30 minutes qui vous convient :</p>
      <p style="margin:0 0 20px;">
        <a href="https://leaft.io/contact" style="display:inline-block;background:#0d5c2e;color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-size:14px;font-weight:600;">Réserver une démo</a>
      </p>
      <p style="margin:0;font-size:13px;color:#666;">Pour rappel, voici votre message :</p>
      <p style="margin:8px 0 0;font-size:13px;white-space:pre-wrap;color:#666;border-left:3px solid #e8f5ec;padding-left:12px;">${message ? escapeHtml(message) : "<em>(aucun message)</em>"}</p>
    `,
  );
  const autoReplyText = `Bonjour ${firstName},\n\nMerci d'avoir contacté Leaft. Nous avons bien reçu votre demande et reviendrons vers vous sous 24h ouvrées.\n\nÀ bientôt,\nL'équipe Leaft`;

  await sendViaResend({
    to: email,
    subject: "Nous avons bien reçu votre demande – Leaft",
    html: autoReplyHtml,
    text: autoReplyText,
  });

  if (!internalSent && !RESEND_API_KEY) {
    return NextResponse.json({ ok: true, warning: "email_not_configured" });
  }

  return NextResponse.json({ ok: true });
}

/**
 * Email helpers. Configure RESEND_API_KEY and RESEND_FROM to send real emails.
 * Without Resend, emails are logged (e.g. in development).
 */
const DEFAULT_FROM = process.env.RESEND_FROM || "Leaft <info@leaft.io>";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://leaft.io";
const LOGO_URL = `${BASE_URL}/brand/logo-dark.png`;
const BRAND_COLOR = "#0d5c2e";
const BRAND_LIGHT = "#e8f5ec";

function emailLayout(organizationName: string, htmlContent: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f5f5f5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${BRAND_COLOR};padding:24px 28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Leaft" width="120" height="48" style="display:inline-block;height:40px;width:auto;" />
    </div>
    <div style="padding:28px 32px;color:#1a1a1a;line-height:1.6;">
      <p style="margin:0 0 20px;font-size:15px;">Bonjour${organizationName ? ` <strong>${organizationName}</strong>` : ""},</p>
      ${htmlContent}
      <p style="margin:24px 0 0;font-size:15px;">À bientôt,<br><strong>L'équipe Leaft</strong></p>
    </div>
    <div style="padding:16px 32px;background:${BRAND_LIGHT};text-align:center;border-top:1px solid rgba(13,92,46,0.15);">
      <img src="${LOGO_URL}" alt="Leaft" width="80" height="32" style="height:28px;width:auto;opacity:0.9;" />
    </div>
  </div>
</body>
</html>`;
}

export type AddTalentsEmailData = {
  to: string;
  organizationName: string;
  previousSeatCount: number;
  newSeatCount: number;
  addCount: number;
  planType: "monthly" | "annual";
  newAmountEur: number;
  prorationAmountEur: string;
  nextBillingDate?: string;
};

export async function sendAddTalentsEmail(data: AddTalentsEmailData): Promise<{ ok: boolean; error?: string }> {
  const subject = `Leaft – Votre abonnement a été mis à jour (${data.newSeatCount} talent${data.newSeatCount > 1 ? "s" : ""})`;
  const amountLabel = data.planType === "annual" ? "par an" : "par mois";
  const newAmountStr = data.newAmountEur.toFixed(2).replace(".", ",");
  const prorationLine = data.prorationAmountEur !== "0,00"
    ? `<li style="margin:6px 0;">Montant au prorata (facturé aujourd'hui) : <strong>${data.prorationAmountEur} €</strong></li>`
    : "";
  const nextBillingLine = data.nextBillingDate
    ? `<li style="margin:6px 0;">Prochaine facturation : <strong>${data.nextBillingDate}</strong></li>`
    : "";
  const htmlContent = `
      <p style="margin:0 0 16px;font-size:15px;">Votre abonnement Leaft a été mis à jour suite à l'ajout de talent(s).</p>
      <div style="margin:20px 0;padding:16px 20px;background:${BRAND_LIGHT};border-radius:12px;border-left:4px solid ${BRAND_COLOR};">
        <p style="margin:0 0 10px;font-weight:600;font-size:14px;color:${BRAND_COLOR};">Détail de l'ajustement</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;">
          <li style="margin:6px 0;">Nombre de talents avant ajout : <strong>${data.previousSeatCount}</strong></li>
          <li style="margin:6px 0;">Talent(s) ajouté(s) : <strong>${data.addCount}</strong></li>
          <li style="margin:6px 0;">Nouveau total : <strong>${data.newSeatCount}</strong> talent${data.newSeatCount > 1 ? "s" : ""}</li>
          <li style="margin:6px 0;">Nouveau montant de l'abonnement (${amountLabel}) : <strong>${newAmountStr} €</strong></li>
          ${prorationLine}
          ${nextBillingLine}
        </ul>
      </div>
      <p style="margin:0;font-size:14px;color:#555;">Un récapitulatif est également disponible dans votre espace Leaft.</p>
  `;
  const html = emailLayout(data.organizationName, htmlContent);
  const text = `Bonjour ${data.organizationName},\n\nVotre abonnement Leaft a été mis à jour suite à l'ajout d'un talent.\n\nDétail : ${data.previousSeatCount} → ${data.newSeatCount} talents. Nouveau montant (${amountLabel}) : ${newAmountStr} €. Prorata : ${data.prorationAmountEur} €.\n\nÀ bientôt, L'équipe Leaft`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = DEFAULT_FROM;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: data.to,
          subject,
          html,
          text,
        }),
      });
      const json = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        console.error("Resend error:", json);
        return { ok: false, error: json.message || "Failed to send email" };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error sending add-talents email:", err);
      return { ok: false, error: message };
    }
  }

  console.log("[Email] Add talents (no RESEND_API_KEY, logging only):", { to: data.to, subject });
  return { ok: true };
}

export type RemoveTalentEmailData = {
  to: string;
  organizationName: string;
  removedTalentName: string;
  previousSeatCount: number;
  newSeatCount: number;
  planType: "monthly" | "annual";
  newAmountEur: number;
  creditAmountEur: string;
};

export async function sendRemoveTalentEmail(data: RemoveTalentEmailData): Promise<{ ok: boolean; error?: string }> {
  const subject = `Leaft – Abonnement mis à jour (${data.newSeatCount} talent${data.newSeatCount > 1 ? "s" : ""})`;
  const amountLabel = data.planType === "annual" ? "par an" : "par mois";
  const newAmountStr = data.newAmountEur.toFixed(2).replace(".", ",");
  const creditLine = data.creditAmountEur !== "0,00"
    ? `<li style="margin:6px 0;">Crédit au prorata appliqué : <strong>${data.creditAmountEur} €</strong></li>`
    : "";
  const htmlContent = `
      <p style="margin:0 0 16px;font-size:15px;">Le talent <strong>${data.removedTalentName}</strong> a été retiré de votre organisation.</p>
      <div style="margin:20px 0;padding:16px 20px;background:${BRAND_LIGHT};border-radius:12px;border-left:4px solid ${BRAND_COLOR};">
        <p style="margin:0 0 10px;font-weight:600;font-size:14px;color:${BRAND_COLOR};">Modalités</p>
        <ul style="margin:0;padding-left:20px;font-size:14px;">
          <li style="margin:6px 0;">Ancien nombre de talents : <strong>${data.previousSeatCount}</strong></li>
          <li style="margin:6px 0;">Nouveau total : <strong>${data.newSeatCount}</strong> talent${data.newSeatCount > 1 ? "s" : ""}</li>
          <li style="margin:6px 0;">Nouveau montant de l'abonnement (${amountLabel}) : <strong>${newAmountStr} €</strong></li>
          ${creditLine}
        </ul>
      </div>
      <p style="margin:0;font-size:14px;color:#555;">Le crédit au prorata sera appliqué sur votre prochaine facture.</p>
  `;
  const html = emailLayout(data.organizationName, htmlContent);
  const text = `Bonjour ${data.organizationName},\n\nLe talent ${data.removedTalentName} a été retiré. Nouveau total : ${data.newSeatCount} talents. Nouveau montant (${amountLabel}) : ${newAmountStr} €. Crédit : ${data.creditAmountEur} €.\n\nÀ bientôt, L'équipe Leaft`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = DEFAULT_FROM;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({ from, to: data.to, subject, html, text }),
      });
      const json = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        console.error("Resend error:", json);
        return { ok: false, error: json.message || "Failed to send email" };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error sending remove-talent email:", err);
      return { ok: false, error: message };
    }
  }

  console.log("[Email] Remove talent (no RESEND_API_KEY, logging only):", { to: data.to, subject });
  return { ok: true };
}

export type InterviewReminderEmailData = {
  to: string;
  organizationName?: string;
  talentName: string;
  interviewType: string;
  interviewDate: string;
  daysUntil: number;
};

export async function sendInterviewReminderEmail(data: InterviewReminderEmailData): Promise<{ ok: boolean; error?: string }> {
  const subject = `Rappel : ${data.interviewType} avec ${data.talentName} dans ${data.daysUntil} jour${data.daysUntil > 1 ? "s" : ""}`;
  const htmlContent = `
      <p style="margin:0 0 16px;font-size:15px;">Ceci est un rappel pour l'entretien prévu :</p>
      <div style="margin:20px 0;padding:16px 20px;background:${BRAND_LIGHT};border-radius:12px;border-left:4px solid ${BRAND_COLOR};">
        <ul style="margin:0;padding-left:20px;font-size:14px;">
          <li style="margin:6px 0;">Type : <strong>${data.interviewType}</strong></li>
          <li style="margin:6px 0;">Talent : <strong>${data.talentName}</strong></li>
          <li style="margin:6px 0;">Date : <strong>${data.interviewDate}</strong></li>
          ${data.organizationName ? `<li style="margin:6px 0;">Organisation : <strong>${data.organizationName}</strong></li>` : ""}
        </ul>
      </div>
      <p style="margin:0;font-size:14px;color:#555;">L'entretien aura lieu dans ${data.daysUntil} jour${data.daysUntil > 1 ? "s" : ""}.</p>
  `;
  const html = emailLayout(data.organizationName ?? "", htmlContent);
  const text = `Bonjour${data.organizationName ? ` ${data.organizationName}` : ""},\n\nRappel : ${data.interviewType} avec ${data.talentName} le ${data.interviewDate} (dans ${data.daysUntil} jour(s)).\n\nÀ bientôt, L'équipe Leaft`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = DEFAULT_FROM;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({ from, to: data.to, subject, html, text }),
      });
      const json = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        console.error("Resend error:", json);
        return { ok: false, error: json.message || "Failed to send email" };
      }
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error sending interview reminder email:", err);
      return { ok: false, error: message };
    }
  }

  console.log("[Email] Interview reminder (no RESEND_API_KEY, logging only):", { to: data.to, subject });
  return { ok: true };
}

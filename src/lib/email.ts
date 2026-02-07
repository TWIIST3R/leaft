/**
 * Email helpers. Configure RESEND_API_KEY and RESEND_FROM to send real emails.
 * Without Resend, emails are logged (e.g. in development).
 */

export type AddTalentsEmailData = {
  to: string;
  organizationName: string;
  previousSeatCount: number;
  newSeatCount: number;
  addCount: number;
  newAmountPerMonthEur: string;
  prorationAmountEur: string;
  nextBillingDate?: string;
};

export async function sendAddTalentsEmail(data: AddTalentsEmailData): Promise<{ ok: boolean; error?: string }> {
  const subject = `Leaft – Votre abonnement a été mis à jour (${data.newSeatCount} talent${data.newSeatCount > 1 ? "s" : ""})`;
  const body = `
Bonjour,

Votre abonnement Leaft pour ${data.organizationName} a été mis à jour.

Modalités :
- Ancien nombre de talents : ${data.previousSeatCount}
- Nouveaux talents ajoutés : ${data.addCount}
- Nouveau total : ${data.newSeatCount} talent${data.newSeatCount > 1 ? "s" : ""}

Montant :
- Nouveau montant de l'abonnement (par mois) : ${data.newAmountPerMonthEur} €
${data.prorationAmountEur !== "0,00" ? `- Montant au prorata (facturé maintenant) : ${data.prorationAmountEur} €` : ""}
${data.nextBillingDate ? `- Prochaine facturation : ${data.nextBillingDate}` : ""}

Le prorata est calculé à partir de la date de début de votre période en cours.

À bientôt,
L'équipe Leaft
  `.trim();

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "onboarding@resend.dev";

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
          text: body,
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

  console.log("[Email] Add talents (no RESEND_API_KEY, logging only):", {
    to: data.to,
    subject,
    body: body.substring(0, 200) + "...",
  });
  return { ok: true };
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { previewAddSeat } from "@/lib/stripe/subscriptions";

async function getOrganizationId(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();
    if (data) return data.id;
  }
  const { data: userOrg } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return userOrg?.organization_id ?? null;
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const preview = await previewAddSeat(organizationId);
    if (!preview) return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 404 });

    return NextResponse.json({
      previousSeatCount: preview.previousSeatCount,
      newSeatCount: preview.newSeatCount,
      prorationAmountCents: preview.prorationAmountCents,
      newMonthlyAmountCents: preview.newMonthlyAmountCents,
      nextBillingDate: preview.nextBillingDate,
    });
  } catch (e) {
    console.error("Preview add seat:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

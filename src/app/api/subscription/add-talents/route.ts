import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateSubscriptionSeats } from "@/lib/stripe/subscriptions";
import { sendAddTalentsEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const addCount = typeof body.addCount === "number" ? body.addCount : parseInt(body.addCount, 10);
    if (!Number.isInteger(addCount) || addCount < 1) {
      return NextResponse.json(
        { error: "addCount doit être un entier positif" },
        { status: 400 },
      );
    }

    const supabase = supabaseAdmin();
    let organization: { id: string; name: string } | null = null;

    if (orgId) {
      const { data } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("clerk_organization_id", orgId)
        .single();
      if (data) organization = data;
    }
    if (!organization) {
      const { data: userOrg } = await supabase
        .from("user_organizations")
        .select("organization_id, organizations(id, name)")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      const org = userOrg?.organizations;
      if (org) {
        organization = Array.isArray(org) ? org[0] : org;
      }
    }

    if (!organization) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("seat_count")
      .eq("organization_id", organization.id)
      .eq("status", "active")
      .single();
    const currentSeats = subRow?.seat_count ?? 0;
    const newTotal = currentSeats + addCount;

    const updateResult = await updateSubscriptionSeats(organization.id, newTotal);

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
    const newAmountPerMonthEur = (updateResult.newMonthlyAmountCents / 100).toFixed(2).replace(".", ",");
    const prorationEur = (updateResult.prorationAmountCents / 100).toFixed(2).replace(".", ",");

    await sendAddTalentsEmail({
      to: email,
      organizationName: organization.name,
      previousSeatCount: updateResult.previousSeatCount,
      newSeatCount: updateResult.newSeatCount,
      addCount,
      newAmountPerMonthEur,
      prorationAmountEur: prorationEur,
    });

    return NextResponse.json({
      success: true,
      previousSeatCount: updateResult.previousSeatCount,
      newSeatCount: updateResult.newSeatCount,
      prorationAmountCents: updateResult.prorationAmountCents,
    });
  } catch (error) {
    console.error("Error adding talents:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

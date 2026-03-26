import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { optionalEnv } from "@/env";
import crypto from "crypto";

interface OrganizationMembershipEvent {
  data: {
    id: string;
    organization: { id: string };
    public_user_data: {
      user_id: string;
      identifier: string;
    };
    role: string;
  };
  type: string;
}

function verifyWebhook(body: string, headers: Headers, secret: string): boolean {
  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) return false;

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const secretBytes = Buffer.from(secret.replace("whsec_", ""), "base64");
  const expectedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatures = svixSignature.split(" ");
  return signatures.some((sig) => {
    const sigValue = sig.split(",")[1];
    return sigValue === expectedSignature;
  });
}

export async function POST(request: NextRequest) {
  const secret = optionalEnv.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();

  if (!verifyWebhook(body, request.headers, secret)) {
    console.error("Clerk webhook verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: OrganizationMembershipEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "organizationMembership.created") {
    const clerkUserId = event.data.public_user_data.user_id;
    const clerkOrgId = event.data.organization.id;
    const userEmail = event.data.public_user_data.identifier;
    const clerkRole = event.data.role;

    console.log("Clerk webhook: organizationMembership.created", { clerkUserId, clerkOrgId, userEmail, clerkRole });

    const supabase = supabaseAdmin();

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", clerkOrgId)
      .single();

    if (!org) {
      console.error("Organization not found for clerk_organization_id:", clerkOrgId);
      return NextResponse.json({ received: true });
    }
    const organizationId = org.id;

    const isAdmin = clerkRole === "org:admin";
    const dbRole = isAdmin ? "Owner" : "Talent";

    const { error: uoError } = await supabase
      .from("user_organizations")
      .upsert(
        {
          clerk_user_id: clerkUserId,
          organization_id: organizationId,
          role: dbRole,
        },
        { onConflict: "clerk_user_id,organization_id" }
      );

    if (uoError) {
      console.error("Error upserting user_organizations:", uoError);
    }

    async function linkEmployeeToClerk(emailToMatch: string | null): Promise<boolean> {
      if (!emailToMatch || !emailToMatch.trim()) return false;
      const trimmed = emailToMatch.trim();
      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("email", trimmed)
        .is("clerk_user_id", null)
        .maybeSingle();
      if (!emp) return false;
      const { error: empError } = await supabase
        .from("employees")
        .update({ clerk_user_id: clerkUserId })
        .eq("id", emp.id);
      if (empError) {
        console.error("Error linking clerk_user_id to employee:", empError);
        return false;
      }
      console.log("Linked clerk_user_id to employee:", { clerkUserId, email: trimmed });
      return true;
    }

    const identifierTrimmed = typeof userEmail === "string" ? userEmail.trim() : "";
    let linked = identifierTrimmed ? await linkEmployeeToClerk(identifierTrimmed) : false;

    if (!linked && clerkUserId) {
      try {
        const user = await clerkClient().users.getUser(clerkUserId);
        const primaryEmail = user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress
          ?? user.emailAddresses?.[0]?.emailAddress;
        if (primaryEmail) linked = await linkEmployeeToClerk(primaryEmail);
      } catch (e) {
        console.error("Clerk API fallback for employee link:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}

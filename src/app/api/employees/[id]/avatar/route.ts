import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const organizationId = await getOrganizationId(userId, orgId ?? null);
    if (!organizationId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) return NextResponse.json({ error: "Le fichier doit faire moins de 2 Mo" }, { status: 400 });

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) return NextResponse.json({ error: "Format non supporté (PNG, JPG, WebP)" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "png";
    const path = `${organizationId}/${id}.${ext}`;

    const supabase = supabaseAdmin();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("employees")
      .update({ avatar_url })
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (updateError) {
      console.error("Avatar URL update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ avatar_url });
  } catch (e) {
    console.error("Avatar upload:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

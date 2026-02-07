import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

async function getData(id: string) {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const supabase = supabaseAdmin();
  let organizationId: string | null = null;
  if (orgId) {
    const { data } = await supabase.from("organizations").select("id").eq("clerk_organization_id", orgId).single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, current_job_title, annual_salary_brut, hire_date")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  return employee;
}

export default async function TalentFichePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await getData(id);
  if (!employee) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/talents" className="text-sm font-medium text-[var(--brand)] hover:underline">
            ← Retour aux talents
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text)]">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
            Fiche talent · Suivi des entretiens et évolution depuis cette page.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Informations</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-[color:rgba(11,11,11,0.5)]">Poste</dt>
            <dd className="mt-1 text-[var(--text)]">{employee.current_job_title || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-[color:rgba(11,11,11,0.5)]">Email</dt>
            <dd className="mt-1 text-[var(--text)]">{employee.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-[color:rgba(11,11,11,0.5)]">Salaire annuel brut</dt>
            <dd className="mt-1 text-[var(--text)]">
              {employee.annual_salary_brut != null
                ? `${Number(employee.annual_salary_brut).toLocaleString("fr-FR")} €`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-[color:rgba(11,11,11,0.5)]">Date d’entrée</dt>
            <dd className="mt-1 text-[var(--text)]">
              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("fr-FR") : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Entretiens annuels</h2>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          Historique et prochain entretien. Bientôt disponible depuis cette fiche.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
          Suivi des entretiens à venir.
        </div>
      </section>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getOrganizationData() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/sign-in");
  }

  const supabase = await supabaseServer();

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("clerk_organization_id", orgId)
    .single();

  if (!organization) {
    redirect("/onboarding");
  }

  // Get employees count
  const { count: employeesCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Get departments count
  const { count: departmentsCount } = await supabase
    .from("departments")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  // Get job families count
  const { count: jobFamiliesCount } = await supabase
    .from("job_families")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id);

  return {
    organization,
    employeesCount: employeesCount ?? 0,
    departmentsCount: departmentsCount ?? 0,
    jobFamiliesCount: jobFamiliesCount ?? 0,
  };
}

export default async function DashboardPage() {
  const data = await getOrganizationData();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Bienvenue sur Leaft</h1>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
              Gérez vos grilles salariales, talents et entretiens en toute transparence.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Talents</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{data.employeesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {data.employeesCount === 0
              ? "Commencez par ajouter vos premiers talents"
              : `${data.employeesCount} talent${data.employeesCount > 1 ? "s" : ""} dans votre organisation`}
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Départements</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{data.departmentsCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {data.departmentsCount === 0
              ? "Créez vos départements pour organiser vos talents"
              : `${data.departmentsCount} département${data.departmentsCount > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Familles de métiers</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">{data.jobFamiliesCount}</p>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            {data.jobFamiliesCount === 0
              ? "Définissez vos familles de métiers et grilles salariales"
              : `${data.jobFamiliesCount} famille${data.jobFamiliesCount > 1 ? "s" : ""} de métiers`}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Actions rapides</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Ajouter un talent</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Inviter un nouveau collaborateur</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Créer une grille</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Définir une famille de métiers</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Nouvel entretien</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Enregistrer un entretien</p>
          </button>
          <button className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-left transition hover:bg-[#f2f5f2]">
            <p className="text-sm font-semibold text-[var(--text)]">Voir les statistiques</p>
            <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.65)]">Analyser l'équité salariale</p>
          </button>
        </div>
      </section>

      {/* Getting Started */}
      {data.employeesCount === 0 && (
        <section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Pour commencer</h2>
          <ol className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                1
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Créez vos départements</p>
                <p className="mt-1">Organisez votre structure en créant vos départements (ex: Product, Sales, Engineering).</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                2
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Définissez vos grilles salariales</p>
                <p className="mt-1">Créez des familles de métiers avec leurs niveaux et fourchettes salariales.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-semibold text-white">
                3
              </span>
              <div>
                <p className="font-semibold text-[var(--text)]">Ajoutez vos talents</p>
                <p className="mt-1">Invitez vos collaborateurs et assignez-les à leurs postes et niveaux.</p>
              </div>
            </li>
          </ol>
        </section>
      )}
    </div>
  );
}

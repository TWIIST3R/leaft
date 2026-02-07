import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

async function getData() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase
      .from("organizations")
      .select("id")
      .eq("clerk_organization_id", orgId)
      .single();
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

  if (!organizationId) redirect("/onboarding");

  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, current_job_title, annual_salary_brut, hire_date")
    .eq("organization_id", organizationId)
    .order("last_name");

  return { employees: employees ?? [] };
}

export default async function TalentsPage() {
  const data = await getData();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Talents</h1>
          <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
            Liste des collaborateurs. Consultez les fiches, ajoutez ou modifiez des talents. Le suivi des entretiens annuels se fera depuis chaque fiche.
          </p>
        </div>
        <Link
          href="/dashboard/talents/new"
          className="inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ajouter un talent
        </Link>
      </div>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        {data.employees.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[color:rgba(11,11,11,0.65)]">Aucun talent pour le moment.</p>
            <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.5)]">
              Ajoutez vos premiers collaborateurs pour gérer les rémunérations et les entretiens.
            </p>
            <Link
              href="/dashboard/talents/new"
              className="mt-4 inline-flex cursor-pointer items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ajouter un talent
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e7e2] bg-[#f8faf8]">
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Nom</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Poste</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Salaire annuel brut</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]">Date d’entrée</th>
                  <th className="px-6 py-4 font-semibold text-[var(--text)]"></th>
                </tr>
              </thead>
              <tbody>
                {data.employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-[#e2e7e2] transition hover:bg-[#f8faf8]">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/talents/${emp.id}`}
                        className="font-medium text-[var(--brand)] hover:underline"
                      >
                        {emp.first_name} {emp.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">{emp.current_job_title || "—"}</td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                      {emp.annual_salary_brut != null
                        ? `${Number(emp.annual_salary_brut).toLocaleString("fr-FR")} €`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-[color:rgba(11,11,11,0.75)]">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/talents/${emp.id}`}
                        className="text-xs font-medium text-[var(--brand)] hover:underline"
                      >
                        Voir la fiche · Entretiens
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

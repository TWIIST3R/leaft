import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function getData(userId: string, orgId: string | null) {
  const supabase = supabaseAdmin();
  let organizationId: string | null = null;

  if (orgId) {
    const { data } = await supabase.from("organizations").select("id, name, salary_transparency_enabled").eq("clerk_organization_id", orgId).single();
    if (data) organizationId = data.id;
  }
  if (!organizationId) {
    const { data: userOrg } = await supabase.from("user_organizations").select("organization_id").eq("clerk_user_id", userId).maybeSingle();
    organizationId = userOrg?.organization_id ?? null;
  }
  if (!organizationId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, salary_transparency_enabled")
    .eq("id", organizationId)
    .single();

  const { data: employee } = await supabase
    .from("employees")
    .select(`
      id, first_name, last_name, email, gender, birth_date, hire_date,
      current_job_title, current_level_id, current_department_id,
      current_management_id, current_anciennete_id, salary_adjustment,
      location, annual_salary_brut, manager_id
    `)
    .eq("organization_id", organizationId)
    .eq("clerk_user_id", userId)
    .single();

  if (!employee) return { orgName: org?.name ?? "", employee: null, department: null, level: null, manager: null, salaryVisible: false };

  const [deptResult, levelResult, managerResult] = await Promise.all([
    employee.current_department_id
      ? supabase.from("departments").select("name").eq("id", employee.current_department_id).single()
      : { data: null },
    employee.current_level_id
      ? supabase.from("levels").select("name, montant_annuel").eq("id", employee.current_level_id).single()
      : { data: null },
    employee.manager_id
      ? supabase.from("employees").select("first_name, last_name").eq("id", employee.manager_id).single()
      : { data: null },
  ]);

  let mgmtName: string | null = null;
  let ancName: string | null = null;
  if (employee.current_management_id) {
    const { data } = await supabase.from("grille_extra").select("name, montant_annuel").eq("id", employee.current_management_id).single();
    mgmtName = data?.name ?? null;
  }
  if (employee.current_anciennete_id) {
    const { data } = await supabase.from("grille_extra").select("name, montant_annuel").eq("id", employee.current_anciennete_id).single();
    ancName = data?.name ?? null;
  }

  return {
    orgName: org?.name ?? "",
    employee,
    department: deptResult?.data?.name ?? null,
    level: levelResult?.data?.name ?? null,
    manager: managerResult?.data ? `${managerResult.data.first_name} ${managerResult.data.last_name}` : null,
    managementLevel: mgmtName,
    ancienneteLevel: ancName,
    salaryVisible: org?.salary_transparency_enabled ?? false,
  };
}

export default async function TalentSpacePage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const data = await getData(userId, orgId ?? null);
  if (!data) redirect("/sign-in");

  const { employee, orgName } = data;

  if (!employee) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Bienvenue sur Leaft</h1>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Votre profil n&apos;a pas encore été configuré par votre administrateur.
            Contactez votre responsable RH pour finaliser votre fiche.
          </p>
        </section>
      </div>
    );
  }

  const labelCls = "text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]";

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-8 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Bonjour, {employee.first_name} 👋
          </h1>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Bienvenue dans votre espace personnel au sein de {orgName}.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Mon profil</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className={labelCls}>Nom complet</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">{employee.first_name} {employee.last_name}</dd>
          </div>
          <div>
            <dt className={labelCls}>Email</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">{employee.email}</dd>
          </div>
          <div>
            <dt className={labelCls}>Poste</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">{employee.current_job_title || "—"}</dd>
          </div>
          <div>
            <dt className={labelCls}>Département</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {data.department ? (
                <span className="rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--brand)]">{data.department}</span>
              ) : "—"}
            </dd>
          </div>
          <div>
            <dt className={labelCls}>Niveau</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {data.level ? (
                <span className="rounded-lg bg-[var(--brand)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">{data.level}</span>
              ) : "—"}
            </dd>
          </div>
          {data.managementLevel && (
            <div>
              <dt className={labelCls}>Niveau Management</dt>
              <dd className="mt-1 text-sm text-[var(--text)]">
                <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{data.managementLevel}</span>
              </dd>
            </div>
          )}
          {data.ancienneteLevel && (
            <div>
              <dt className={labelCls}>Ancienneté</dt>
              <dd className="mt-1 text-sm text-[var(--text)]">
                <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">{data.ancienneteLevel}</span>
              </dd>
            </div>
          )}
          <div>
            <dt className={labelCls}>Manager</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">{data.manager || "—"}</dd>
          </div>
          <div>
            <dt className={labelCls}>Date d&apos;entrée</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">
              {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </dd>
          </div>
          <div>
            <dt className={labelCls}>Localisation</dt>
            <dd className="mt-1 text-sm text-[var(--text)]">{employee.location || "—"}</dd>
          </div>
        </dl>
      </section>

      {data.salaryVisible && (
        <section className="rounded-3xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-6">
          <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Rémunération</h2>
          <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
            Votre entreprise a activé la transparence salariale.
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text)]">
            {employee.annual_salary_brut != null
              ? `${Number(employee.annual_salary_brut).toLocaleString("fr-FR")} €`
              : "—"}
          </p>
          <p className="mt-1 text-xs text-[color:rgba(11,11,11,0.5)]">Salaire annuel brut</p>
        </section>
      )}

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Entretiens annuels</h2>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
          Vos entretiens annuels apparaîtront ici. Cette fonctionnalité sera bientôt disponible.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] p-6 text-center text-sm text-[color:rgba(11,11,11,0.6)]">
          Suivi des entretiens à venir.
        </div>
      </section>
    </div>
  );
}

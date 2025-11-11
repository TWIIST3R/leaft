import { supabaseServer } from "@/lib/supabase/server";

type Collaborator = {
  id: string;
  campaign: string;
  name: string;
  initials: string;
  role: string | null;
  status: string;
  compaRatio: number | null;
  increaseFixedPercent: number | null;
  increaseFixedValue: number | null;
  increaseVariablePercent: number | null;
  increaseVariableValue: number | null;
};

const statusStyles: Record<string, string> = {
  Proposée: "ring-blue-200 text-blue-700 bg-blue-50",
  Validée: "ring-green-200 text-green-700 bg-green-50",
  Analyse: "ring-amber-200 text-amber-700 bg-amber-50",
};

const timeline = [
  { label: "Discovery", below: 1, mastered: 3, above: 1 },
  { label: "Delivery", below: 0, mastered: 4, above: 2 },
  { label: "Déploiement produit", below: 2, mastered: 5, above: 1 },
  { label: "Connaissance produit", below: 1, mastered: 6, above: 0 },
];

async function fetchCollaborators(): Promise<Collaborator[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("review_collaborators")
    .select(
      "id, campaign, name, initials, role, status, compa_ratio, increase_fixed_percent, increase_fixed_value, increase_variable_percent, increase_variable_value",
    )
    .eq("campaign", "Rémunération Q1 2025")
    .order("increase_fixed_value", { ascending: false });

  if (error) {
    throw new Error(`Impossible de récupérer les collaborateurs : ${error.message}`);
  }

  return (
    data?.map((row) => ({
      id: row.id,
      campaign: row.campaign,
      name: row.name,
      initials: row.initials,
      role: row.role,
      status: row.status ?? "Analyse",
      compaRatio: row.compa_ratio,
      increaseFixedPercent: row.increase_fixed_percent,
      increaseFixedValue: row.increase_fixed_value,
      increaseVariablePercent: row.increase_variable_percent,
      increaseVariableValue: row.increase_variable_value,
    })) ?? []
  );
}

const formatPercent = (value?: number | null) => (value != null ? `${value.toFixed(1)} %` : "—");
const formatCurrency = (value?: number | null) =>
  value != null ? `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €` : "—";

export default async function DashboardPage() {
  const collaborators = await fetchCollaborators();
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">Campagne de revue salariale</p>
              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[var(--text)]">Rémunération Q1 · Fini 28 mars</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">En cours</span>
              </div>
            </div>
            <button className="rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[color:rgba(11,11,11,0.7)] transition hover:bg-[#f3f5f3]">
              Voir le détail
            </button>
          </div>
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">
                <span>Budget consommé</span>
                <span>Total : 135 000 €</span>
              </div>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#ecf0ec]">
                <div className="relative h-full">
                  <span className="absolute inset-y-0 left-0 w-[45%] bg-[var(--brand)]" />
                  <span className="absolute inset-y-0 left-[45%] w-[30%] bg-[#6ea9ff]" />
                  <span className="absolute inset-y-0 right-0 w-[25%] bg-[#d3d9d2]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-6 text-xs text-[color:rgba(11,11,11,0.6)]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                  Validé
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#6ea9ff]" />
                  Prévisionnel
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#d3d9d2]" />
                  Restant
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e2e7e2] bg-[#f9fbf9] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Complétion</p>
                <div className="mt-3 flex items-center gap-3">
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-semibold text-blue-600 shadow-[inset_0_0_0_1px_#dbe7ff]"
                    style={{
                      backgroundImage: "conic-gradient(#6ea9ff 75%, #eef3ff 75%)",
                    }}
                  >
                    <span className="absolute h-12 w-12 rounded-full bg-white shadow-inner" />
                    <span className="relative">75%</span>
                  </div>
                  <p className="text-sm text-[color:rgba(11,11,11,0.65)]">
                    18 équipes sur 24 ont déposé leurs propositions d’augmentation.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e2e7e2] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Équité salariale</p>
                <div className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full bg-[#eef3ff]">
                      <span className="block h-2 w-[85%] rounded-full bg-[#6ea9ff]" />
                    </div>
                    <span className="text-xs font-semibold text-[#6ea9ff]">4,2 %</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full bg-[#f4f6ff]">
                      <span className="block h-2 w-[65%] rounded-full bg-[#6ea9ff]/80" />
                    </div>
                    <span className="text-xs font-semibold text-[#6ea9ff]/80">2,3 %</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full bg-[#f4f6ff]">
                      <span className="block h-2 w-[70%] rounded-full bg-[#6ea9ff]/70" />
                    </div>
                    <span className="text-xs font-semibold text-[#6ea9ff]/70">3,1 %</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-[#e2e7e2] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Alertes</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center justify-between rounded-xl bg-[var(--brand)]/5 px-3 py-2 text-[color:rgba(11,11,11,0.7)]">
                    <span>5 talents hors grille</span>
                    <span className="text-xs font-semibold text-[var(--brand)]">Corriger</span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-[#fdf5f4] px-3 py-2 text-[color:rgba(11,11,11,0.7)]">
                    <span>3 managers en retard</span>
                    <span className="text-xs font-semibold text-[#d66a5e]">Relancer</span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-[#f3f7ff] px-3 py-2 text-[color:rgba(11,11,11,0.7)]">
                    <span>Budget restant</span>
                    <span className="text-xs font-semibold text-[#6ea9ff]">47 000 €</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-5 shadow-[0_20px_50px_rgba(23,40,32,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Notes rapides</p>
            <h3 className="mt-2 text-base font-semibold text-[var(--text)]">À surveiller cette semaine</h3>
            <ul className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
              <li className="flex items-start gap-2 rounded-2xl bg-[var(--brand)]/5 px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
                Finaliser la validation des équipes Product & Data (deadline vendredi).
              </li>
              <li className="flex items-start gap-2 rounded-2xl bg-[#fdf5f4] px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#d66a5e]" />
                Préparer le plan de communication sur la transparence des grilles pour avril.
              </li>
              <li className="flex items-start gap-2 rounded-2xl bg-[#f3f7ff] px-3 py-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#6ea9ff]" />
                Comparer les benchmarks marché Data vs Sales pour aligner les prochaines embauches.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-5 shadow-[0_20px_50px_rgba(23,40,32,0.07)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Prochain jalon</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Comité de rémunération</p>
                <p className="text-xs text-[color:rgba(11,11,11,0.6)]">Jeudi 20 mars · 10h30 — 12h00</p>
              </div>
              <button className="rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-semibold text-[color:rgba(11,11,11,0.7)] hover:bg-[#f2f5f2]">
                Ajouter à l’agenda
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Collaborateurs</p>
            <h3 className="text-lg font-semibold text-[var(--text)]">Synthèse des propositions</h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-[color:rgba(11,11,11,0.6)]">
            <span>Compa-ratio moyen : <strong className="text-[var(--brand)]">1,03</strong></span>
            <span>|</span>
            <span>Budget approuvé : <strong className="text-[var(--brand)]">82%</strong></span>
          </div>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e2e7e2]">
          <table className="min-w-full divide-y divide-[#e2e7e2] text-sm">
            <thead className="bg-[#f8faf8] text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
              <tr>
                <th className="px-5 py-3">Collaborateur</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Compa-ratio</th>
                <th className="px-5 py-3">Augmentation fixe</th>
                <th className="px-5 py-3">Augmentation variable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef1ee] bg-white">
              {collaborators.map((collaborator) => (
                <tr key={collaborator.id} className="align-middle text-[color:rgba(11,11,11,0.75)]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)]/10 font-semibold text-[var(--brand)]">
                        {collaborator.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--text)]">{collaborator.name}</p>
                        <p className="text-xs text-[color:rgba(11,11,11,0.55)]">{collaborator.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[collaborator.status] ?? "ring-gray-200 text-gray-700 bg-gray-50"}`}
                    >
                      {collaborator.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[var(--text)]">
                    {collaborator.compaRatio?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-[#eef3ff] px-2 py-1 font-semibold text-[#386fe5]">
                        {formatPercent(collaborator.increaseFixedPercent)}
                      </span>
                      <span className="rounded-full border border-[#e2e7e2] px-3 py-1">
                        {formatCurrency(collaborator.increaseFixedValue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-[#fdf5f4] px-2 py-1 font-semibold text-[#d66a5e]">
                        {formatPercent(collaborator.increaseVariablePercent)}
                      </span>
                      <span className="rounded-full border border-[#e2e7e2] px-3 py-1">
                        {formatCurrency(collaborator.increaseVariableValue)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Compétences équipe</p>
              <h3 className="text-lg font-semibold text-[var(--text)]">Cartographie des attentes</h3>
            </div>
            <button className="rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-semibold text-[color:rgba(11,11,11,0.6)] hover:bg-[#f2f5f2]">
              Ajouter un niveau
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e2]">
            <table className="min-w-full divide-y divide-[#e2e7e2] text-sm">
              <thead className="bg-[#f7f9f7] text-left text-xs font-semibold uppercase tracking-wide text-[color:rgba(11,11,11,0.45)]">
                <tr>
                  <th className="px-4 py-3">Compétence</th>
                  <th className="px-4 py-3 text-center">En dessous</th>
                  <th className="px-4 py-3 text-center">Maîtrisée</th>
                  <th className="px-4 py-3 text-center">Au-dessus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef1ee] bg-white">
                {timeline.map((row) => (
                  <tr key={row.label} className="text-[color:rgba(11,11,11,0.7)]">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-[#ffe8e8] px-2 py-1 text-xs font-semibold text-[#d66a5e]">
                        {row.below}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-[#e3f7ea] px-2 py-1 text-xs font-semibold text-[var(--brand)]">
                        {row.mastered}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-xs font-semibold text-[#386fe5]">
                        {row.above}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Entretiens</p>
                <h3 className="text-lg font-semibold text-[var(--text)]">Modèles & plan d’action</h3>
              </div>
              <button className="rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-semibold text-[color:rgba(11,11,11,0.6)] hover:bg-[#f2f5f2]">
                Ajouter un modèle
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
              <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] px-4 py-3">
                <p className="font-semibold text-[var(--text)]">Entretien annuel Product Manager</p>
                <p className="text-xs text-[color:rgba(11,11,11,0.5)]">Complété à 56 %, enregistrement automatique activé.</p>
              </div>
              <div className="rounded-2xl border border-[#e2e7e2] bg-[#fff7f0] px-4 py-3">
                <p className="font-semibold text-[var(--text)]">Entretien de progression Sales</p>
                <p className="text-xs text-[color:rgba(11,11,11,0.5)]">5 questions restantes · Deadline 22 mars.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:rgba(11,11,11,0.5)]">Objectifs</p>
                <h3 className="text-lg font-semibold text-[var(--text)]">Alignement équipe</h3>
              </div>
              <button className="rounded-full border border-[#e2e7e2] px-3 py-1.5 text-xs font-semibold text-[color:rgba(11,11,11,0.6)] hover:bg-[#f2f5f2]">
                Voir tous les OKR
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[color:rgba(11,11,11,0.7)]">
              <div className="rounded-2xl border border-[#e2e7e2] bg-[#f4f8ff] p-4">
                <p className="font-semibold text-[var(--text)]">Réduire le churn trimestriel sous 5 %</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
                  <span className="block h-full w-[78%] rounded-full bg-[#6ea9ff]" />
                </div>
                <p className="mt-2 text-xs text-[#386fe5]">Avancement global 78 %</p>
              </div>
              <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4">
                <p className="font-semibold text-[var(--text)]">Déployer la nouvelle grille métiers CS · Avril</p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/70">
                  <span className="block h-full w-[42%] rounded-full bg-[var(--brand)]" />
                </div>
                <p className="mt-2 text-xs text-[var(--brand)]">Ateliers managers programmés la semaine prochaine</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


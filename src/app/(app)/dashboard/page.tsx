export default function DashboardPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-muted text-center text-[color:rgba(11,11,11,0.7)]">
      <div className="rounded-[var(--radius)] border border-dashed border-[color:rgba(9,82,40,0.25)] bg-white p-10 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Espace applicatif Leaft</h1>
        <p className="mt-4 text-sm leading-relaxed">
          Le tableau de bord RH/Managers arrivera ici : organigramme, compa-ratio, statistiques et entretiens. Nous
          connecterons Supabase & Clerk pour sécuriser l’accès.
        </p>
      </div>
    </div>
  );
}


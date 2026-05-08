import Link from "next/link";
import Image from "next/image";
import { BillingCta } from "./billing-cta";

const CARD = "rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]";

export default function AbonnementPage() {
  return (
    <div className="mx-auto max-w-3xl py-10">
      <div className={CARD}>
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-dark.png" alt="Leaft" width={110} height={44} />
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
            Abonnement requis
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">
          Votre abonnement n’est pas actif
        </h1>
        <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.7)]">
          L’accès au dashboard RH est temporairement limité. Pour rétablir l’accès, veuillez régulariser votre abonnement.
        </p>

        <BillingCta />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-sm text-[color:rgba(11,11,11,0.7)]">
            <p className="font-semibold text-[var(--text)]">Pourquoi je vois cette page ?</p>
            <p className="mt-1">
              Votre abonnement Stripe est annulé, expiré ou en échec de paiement.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e2e7e2] bg-[#f8faf8] p-4 text-sm text-[color:rgba(11,11,11,0.7)]">
            <p className="font-semibold text-[var(--text)]">Besoin d’aide ?</p>
            <p className="mt-1">
              Contactez-nous à{" "}
              <a className="font-semibold text-[var(--brand)]" href="mailto:info@leaft.io">info@leaft.io</a>.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f2f5f2]"
          >
            Retour au site
          </Link>
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f2f5f2]"
          >
            Réessayer
          </Link>
        </div>
      </div>
    </div>
  );
}


import Image from "next/image";

export function HeroDashboardPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[28px] bg-[color:rgba(9,82,40,0.12)] blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border border-[#dfe5df] bg-white shadow-[0_24px_64px_rgba(9,82,40,0.16)] sm:rounded-3xl">
        {/* Barre navigateur */}
        <div className="flex items-center gap-3 border-b border-[#e8ece8] bg-[#f7f9f7] px-4 py-3">
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs text-[color:rgba(11,11,11,0.55)]">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-[color:rgba(11,11,11,0.35)]"
                aria-hidden
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="truncate">leaft.io/dashboard</span>
            </div>
          </div>
          <div className="hidden w-[52px] shrink-0 sm:block" aria-hidden />
        </div>

        {/* Capture dashboard — 16:9 */}
        <div className="relative bg-[#f3f5f3]">
          <Image
            src="/marketing/hero-dashboard.png"
            alt="Aperçu du dashboard Leaft — pilotage des talents, grilles salariales et statistiques"
            width={1024}
            height={569}
            priority
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 600px"
          />
        </div>
      </div>
    </div>
  );
}

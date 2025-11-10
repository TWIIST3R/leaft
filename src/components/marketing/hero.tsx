import Link from "next/link";
import { ReactNode } from "react";

type Cta = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type HeroProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  ctas?: Cta[];
  align?: "start" | "center";
  tone?: "light" | "dark";
};

export function Hero({ eyebrow, title, description, ctas = [], align = "start", tone = "light" }: HeroProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";
  const isDark = tone === "dark";
  const titleColor = isDark ? "text-white" : "text-[var(--text)]";
  const descriptionColor = isDark ? "text-white/80" : "text-[color:rgba(11,11,11,0.72)]";
  const eyebrowClasses = isDark
    ? "inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium text-white shadow-[var(--shadow)]"
    : "inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]";

  return (
    <section className={`flex flex-col gap-6 ${alignment}`}>
      {eyebrow ? <span className={eyebrowClasses}>{eyebrow}</span> : null}
      <div className="space-y-4">
        <h1 className={`text-balance text-4xl font-semibold leading-tight ${titleColor} sm:text-5xl`}>{title}</h1>
        {description ? <p className={`max-w-2xl text-pretty text-lg ${descriptionColor}`}>{description}</p> : null}
      </div>

      {ctas.length > 0 ? (
        <div
          className={`flex flex-col gap-3 ${align === "center" ? "sm:flex-row sm:justify-center" : "sm:flex-row"}`}
        >
          {ctas.map(({ href, label, variant = "primary" }) => {
            const base =
              "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
            if (variant === "primary") {
              const classes = isDark
                ? "bg-[var(--brand)] text-white hover:brightness-120 focus-visible:outline-white/60 border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.3)]"
                : "bg-[var(--brand)] text-white hover:brightness-110 focus-visible:outline-[var(--brand)]/40";
              return (
                <Link key={href} href={href} className={`${base} ${classes}`}>
                  {label}
                </Link>
              );
            }
            const classes = isDark
              ? "border border-white/40 bg-transparent text-white hover:bg-white/10 focus-visible:outline-white/60"
              : "border border-border bg-white text-[var(--text)] hover:bg-muted focus-visible:outline-[var(--brand)]/40";
            return (
              <Link key={href} href={href} className={`${base} ${classes}`}>
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}


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
};

export function Hero({ eyebrow, title, description, ctas = [], align = "start" }: HeroProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <section className={`flex flex-col gap-6 ${alignment}`}>
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-[var(--shadow)]">
          {eyebrow}
        </span>
      ) : null}
      <div className="space-y-4">
        <h1 className="text-balance text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-pretty text-lg text-[color:rgba(11,11,11,0.72)]">{description}</p>
        ) : null}
      </div>

      {ctas.length > 0 ? (
        <div
          className={`flex flex-col gap-3 ${align === "center" ? "sm:flex-row sm:justify-center" : "sm:flex-row"}`}
        >
          {ctas.map(({ href, label, variant = "primary" }) => {
            const base = "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold transition";
            if (variant === "primary") {
              return (
                <Link key={href} href={href} className={`${base} bg-[var(--brand)] text-white hover:brightness-110`}>
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`${base} border border-border bg-white text-[var(--text)] hover:bg-muted`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}


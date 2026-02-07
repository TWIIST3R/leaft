"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Routes where header and footer should be hidden (public header/footer; app has its own layout)
const HIDDEN_HEADER_ROUTES = ["/onboarding", "/sign-in", "/sign-up", "/dashboard"];

export function ConditionalLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldHideHeader = HIDDEN_HEADER_ROUTES.some((route) => pathname?.startsWith(route));

  return (
    <div className="flex min-h-screen flex-col">
      {!shouldHideHeader && <SiteHeader />}
      <div className="grow">{children}</div>
      {!shouldHideHeader && <SiteFooter />}
    </div>
  );
}

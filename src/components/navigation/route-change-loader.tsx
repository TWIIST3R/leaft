"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type NavLoadingContextValue = {
  startNavigation: () => void;
};

const NavLoadingContext = createContext<NavLoadingContextValue | null>(null);

export function useNavLoading() {
  const ctx = useContext(NavLoadingContext);
  return ctx ?? { startNavigation: () => {} };
}

export function RouteChangeLoaderProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    setLoading(true);
  }, []);

  return (
    <NavLoadingContext.Provider value={{ startNavigation }}>
      {loading && (
        <>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[300] h-0.5 bg-[var(--brand)]/20">
            <div className="h-full w-full animate-pulse bg-[var(--brand)]" />
          </div>
          <div
            className="pointer-events-none fixed inset-0 z-[250] flex items-center justify-center bg-white/30 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#e2e7e2] bg-white px-6 py-4 shadow-lg">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              <p className="text-sm font-medium text-[var(--text)]">Chargement…</p>
            </div>
          </div>
        </>
      )}
      {children}
    </NavLoadingContext.Provider>
  );
}

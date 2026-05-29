"use client";

import { RouteChangeLoaderProvider } from "@/components/navigation/route-change-loader";

export function DashboardMain({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RouteChangeLoaderProvider>
      <main className={className}>{children}</main>
    </RouteChangeLoaderProvider>
  );
}

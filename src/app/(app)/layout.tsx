import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Placeholder for app shell (sidebar, topbar, etc.) */}
      {children}
    </div>
  );
}


"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Settings = {
  name: string;
  salary_transparency_enabled: boolean;
  logo_url: string | null;
};

export function ParametresClient({ initialSettings }: { initialSettings: Settings }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [salaryTransparency, setSalaryTransparency] = useState(initialSettings.salary_transparency_enabled);
  const [orgName, setOrgName] = useState(initialSettings.name);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleTransparencyToggle(checked: boolean) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary_transparency_enabled: checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSalaryTransparency(checked);
      setMessage({
        type: "ok",
        text: checked
          ? "Transparence salariale activée : les managers et talents pourront consulter les rémunérations."
          : "Transparence salariale désactivée.",
      });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!orgName.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMessage({ type: "ok", text: "Nom de l'entreprise mis à jour." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/organization/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setLogoUrl(data.logo_url);
      setMessage({ type: "ok", text: "Logo mis à jour." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    setUploadingLogo(true);
    setMessage(null);
    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo_url: null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setLogoUrl(null);
      setMessage({ type: "ok", text: "Logo supprimé." });
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setUploadingLogo(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-[#e2e7e2] bg-white px-4 py-2.5 text-sm text-[var(--text)] transition focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50";

  return (
    <div className="space-y-10">
      {message && (
        <p className={`rounded-xl px-4 py-3 text-sm ${message.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Entreprise</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Nom et identité visuelle de votre organisation.
        </p>
        <div className="mt-5 space-y-5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text)]">Nom de l&apos;entreprise</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputCls + " mt-1"}
                disabled={loading}
                placeholder="Ex: Acme Corp"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveName}
              disabled={loading || !orgName.trim()}
              className="cursor-pointer rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "..." : "Enregistrer"}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)]">Logo</label>
            <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.5)]">PNG, JPG, WebP ou SVG, max 2 Mo.</p>
            <div className="mt-3 flex items-center gap-4">
              {logoUrl ? (
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-[#e2e7e2]">
                  <Image src={logoUrl} alt="Logo" fill className="object-contain" unoptimized />
                </div>
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-[#e2e7e2] bg-[#f8faf8] text-xl font-semibold text-[color:rgba(11,11,11,0.3)]">
                  {orgName.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="cursor-pointer rounded-xl border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[#f8faf8] disabled:opacity-50"
                >
                  {uploadingLogo ? "Upload..." : logoUrl ? "Changer le logo" : "Importer un logo"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="cursor-pointer text-left text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Supprimer le logo
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <h2 className="text-lg font-semibold text-[var(--text)]">Transparence salariale</h2>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Conformité avec la loi sur la transparence des rémunérations en France. Lorsque cette option est activée, les comptes <strong>Manager</strong> et <strong>Talent</strong> (employé) peuvent consulter l&apos;ensemble des salaires de l&apos;entreprise.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={salaryTransparency}
            disabled={loading}
            onClick={() => handleTransparencyToggle(!salaryTransparency)}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/30 focus:ring-offset-2 disabled:opacity-50 ${
              salaryTransparency ? "bg-[var(--brand)]" : "bg-[#e2e7e2]"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                salaryTransparency ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium text-[var(--text)]">
            {salaryTransparency ? "Transparence activée" : "Transparence désactivée"}
          </span>
        </div>
      </section>
    </div>
  );
}

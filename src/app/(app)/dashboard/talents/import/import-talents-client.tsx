"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

type BillingPreview = {
  previousSeatCount: number;
  newSeatCount: number;
  prorationAmountCents: number;
  newMonthlyAmountCents: number;
  nextBillingDate: string | null;
};

export function ImportTalentsClient() {
  const router = useRouter();
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBulkInfoModal, setShowBulkInfoModal] = useState(false);
  const [previewData, setPreviewData] = useState<{
    validCount: number;
    totalRows: number;
    errors: { row: number; message: string }[];
    billingPreview: BillingPreview | null;
  } | null>(null);
  const [result, setResult] = useState<{
    created: number;
    errors: { row: number; message: string }[];
    billingInfo?: { previousSeats: number; newSeats: number; prorationCents: number; newMonthlyCents: number };
  } | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const onBulkDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(false);
    const f = e.dataTransfer.files?.[0];
    const name = (f?.name || "").toLowerCase();
    if (f && (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls"))) {
      setBulkFile(f);
      setResult(null);
      setPreviewData(null);
    }
  }, []);

  const onBulkDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(true);
  }, []);

  const onBulkDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBulkDragOver(false);
  }, []);

  async function handlePreview() {
    if (!bulkFile) return;
    setPreviewLoading(true);
    setPreviewData(null);
    setShowConfirmModal(false);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const res = await fetch("/api/employees/bulk-preview", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse du fichier");
      setPreviewData({
        validCount: data.validCount ?? 0,
        totalRows: data.totalRows ?? 0,
        errors: data.errors ?? [],
        billingPreview: data.billingPreview ?? null,
      });
      setShowConfirmModal(true);
    } catch (err) {
      setPreviewData({
        validCount: 0,
        totalRows: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : "Erreur" }],
        billingPreview: null,
      });
      setShowConfirmModal(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleConfirmImport() {
    if (!bulkFile || !previewData || previewData.validCount === 0) {
      setShowConfirmModal(false);
      return;
    }
    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const res = await fetch("/api/employees/bulk", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur import");
      setResult({ created: data.created, errors: data.errors ?? [], billingInfo: data.billingInfo });
      setShowConfirmModal(false);
      setBulkFile(null);
      setPreviewData(null);
      router.refresh();
    } catch (err) {
      setResult({
        created: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : "Erreur" }],
      });
      setShowConfirmModal(false);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-[#e2e7e2] bg-white p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
      <div className="flex items-center gap-2">
        <h2 className="border-l-4 border-[var(--brand)] pl-4 text-lg font-semibold text-[var(--text)]">Import par fichier (CSV ou Excel)</h2>
        <button
          type="button"
          onClick={() => setShowBulkInfoModal(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand)] transition hover:bg-[var(--brand)]/20"
          title="Format attendu et colonnes"
          aria-label="Informations sur le format du fichier"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        </button>
      </div>
      <p className="mt-2 text-sm text-[color:rgba(11,11,11,0.65)]">
        Téléchargez le modèle (CSV ou Excel), remplissez-le, puis déposez votre fichier. Vous verrez un récapitulatif et le montant à payer avant validation.
      </p>
      <div
        onDrop={onBulkDrop}
        onDragOver={onBulkDragOver}
        onDragLeave={onBulkDragLeave}
        className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition ${bulkDragOver ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[#e2e7e2] bg-[#f8faf8]"}`}
      >
        <input
          ref={bulkInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setBulkFile(f);
              setResult(null);
              setPreviewData(null);
            }
            e.target.value = "";
          }}
        />
        {bulkFile ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-medium text-[var(--text)]">{bulkFile.name}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bulkInputRef.current?.click()}
                disabled={previewLoading || bulkLoading}
                className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8] disabled:opacity-50"
              >
                Changer
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading || bulkLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {(previewLoading || bulkLoading) ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {bulkLoading ? "Import en cours..." : "Analyse..."}
                  </>
                ) : (
                  "Vérifier et importer"
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[color:rgba(11,11,11,0.65)]">Glissez-déposez un fichier .csv ou .xlsx ici</p>
            <button
              type="button"
              onClick={() => bulkInputRef.current?.click()}
              className="mt-3 cursor-pointer rounded-full bg-[var(--brand)]/10 px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)]/20"
            >
              Ou parcourir
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-2 rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
          <p className="font-medium text-[var(--text)]">
            {result.created} talent{result.created !== 1 ? "s" : ""} créé{result.created !== 1 ? "s" : ""}.
            {result.errors.length > 0 && ` ${result.errors.length} erreur(s) sur certaines lignes.`}
          </p>
          {result.billingInfo && (
            <ul className="list-inside list-disc text-sm text-[color:rgba(11,11,11,0.8)]">
              <li>Abonnement : {result.billingInfo.previousSeats} → {result.billingInfo.newSeats} talents</li>
              <li>Montant au prorata facturé : {(result.billingInfo.prorationCents / 100).toFixed(2).replace(".", ",")} €</li>
            </ul>
          )}
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-700">
              {result.errors.slice(0, 10).map((e, i) => (
                <li key={i}>Ligne {e.row} : {e.message}</li>
              ))}
              {result.errors.length > 10 && <li>… et {result.errors.length - 10} autre(s) erreur(s)</li>}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.open("/api/employees/template", "_blank")}
          className="cursor-pointer rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10"
        >
          Télécharger le modèle CSV
        </button>
        <button
          type="button"
          onClick={() => window.open("/api/employees/template?format=xlsx", "_blank")}
          className="cursor-pointer rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10"
        >
          Télécharger le modèle Excel
        </button>
        <Link href="/dashboard/talents" className="cursor-pointer rounded-full border border-[#e2e7e2] px-4 py-2 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8]">
          Retour aux talents
        </Link>
      </div>

      <Modal
        open={showConfirmModal}
        onClose={() => !bulkLoading && setShowConfirmModal(false)}
        title="Vérification avant import"
        footer={
          previewData && previewData.validCount > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={bulkLoading}
                className="cursor-pointer rounded-full border border-[#e2e7e2] px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[#f8faf8] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={bulkLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Import en cours...
                  </>
                ) : (
                  "Confirmer l'import et facturer"
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="cursor-pointer rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            >
              OK
            </button>
          )
        }
      >
        {previewData && (
          <div className="space-y-4 text-sm text-[var(--text)]">
            <p>
              <strong>{previewData.totalRows}</strong> ligne(s) dans le fichier.
              <strong className="text-green-700"> {previewData.validCount} talent(s) seront ajoutés.</strong>
              {previewData.errors.length > 0 && (
                <span className="text-amber-700"> {previewData.errors.length} ligne(s) en erreur (ignorées).</span>
              )}
            </p>
            {previewData.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
                {previewData.errors.slice(0, 15).map((e, i) => (
                  <li key={i}>Ligne {e.row} : {e.message}</li>
                ))}
                {previewData.errors.length > 15 && <li>… et {previewData.errors.length - 15} autre(s)</li>}
              </ul>
            )}
            {previewData.validCount > 0 && previewData.billingPreview && (
              <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4">
                <p className="font-semibold text-[var(--text)]">Ajustement de l'abonnement</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[color:rgba(11,11,11,0.8)]">
                  <li>Talents actuels : <strong>{previewData.billingPreview.previousSeatCount}</strong></li>
                  <li>Après import : <strong>{previewData.billingPreview.newSeatCount}</strong> talents</li>
                  <li>Nouveau montant mensuel : <strong>{(previewData.billingPreview.newMonthlyAmountCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
                  <li>Montant au prorata (facturé maintenant) : <strong>{(previewData.billingPreview.prorationAmountCents / 100).toFixed(2).replace(".", ",")} €</strong></li>
                </ul>
                <p className="mt-2 text-xs text-[color:rgba(11,11,11,0.6)]">Un email récapitulatif vous sera envoyé après validation.</p>
              </div>
            )}
            {previewData.validCount === 0 && (
              <p className="text-amber-700">Aucune ligne valide à importer. Corrigez les erreurs dans votre fichier ou téléchargez le modèle.</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={showBulkInfoModal} onClose={() => setShowBulkInfoModal(false)} title="Format du fichier d'import (CSV ou Excel)">
        <div className="space-y-4 text-sm text-[var(--text)]">
          <p>
            Formats acceptés : CSV (.csv) ou Excel (.xlsx, .xls). Première ligne = en-têtes de colonnes (comme dans le modèle). Lignes suivantes = un talent par ligne. CSV : séparateur point-virgule (;) ou virgule.
          </p>
          <p className="font-semibold">Colonnes attendues :</p>
          <ul className="list-inside space-y-1 text-[color:rgba(11,11,11,0.8)]">
            <li><strong>Prénom</strong>, <strong>Nom</strong>, <strong>Email</strong>, <strong>Poste</strong>, <strong>Date d&apos;entrée</strong> (obligatoires). Date : AAAA-MM-JJ.</li>
            <li>Genre, Date de naissance, Localisation, Département, Niveau, Management, Ancienneté, Ajustement annuel, Manager, Est manager.</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => { window.open("/api/employees/template", "_blank"); setShowBulkInfoModal(false); }}
              className="cursor-pointer rounded-full border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)]/10"
            >
              Télécharger le modèle CSV
            </button>
            <button
              type="button"
              onClick={() => { window.open("/api/employees/template?format=xlsx", "_blank"); setShowBulkInfoModal(false); }}
              className="cursor-pointer rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Télécharger le modèle Excel
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

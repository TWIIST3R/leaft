import { ImportTalentsClient } from "./import-talents-client";

export default function ImportTalentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Importer plusieurs talents</h1>
        <p className="mt-1 text-sm text-[color:rgba(11,11,11,0.65)]">
          Téléchargez le modèle CSV ou Excel, remplissez-le, puis déposez votre fichier pour ajouter plusieurs talents en une fois.
        </p>
      </div>
      <ImportTalentsClient />
    </div>
  );
}

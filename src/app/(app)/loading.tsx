export default function AppLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent"
          aria-hidden
        />
        <p className="text-sm text-[color:rgba(11,11,11,0.6)]">Chargement...</p>
      </div>
    </div>
  );
}

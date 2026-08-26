export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-muted-foreground shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#008A4B]/25 border-t-[#008A4B]" aria-hidden="true" />
        Loading page...
      </div>
    </div>
  );
}

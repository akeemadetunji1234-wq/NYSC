type CorperMarchLoaderProps = {
  label?: string;
};

/**
 * Animated NYSC corps members used while marketplace data is loading.
 */
export function CorperMarchLoader({
  label = "Loading properties...",
}: CorperMarchLoaderProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3" role="status" aria-live="polite" aria-label={label}>
      <img
        src="/NYSC.gif"
        alt="NYSC corps members walking"
        width={200}
        height={120}
        className="h-auto w-[min(200px,70vw)] object-contain"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

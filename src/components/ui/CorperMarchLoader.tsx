type CorperMarchLoaderProps = {
  label?: string;
};

/**
 * A lightweight CSS loader for pages that are waiting on live marketplace data.
 * The figures translate across the track while their arms and legs alternate,
 * making the motion read as marching rather than shaking.
 */
export function CorperMarchLoader({
  label = "Loading properties...",
}: CorperMarchLoaderProps) {
  return (
    <div className="corper-march-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="corper-march-loader__track" aria-hidden="true">
        {[0, 1, 2].map((figure) => (
          <span className="corper-march-loader__figure" key={figure}>
            <span className="corper-march-loader__head" />
            <span className="corper-march-loader__body" />
            <span className="corper-march-loader__arm corper-march-loader__arm--front" />
            <span className="corper-march-loader__arm corper-march-loader__arm--back" />
            <span className="corper-march-loader__leg corper-march-loader__leg--front" />
            <span className="corper-march-loader__leg corper-march-loader__leg--back" />
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

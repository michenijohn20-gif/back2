export function SkeletonPulse({ className = "" }) {
  return <div className={`animate-pulse bg-[#E5E7EB] rounded ${className}`} />;
}

export function ProductGridSkeleton({ cols = 4, label }) {
  const grid =
    cols === 3 ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-2 xl:grid-cols-4";
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {label && (
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-body shadow-card">
          <span className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <span>{label}</span>
        </div>
      )}
      <div className={`grid gap-3 sm:gap-4 ${grid}`}>
        {Array.from({ length: cols === 3 ? 6 : 8 }).map((_, i) => (
          <div key={i} className="border border-border rounded bg-white shadow-card overflow-hidden">
            <SkeletonPulse className="aspect-square sm:aspect-[4/3] w-full rounded-t" />
            <div className="p-2.5 sm:p-4 space-y-2">
              <SkeletonPulse className="h-4 w-16 sm:w-20" />
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-4" role="status" aria-live="polite">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-body shadow-card">
        <span className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <span>Loading product...</span>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
        <SkeletonPulse className="aspect-square w-full rounded" />
        <div className="space-y-3">
          <SkeletonPulse className="h-5 w-32" />
          <SkeletonPulse className="h-8 w-full" />
          <SkeletonPulse className="h-10 w-48" />
          <SkeletonPulse className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}

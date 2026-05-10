export function SkeletonPulse({ className = "" }) {
  return <div className={`animate-pulse bg-surface rounded ${className}`} />;
}

export function ProductGridSkeleton({ cols = 4 }) {
  const grid =
    cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";
  return (
    <div className={`grid gap-4 ${grid}`}>
      {Array.from({ length: cols === 3 ? 6 : 8 }).map((_, i) => (
        <div key={i} className="border border-border rounded bg-white shadow-card overflow-hidden">
          <SkeletonPulse className="aspect-[4/3] w-full rounded-t" />
          <div className="p-4 space-y-2">
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8 animate-pulse">
      <SkeletonPulse className="aspect-square w-full rounded" />
      <div className="space-y-3">
        <SkeletonPulse className="h-5 w-32" />
        <SkeletonPulse className="h-8 w-full" />
        <SkeletonPulse className="h-10 w-48" />
        <SkeletonPulse className="h-28 w-full" />
      </div>
    </div>
  );
}

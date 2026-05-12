import { SkeletonPulse } from "./SkeletonGrid.jsx";

export function Spinner({ className = "h-5 w-5", tone = "primary" }) {
  const color = tone === "light" ? "border-white/35 border-t-white" : "border-primary/20 border-t-primary";
  return <span className={`${className} inline-block rounded-full border-2 ${color} animate-spin`} />;
}

export function LoadingState({ label = "Loading...", compact = false, className = "" }) {
  return (
    <div
      className={`flex ${compact ? "items-center gap-2" : "min-h-40 flex-col items-center justify-center gap-3"} text-sm text-body ${className}`}
      role="status"
      aria-live="polite"
    >
      <Spinner className={compact ? "h-4 w-4" : "h-7 w-7"} />
      <span className="font-medium">{label}</span>
      {!compact && (
        <div className="h-1 w-28 overflow-hidden rounded-full bg-surface">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-primary/50" />
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 5, label = "Loading..." }) {
  return (
    <div className="border border-border rounded bg-white shadow-card overflow-hidden" role="status" aria-live="polite">
      <div className="border-b border-border px-4 py-3">
        <LoadingState label={label} compact />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid gap-4 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, col) => (
              <SkeletonPulse key={col} className={col === 0 ? "h-4 w-24" : "h-4 w-full"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

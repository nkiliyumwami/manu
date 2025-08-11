export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton h-3 w-full"></div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return <div className="card p-4"><div className="skeleton h-24 w-full"></div></div>
}
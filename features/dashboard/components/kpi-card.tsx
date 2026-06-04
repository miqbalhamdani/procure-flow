type KpiCardProps = {
  label: string;
  value: number;
  icon: string;
  iconContainerClassName: string;
  iconClassName: string;
  trendLabel?: string;
};

export function KpiCard({
  label,
  value,
  icon,
  iconContainerClassName,
  iconClassName,
  trendLabel,
}: KpiCardProps) {
  return (
    <article className="group rounded-xl bg-surface-container-lowest p-6 transition-all hover:shadow-xl hover:shadow-primary/5">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-lg p-2 transition-colors ${iconContainerClassName}`}>
          <span className={`material-symbols-outlined ${iconClassName}`}>{icon}</span>
        </div>
        {trendLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            {trendLabel}
          </span>
        ) : null}
      </div>
      <p className="mb-1 text-sm font-medium text-secondary">{label}</p>
      <p className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
        {value.toLocaleString()}
      </p>
    </article>
  );
}

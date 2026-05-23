import { getInitials } from "@/lib/utils";

interface PartyCardProps {
  title: string;
  name: string | null;
  country: string | null;
  address: string | null;
  icon: string;
  accentClass: string;
  railClass: string;
  chipClass: string;
  iconClass: string;
}

export function PartyCard({
  title,
  name,
  country,
  address,
  icon,
  accentClass,
  railClass,
  chipClass,
  iconClass,
}: PartyCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-outline-variant/10 bg-gradient-to-br ${accentClass} p-6 shadow-sm`}
    >
      <div className={`absolute inset-y-6 left-0 w-1.5 rounded-r-full ${railClass}`} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
            {title}
          </p>
          <h4 className="mt-3 font-headline text-2xl font-bold tracking-tight text-on-background">
            {name ?? "—"}
          </h4>
        </div>

        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <span className="material-symbols-outlined text-[24px] leading-none">{icon}</span>
        </div>
      </div>

      <div className="mt-5">
        <span
          className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${chipClass}`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-container-lowest/85 text-[11px] font-black text-on-background">
            {getInitials(name)}
          </span>
          <span className="truncate">{country ?? "Country not provided"}</span>
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-container-lowest/85 p-4 ring-1 ring-outline-variant/10">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
          <span className="material-symbols-outlined text-sm leading-none">location_on</span>
          Address
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-on-background">
          {address ?? "No address provided."}
        </p>
      </div>
    </section>
  );
}

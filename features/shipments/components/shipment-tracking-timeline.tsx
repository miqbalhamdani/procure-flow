"use client";

import type { TrackingEvent } from "@/features/shipments/types";

interface ShipmentTrackingTimelineProps {
  events: TrackingEvent[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
};

const STATUS_ICONS: Record<string, string> = {
  pending: "schedule",
  in_transit: "local_shipping",
  delivered: "inventory",
};

export function ShipmentTrackingTimeline({ events }: ShipmentTrackingTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="material-symbols-outlined text-[40px] leading-none text-on-surface-variant/30">
          timeline
        </span>
        <p className="mt-3 text-sm text-on-surface-variant/60">No tracking events yet.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical stalk */}
      {events.length > 1 && (
        <div className="absolute left-5 top-10 bottom-4 w-0.5 bg-[#eaddff]" />
      )}

      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon bubble */}
            <div className="relative z-10 flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined text-[18px] leading-none text-primary">
                {STATUS_ICONS[event.status] ?? "radio_button_checked"}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-on-background">
                  {STATUS_LABELS[event.status] ?? event.status}
                </p>
                {index === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Latest
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-on-surface-variant">
                {new Date(event.created_at).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {event.performed_by_name && (
                  <span> · {event.performed_by_name}</span>
                )}
              </p>

              {event.location && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] leading-none text-on-surface-variant/60">
                    location_on
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {event.location}
                  </span>
                </div>
              )}

              {event.note && (
                <p className="mt-1.5 text-xs text-on-surface-variant/80 italic">{event.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

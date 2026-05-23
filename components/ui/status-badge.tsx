"use client";

type StatusConfig = {
  label: string;
  className: string;
  dot: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  // Purchase Order statuses
  draft: {
    label: "Draft",
    className: "bg-surface-container text-on-surface-variant",
    dot: "bg-on-surface-variant/50",
  },
  submitted: {
    label: "Submitted",
    className: "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant",
    dot: "bg-tertiary",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  rejected: {
    label: "Rejected",
    className: "bg-error-container/40 text-on-error-container",
    dot: "bg-error",
  },
  closed: {
    label: "Closed",
    className: "bg-surface-container-high text-on-surface-variant",
    dot: "bg-on-surface-variant/30",
  },
  // Shipment statuses
  pending: {
    label: "Pending",
    className: "bg-surface-container text-on-surface-variant",
    dot: "bg-on-surface-variant/50",
  },
  in_transit: {
    label: "In Transit",
    className: "bg-tertiary-fixed/40 text-on-tertiary-fixed-variant",
    dot: "bg-tertiary",
  },
  delivered: {
    label: "Delivered",
    className: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-surface-container text-on-surface-variant",
    dot: "bg-on-surface-variant/50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.className} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

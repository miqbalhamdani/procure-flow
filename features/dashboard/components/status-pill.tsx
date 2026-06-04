type StatusPillProps = {
  label: string;
  className: string;
};

export function StatusPill({ label, className }: StatusPillProps) {
  return (
    <span className={`mt-2 rounded px-2 py-0.5 text-[10px] font-bold ${className}`}>
      {label}
    </span>
  );
}

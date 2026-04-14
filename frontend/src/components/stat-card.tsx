import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  helper
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <section className="card stat-card">
      <div className="stat-card__value">{value}</div>
      <div>
        <div className="stat-card__label">{label}</div>
        {helper ? <div className="stat-card__helper">{helper}</div> : null}
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

type StatCardTone = "neutral" | "success" | "warning" | "info";

export function StatCard({
  label,
  value,
  helper,
  tone = "neutral"
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  tone?: StatCardTone;
}) {
  return (
    <section className={`card stat-card stat-card--${tone}`}>
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
      {helper ? <div className="stat-card__helper">{helper}</div> : null}
    </section>
  );
}

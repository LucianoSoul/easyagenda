export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return <div className="card empty-state">{label}</div>;
}

type OverflowAction = {
  label: string;
  onSelect: () => void;
  tone?: "default" | "danger";
};

export function OverflowMenu({
  actions,
  label = "Ações"
}: {
  actions: OverflowAction[];
  label?: string;
}) {
  return (
    <details className="overflow-menu">
      <summary aria-label={label} className="overflow-menu__trigger">
        ⋮
      </summary>

      <div className="overflow-menu__panel">
        {actions.map((action) => (
          <button
            className={`overflow-menu__item${
              action.tone === "danger" ? " overflow-menu__item--danger" : ""
            }`}
            key={action.label}
            onClick={action.onSelect}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
    </details>
  );
}

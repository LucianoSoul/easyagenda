export function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="stack-lg">
      <section className="page-hero">
        <div className="stack-sm">
          <div className="eyebrow">Módulo em evolução</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <section className="card empty-state">
        Esta área permanece visível para sustentar a arquitetura do produto e a navegação da
        plataforma. O fluxo funcional completo será incorporado em uma próxima etapa.
      </section>
    </div>
  );
}

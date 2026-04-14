export function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="stack-lg">
      <div className="page-hero">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <section className="card empty-state">
        Esta área fica visível na navegação para sustentar a arquitetura do produto, mas ainda
        não entrou no escopo funcional deste MVP beta.
      </section>
    </div>
  );
}

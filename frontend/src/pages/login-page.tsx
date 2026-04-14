import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth";

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("luciano.cinnamon@gmail.com");
  const [password, setPassword] = useState("CodexRefund123!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      const target = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(target, { replace: true });
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Nao foi possivel iniciar sessao.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card">
        <div className="brand brand--large">
          <div className="brand__mark">EA</div>
          <div>
            <div className="brand__title">Easy Agenda</div>
            <div className="brand__subtitle">Painel profissional beta</div>
          </div>
        </div>

        <div className="stack-sm">
          <h1>Entrar</h1>
          <p>Use o login de desenvolvimento para acessar o fluxo operacional do profissional.</p>
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="field">
            <span>E-mail</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <button className="button button--block" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
      </section>
    </div>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
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
          : "Nao foi possivel iniciar a sessao.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-card stack-lg">
        <div className="brand brand--large">
          <div className="brand__mark">EA</div>
          <div>
            <div className="brand__title">Easy Agenda</div>
            <div className="brand__subtitle auth-card__subtitle">
              Plataforma profissional para agenda clínica
            </div>
          </div>
        </div>

        <div className="stack-sm">
          <div className="eyebrow">Acesso profissional</div>
          <h1>Entre em um ambiente mais sólido, claro e confiável.</h1>
          <p>
            A entrada foi refinada para transmitir segurança e organização. Use suas credenciais
            para acessar a operação da clínica.
          </p>
        </div>

        <div className="auth-card__support">
          <div>
            <span className="summary-label">Acesso principal</span>
            <strong>E-mail e senha</strong>
            <p>Fluxo ativo e pronto para uso imediato.</p>
          </div>

          <div>
            <span className="summary-label">Próxima ativação</span>
            <strong>Entrada com Google</strong>
            <p>Estrutura visual preparada para ativação futura sem quebrar o projeto.</p>
          </div>
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
            <div className="password-field">
              <input
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                className="password-field__toggle"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="stack-sm">
            <button className="button button--block" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar na plataforma"}
            </button>

            <button className="button button--secondary button--block" disabled type="button">
              Continuar com Google
            </button>
          </div>

          <div className="helper-text">
            A entrada com Google ainda não foi ativada no backend atual, mas o fluxo já ficou
            preparado na interface para a próxima etapa.
          </div>
        </form>
      </section>
    </div>
  );
}

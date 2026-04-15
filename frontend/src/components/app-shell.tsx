import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth";

const navItems = [
  { to: "/", label: "Visão geral", end: true },
  { to: "/consultations", label: "Consultas" },
  { to: "/clients", label: "Clientes" },
  { to: "/services", label: "Serviços" },
  { to: "/finance", label: "Financeiro" }
];

const secondaryItems = [{ to: "/settings", label: "Preferências", end: false }];

const mobileNavItems = [
  { to: "/", label: "Início", end: true },
  { to: "/consultations", label: "Agenda" },
  { to: "/consultations/new", label: "Nova" },
  { to: "/finance", label: "Financeiro" }
];

function getProfessionalLabel(email: string | null | undefined) {
  if (!email) return "Sessão ativa";

  const [name] = email.split("@");
  return name
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function AppShell() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const professionalLabel = getProfessionalLabel(session?.user.email);
  const initials = useMemo(() => getInitials(professionalLabel), [professionalLabel]);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-frame">
      <header className="mobile-topbar">
        <button className="mobile-topbar__brand" onClick={() => navigate("/")} type="button">
          <span className="brand__mark brand__mark--small">EA</span>
          <span className="mobile-topbar__titles">
            <strong>Easy Agenda</strong>
            <small>Operação clínica</small>
          </span>
        </button>

        <button
          aria-expanded={isDrawerOpen}
          aria-label="Abrir navegação"
          className="mobile-topbar__menu"
          onClick={() => setIsDrawerOpen(true)}
          type="button"
        >
          {initials}
        </button>
      </header>

      <header className="masthead">
        <div className="masthead__brand" onClick={() => navigate("/")}>
          <div className="brand__mark">EA</div>
          <div className="masthead__brand-copy">
            <strong>Easy Agenda</strong>
            <span>Painel clínico premium</span>
          </div>
        </div>

        <nav className="masthead__nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `masthead__link${isActive ? " masthead__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="masthead__actions">
          <button className="button masthead__cta" onClick={() => navigate("/consultations/new")} type="button">
            Nova consulta
          </button>

          <details className="avatar-menu">
            <summary className="avatar-menu__trigger">
              <span className="avatar-menu__badge">{initials}</span>
              <span className="avatar-menu__text">
                <strong>{professionalLabel}</strong>
                <small>Conta profissional</small>
              </span>
            </summary>

            <div className="avatar-menu__panel">
              <div className="avatar-menu__identity">
                <span className="summary-label">Sessão ativa</span>
                <strong>{professionalLabel}</strong>
                <p>{session?.user.email ?? "Sessão em andamento"}</p>
              </div>

              {secondaryItems.map((item) => (
                <NavLink
                  key={item.to}
                  className="avatar-menu__item"
                  end={item.end}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}

              <button className="avatar-menu__item avatar-menu__item--danger" onClick={handleLogout} type="button">
                Encerrar sessão
              </button>
            </div>
          </details>
        </div>
      </header>

      <div
        aria-hidden={!isDrawerOpen}
        className={`mobile-drawer-backdrop${isDrawerOpen ? " mobile-drawer-backdrop--open" : ""}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        aria-hidden={!isDrawerOpen}
        className={`mobile-drawer${isDrawerOpen ? " mobile-drawer--open" : ""}`}
      >
        <div className="mobile-drawer__header">
          <div className="brand">
            <div className="brand__mark">EA</div>
            <div>
              <div className="brand__title">Easy Agenda</div>
              <div className="brand__subtitle mobile-drawer__subtitle">
                Navegação e conta
              </div>
            </div>
          </div>

          <button
            aria-label="Fechar navegação"
            className="mobile-topbar__menu"
            onClick={() => setIsDrawerOpen(false)}
            type="button"
          >
            Fechar
          </button>
        </div>

        <nav className="mobile-drawer__nav" aria-label="Navegação mobile">
          {[...navItems, ...secondaryItems].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `mobile-drawer__link${isActive ? " mobile-drawer__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mobile-drawer__footer">
          <div className="mobile-drawer__account">
            <span className="summary-label">Conta</span>
            <strong>{professionalLabel}</strong>
            <p>{session?.user.email ?? "Sessão ativa"}</p>
          </div>

          <button className="button button--ghost button--block" onClick={handleLogout} type="button">
            Encerrar sessão
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav" aria-label="Navegação inferior">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `mobile-bottom-nav__link${isActive ? " mobile-bottom-nav__link--active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <button className="mobile-bottom-nav__link" onClick={() => setIsDrawerOpen(true)} type="button">
          Mais
        </button>
      </nav>
    </div>
  );
}

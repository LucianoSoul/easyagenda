import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/consultations", label: "Consultas" },
  { to: "/clients", label: "Clientes" },
  { to: "/services", label: "Serviços" },
  { to: "/finance", label: "Financeiro" },
  { to: "/settings", label: "Configurações" }
];

export function AppShell() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-frame">
      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">EA</div>
          <div>
            <div className="brand__title">Easy Agenda</div>
            <div className="brand__subtitle topbar__subtitle">Operação profissional</div>
          </div>
        </div>

        <nav className="topbar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `topbar__link${isActive ? " topbar__link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar__actions">
          <button
            className="button"
            onClick={() => navigate("/consultations/new")}
            type="button"
          >
            Criar consulta
          </button>
          <div className="topbar__user">{session?.user.email ?? "Sessão ativa"}</div>
          <button
            className="button button--ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            type="button"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

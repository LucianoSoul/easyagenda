import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth/auth";
import { AppShell } from "./components/app-shell";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <AppShell />;
}

export function RootOutlet() {
  return <Outlet />;
}

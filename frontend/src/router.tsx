import { createBrowserRouter } from "react-router-dom";
import { RequireAuth, RootOutlet } from "./App";
import { AppointmentsPage } from "./pages/appointments-page";
import { ConsultationDetailPage } from "./pages/consultation-detail-page";
import { CreateConsultationPage } from "./pages/create-consultation-page";
import { DashboardPage } from "./pages/dashboard-page";
import { LoginPage } from "./pages/login-page";
import { PlaceholderPage } from "./pages/placeholder-page";
import { PublicConsultationStatusPage } from "./pages/public-consultation-status-page";

export const router = createBrowserRouter([
  {
    element: <RootOutlet />,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/public/consultations/:id",
        element: <PublicConsultationStatusPage />
      },
      {
        path: "/",
        element: <RequireAuth />,
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: "consultations",
            element: <AppointmentsPage />
          },
          {
            path: "consultations/new",
            element: <CreateConsultationPage />
          },
          {
            path: "consultations/:id",
            element: <ConsultationDetailPage />
          },
          {
            path: "clients",
            element: (
              <PlaceholderPage
                description="Área reservada para a gestão de relacionamento e histórico do cliente."
                title="Clientes"
              />
            )
          },
          {
            path: "services",
            element: (
              <PlaceholderPage
                description="Área reservada para catálogo, preços e regras de atendimento."
                title="Serviços"
              />
            )
          },
          {
            path: "finance",
            element: (
              <PlaceholderPage
                description="Área reservada para visão financeira, cobranças e repasses."
                title="Financeiro"
              />
            )
          },
          {
            path: "settings",
            element: (
              <PlaceholderPage
                description="Área reservada para integrações, Google e preferências operacionais."
                title="Configurações"
              />
            )
          }
        ]
      }
    ]
  }
]);

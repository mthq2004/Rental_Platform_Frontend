import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/auth/LoginPage";
import Sidebar from "../components/layout/Sidebar";
import DashboardPage from "../pages/dashboard/DashboardPage";
import PropertyListPage from "../pages/properties/PropertyListPage";
import PropertyDetailPage from "../pages/properties/PropertyDetailPage";
import ContractListPage from "../pages/contracts/ContractListPage";
import ContractDetailPage from "../pages/contracts/ContractDetailPage";
import OwnerDetailPage from "../pages/owners/OwnerDetailPage";
import TenantListPage from "../pages/tenants/TenantListPage";
import TenantDetailPage from "../pages/tenants/TenantDetailPage";
import OwnerListPage from "../pages/owners/OwnerListPage";
import { PublicRoute } from "../components/auth/PublicRoute";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import PropertyPendingPage from "../pages/properties/PropertyPendingPage";
import PropertyApprovedPage from "../pages/properties/PropertyApprovedPage";
import PropertyRejectPage from "../pages/properties/PropertyRejectPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";

const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    children: [
      {
        index: true,
        element:
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
      },
      {
        path: "dashboard",
        element: <ProtectedRoute><Sidebar /></ProtectedRoute>,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "owners",
            element: <OwnerListPage />,
          },
          {
            path: "owners/:id",
            element: <OwnerDetailPage />,
          },
          {
            path: "tenants",
            element: <TenantListPage />,
          },
          {
            path: "tenants/:id",
            element: <TenantDetailPage />,
          },
          {
            path: "properties",
            element: <PropertyListPage />,
          },
          {
            path: "properties/pending",
            element: <PropertyPendingPage />,
          },
          {
            path: "properties/approved",
            element: <PropertyApprovedPage />,
          },
          {
            path: "properties/rejected",
            element: <PropertyRejectPage />,
          },
          {
            path: "properties/:id",
            element: <PropertyDetailPage />,
          },
          {
            path: "contracts",
            element: <ContractListPage />,
          },
          {
            path: "contracts/:id",
            element: <ContractDetailPage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
        ],
      },
    ],
  },
]);

export default router;

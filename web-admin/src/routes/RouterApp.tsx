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

const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "dashboard",
        element: <Sidebar />,
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
            path: "reports",
            element: <div>Reports Page</div>,
          },
        ],
      },
    ],
  },
]);

export default router;

import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/auth/LoginPage";
import Sidebar from "../components/layout/Sidebar";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AiAnalyticsPage from "../pages/dashboard/AiAnalyticsPage";
import PropertyDetailPage from "../pages/properties/PropertyDetailPage";
import StatisticsPage from "../pages/statistics/StatisticsPage";
import ComplaintPage from "../pages/complaints/ComplaintPage";
import { PublicRoute } from "../components/auth/PublicRoute";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import PropertyPendingPage from "../pages/properties/PropertyPendingPage";
import PropertyApprovedPage from "../pages/properties/PropertyApprovedPage";
import PropertyRejectPage from "../pages/properties/PropertyRejectPage";
import UserListPage from "../pages/users/UserListPage";
import UserDetailPage from "../pages/users/UserDetailPage";
import AdminListPage from "../pages/admins/AdminListPage";
import AdminDetailPage from "../pages/admins/AdminDetailPage";
import SettingsPage from "../pages/settings/SettingsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import NewsListPage from "../pages/news/NewsListPage";
import NewsEditorPage from "../pages/news/NewsEditorPage";
import BlockchainExplorerPage from "../pages/blockchain/BlockchainExplorerPage";

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
            path: "users",
            element: <UserListPage />,
          },
          {
            path: "users/:id",
            element: <UserDetailPage />,
          },
          {
            path: "admins",
            element: <AdminListPage />,
          },
          {
            path: "admins/:id",
            element: <AdminDetailPage />,
          },
          {
            path: "profile",
            element: <ProfilePage />,
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
            path: "statistics",
            element: <StatisticsPage />,
          },
          {
            path: "ai-analytics",
            element: <AiAnalyticsPage />,
          },
          {
            path: "complaints",
            element: <ComplaintPage />,
          },
          {
            path: "news",
            element: <NewsListPage />,
          },
          {
            path: "news/create",
            element: <NewsEditorPage />,
          },
          {
            path: "news/:id",
            element: <NewsEditorPage />,
          },
          {
            path: "settings",
            element: <SettingsPage />,
          },
          {
            path: "blockchain",
            element: <BlockchainExplorerPage />,
          },
        ],
      },
    ],
  },
]);

export default router;

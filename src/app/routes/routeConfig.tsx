// app/config/routes.jsx
import { Navigate } from "react-router-dom";
import LoginPage from "../../ui/pages/auth/LoginPage";

import { lazy } from "react";
import CHUserManagementPage from "@/ui/pages/centrehead/UserManagement/UserManagementPage";
import CHBatchManagementPage from "@/ui/pages/centrehead/BatchManagement/BatchManagementPage";
import CHProjectManagementPage from "@/ui/pages/centrehead/ProjectManagement/ProjectManagementPage";
import CHDashboard from "@/ui/pages/centrehead/Dashboard/CentreheadDashboardPage";

const DashboardPage = lazy(() => import("@ui/pages/admin/Dashboard/DashboardPage"));
const UserManagementPage = lazy(() => import("@ui/pages/admin/UserManagement/UserManagementPage"));
const BatchManagementPage = lazy(
  () => import("@ui/pages/admin/BatchManagement/BatchManagementPage"),
);
const ProjectManagementPage = lazy(
  () => import("@ui/pages/admin/ProjectManagement/ProjectManagementPage"),
);

const SystemManagerDashboard = lazy(
  () => import("../../ui/pages/systemManager/SystemManagerDashboard"),
);

const SourcingDashboard = lazy(() => import("../../ui/pages/user/sourcing/SourcingDashboard"));

const ManufacturingDashboard = lazy(
  () => import("../../ui/pages/user/manufacturing/ManufacturingDashboard"),
);

const QualityControlDashboard = lazy(
  () => import("../../ui/pages/user/qualityControl/QualityControlDashboard"),
);

const DispatchDashboard = lazy(() => import("../../ui/pages/user/dispatch/DispatchDashboard"));

const SourcingApproverDashboard = lazy(
  () => import("../../ui/pages/approver/sourcing/SourcingApproverDashboard"),
);

const ManufacturingApproverDashboard = lazy(
  () => import("../../ui/pages/approver/manufacturing/ManufacturingApproverDashboard"),
);

const QualityControlApproverDashboard = lazy(
  () => import("../../ui/pages/approver/qualityControl/QualityControlApproverDashboard"),
);

const DispatchApproverDashboard = lazy(
  () => import("../../ui/pages/approver/dispatch/DispatchApproverDashboard"),
);

export const routes = [
  /* ---------- AUTH (PUBLIC) ---------- */
  {
    path: "/login",
    element: <LoginPage />,
    isProtected: false,
  },
  {
    path: "/reset-password",
    element: <Navigate to="/login?mode=reset" replace />,
    isProtected: false,
  },

  /* ---------- PROTECTED DASHBOARDS ---------- */
  {
    path: "/admin",
    element: <DashboardPage />,
    isProtected: true,
    roles: ["ADMIN"],
  },
  {
    path: "/admin/users",
    element: <UserManagementPage />,
    isProtected: true,
    roles: ["ADMIN"],
  },
  {
    path: "/admin/batch",
    element: <BatchManagementPage />,
    isProtected: true,
    roles: ["ADMIN"],
  },
  {
    path: "/admin/projects",
    element: <ProjectManagementPage />,
    isProtected: true,
    roles: ["ADMIN"],
  },
  {
    path: "/centre-head",
    element: <CHDashboard />,
    isProtected: true,
    roles: ["CENTRE_HEAD"],
  },
  {
    path: "/centre-head/users",
    element: <CHUserManagementPage />,
    isProtected: true,
    roles: ["CENTRE_HEAD"],
  },
  {
    path: "/centre-head/batch",
    element: <CHBatchManagementPage />,
    isProtected: true,
    roles: ["CENTRE_HEAD"],
  },

  {
    path: "/centre-head/projects",
    element: <CHProjectManagementPage />,
    isProtected: true,
    roles: ["CENTRE_HEAD"],
  },
  {
    path: "/system-manager",
    element: <SystemManagerDashboard />,
    isProtected: true,
    roles: ["SYSTEM_MANAGER"],
  },

  /* ---------- USER ROUTES ---------- */
  {
    path: "/user/sourcing/:subDept",
    element: <SourcingDashboard />,
    isProtected: true,
    roles: ["USER"],
  },
  {
    path: "/user/manufacturing/:subDept",
    element: <ManufacturingDashboard />,
    isProtected: true,
    roles: ["USER"],
  },
  {
    path: "/user/quality/:subDept",
    element: <QualityControlDashboard />,
    isProtected: true,
    roles: ["USER"],
  },
  {
    path: "/user/dispatch/:subDept",
    element: <DispatchDashboard />,
    isProtected: true,
    roles: ["USER"],
  },

  // Approver routes — same pattern
  {
    path: "/approver/sourcing/:subDept",
    element: <SourcingApproverDashboard />,
    isProtected: true,
    roles: ["APPROVER"],
  },
  {
    path: "/approver/manufacturing/:subDept",
    element: <ManufacturingApproverDashboard />,
    isProtected: true,
    roles: ["APPROVER"],
  },
  {
    path: "/approver/quality/:subDept",
    element: <QualityControlApproverDashboard />,
    isProtected: true,
    roles: ["APPROVER"],
  },
  {
    path: "/approver/dispatch/:subDept",
    element: <DispatchApproverDashboard />,
    isProtected: true,
    roles: ["APPROVER"],
  },
];

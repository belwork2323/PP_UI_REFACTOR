// app/config/routes.jsx
import { Navigate } from "react-router-dom";
import LoginPage from "../../ui/pages/auth/LoginPage";

import AdminDashboard from "../../ui/pages/admin/AdminDashboard";
import UserManagementPage from "../../ui/pages/admin/components/user_management/UserManagementPage";
import BatchManagementPage from "../../ui/pages/admin/components/batch_management/BatchManagementPage";
import ProjectManagementPage from "../../ui/pages/admin/project_management/ProjectManagementPage";
import SystemManagerDashboard from "../../ui/pages/systemManager/SystemManagerDashboard";
import SourcingDashboard from "../../ui/pages/user/sourcing/SourcingDashboard";
import ManufacturingDashboard from "../../ui/pages/user/manufacturing/ManufacturingDashboard";
import QualityControlDashboard from "../../ui/pages/user/qualityControl/QualityControlDashboard";
import DispatchDashboard from "../../ui/pages/user/dispatch/DispatchDashboard";
import SourcingApproverDashboard from "../../ui/pages/approver/sourcing/SourcingApproverDashboard";
import ManufacturingApproverDashboard from "../../ui/pages/approver/manufacturing/ManufacturingApproverDashboard";
import QualityControlApproverDashboard from "../../ui/pages/approver/qualityControl/QualityControlApproverDashboard";
import DispatchApproverDashboard from "../../ui/pages/approver/dispatch/DispatchApproverDashboard";

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
    element: <AdminDashboard />,
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
  },{
    path: "/approver/dispatch/:subDept",
    element: <DispatchApproverDashboard />,
    isProtected: true,
    roles: ["APPROVER"],
  },
];
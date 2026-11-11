import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

type ProtectedRouteProps = {
  children?: ReactNode;
  roles?: string[];
  /** Allow access even when mustChangePassword is true (change-password page). */
  allowMustChangePassword?: boolean;
};

const ProtectedRoute = ({
  children,
  roles,
  allowMustChangePassword = false,
}: ProtectedRouteProps) => {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated) || !!user;
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.mustChangePassword && !allowMustChangePassword) {
    if (location.pathname !== "/change-password") {
      return <Navigate to="/change-password" replace />;
    }
  }

  if (roles && !roles.includes(user?.role ?? "")) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

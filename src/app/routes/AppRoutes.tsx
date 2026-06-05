import { Routes, Route, Navigate } from "react-router-dom";
import { routes } from "./routeConfig";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../../ui/MainLayout";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PUBLIC ROUTES (no header/footer) */}
      {routes
        .filter((r) => !r.isProtected)
        .map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}

      {/* PROTECTED ROUTES WITH LAYOUT */}
      <Route element={<MainLayout />}>
        {routes
          .filter((r) => r.isProtected)
          .map(({ path, element, roles }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
              }
            />
          ))}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;

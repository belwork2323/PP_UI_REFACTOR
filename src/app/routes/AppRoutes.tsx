import { Routes, Route, Navigate } from "react-router-dom";
import { routes } from "./routeConfig";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../../ui/MainLayout";
import { Suspense } from "react";

const AppRoutes = () => {
  const publicRoutes = routes.filter((r) => !r.isProtected);
  const changePasswordRoutes = routes.filter(
    (r) => r.isProtected && r.allowMustChangePassword,
  );
  const appRoutes = routes.filter(
    (r) => r.isProtected && !r.allowMustChangePassword,
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {publicRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}

        {/* Forced change-password: authenticated, no app chrome */}
        {changePasswordRoutes.map(({ path, element, roles, allowMustChangePassword }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute roles={roles} allowMustChangePassword={allowMustChangePassword}>
                {element}
              </ProtectedRoute>
            }
          />
        ))}

        <Route element={<MainLayout />}>
          {appRoutes.map(({ path, element, roles }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute roles={roles}>{element}</ProtectedRoute>}
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

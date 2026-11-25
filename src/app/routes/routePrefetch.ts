import { prefetchUserSection, type UserDepartment } from "@ui/pages/user/userDashboardSections";

type RouteImporter = () => Promise<unknown>;

/**
 * Top-level lazy route chunks keyed by first path segment / known prefixes.
 * Keep in sync with lazy() imports in routeConfig.tsx.
 */
const ROUTE_IMPORTS: Record<string, RouteImporter> = {
  admin: () => import("@ui/pages/admin/Dashboard/DashboardPage"),
  "centre-head": () => import("@/ui/pages/centrehead/Dashboard/CentreheadDashboardPage"),
  "system-manager": () => import("../../ui/pages/systemManager/SystemManagerDashboard"),
  user: () => import("../../ui/pages/user/UserDashboard"),
  "approver/sourcing": () => import("../../ui/pages/approver/sourcing/SourcingApproverDashboard"),
  "approver/manufacturing": () =>
    import("../../ui/pages/approver/manufacturing/ManufacturingApproverDashboard"),
  "approver/quality": () =>
    import("../../ui/pages/approver/qualityControl/QualityControlApproverDashboard"),
  "approver/dispatch": () => import("../../ui/pages/approver/dispatch/DispatchApproverDashboard"),
  "change-password": () => import("../../ui/pages/auth/ChangePasswordPage"),
};

const resolveRouteImporter = (path: string): RouteImporter | null => {
  const clean = path.replace(/^\/+/, "").split("?")[0];
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  if (segments[0] === "approver" && segments[1]) {
    const key = `approver/${segments[1]}`;
    return ROUTE_IMPORTS[key] ?? null;
  }

  return ROUTE_IMPORTS[segments[0]] ?? null;
};

/** Prefetch the top-level dashboard/page chunk for a post-login or switch path. */
export const prefetchRouteByPath = async (path: string): Promise<void> => {
  const importer = resolveRouteImporter(path);
  if (!importer) return;

  try {
    await importer();
  } catch (error) {
    console.warn("prefetchRouteByPath failed", path, error);
  }
};

/**
 * Prefetch route shell + user section (when path is /user|approver/{dept}/{subDept}).
 * Safe to call for any role path.
 */
export const prefetchDestination = async (path: string): Promise<void> => {
  const clean = path.replace(/^\/+/, "").split("?")[0];
  const segments = clean.split("/").filter(Boolean);

  await prefetchRouteByPath(path);

  if (segments[0] === "user" && segments[1] && segments[2]) {
    await prefetchUserSection(segments[1] as UserDepartment, segments[2]);
  }
};

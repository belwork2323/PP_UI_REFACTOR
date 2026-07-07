// src/utlis/roleMapper.js

/* ─────────────────────────────────────────────────────────────────────────────
   Backend roleName → UI role key
───────────────────────────────────────────────────────────────────────────── */
const ROLE_MAP = {
  admin: "ADMIN",
  "system manager": "SYSTEM_MANAGER",
  system_manager: "SYSTEM_MANAGER",
  manager: "SYSTEM_MANAGER",
  approver: "APPROVER",
  user: "USER",
};

/**
 * Maps API display names (e.g. "System Manager") and legacy keys to internal role codes.
 */
export const normalizeRole = (role) => {
  if (!role) return null;
  const k = String(role).trim().toLowerCase();
  if (ROLE_MAP[k]) return ROLE_MAP[k];
  const underscored = k.replace(/\s+/g, "_");
  if (ROLE_MAP[underscored]) return ROLE_MAP[underscored];
  return String(role).toUpperCase().replace(/\s+/g, "_");
};

const normalizeKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const DEPT_NAME_SLUG_MAP = {
  sourcing: "sourcing",
  manufacturing: "manufacturing",
  "quality-control": "quality",
  quality: "quality",
  dispatch: "dispatch",
};

const SUBDEPT_NAME_SLUG_MAP = {
  sourcing: {
    "raw-material-procurement": "raw-material",
    "rocket-motor-casing": "rocket-motor",
  },
  manufacturing: {
    "raw-material-preparation": "raw-material-prep",
    "case-preparation": "case-preparation",
    mixing: "mixing",
    "casting-and-curing": "casting-and-curing",
    "post-cure-operations": "post-cure-operations",
    subscale: "subscale",
    trimming: "trimming",
  },
  quality: {
    "quality-control": "qc-division",
    "raw-material-revalidation": "qc-division",
    "qc-division": "qc-division",
    ndt: "ndt",
    "static-test-facility": "static-test-facility",
  },
  dispatch: {
    dispatch: "dispatch",
  },
};

export const getDeptSlugFromName = (departmentName) => {
  const normalized = normalizeKey(departmentName);
  return DEPT_NAME_SLUG_MAP[normalized] ?? null;
};

export const getSubDeptSlugFromName = (departmentName, subDepartmentName) => {
  const deptSlug = getDeptSlugFromName(departmentName);
  if (!deptSlug) return null;

  const normalizedSubDept = normalizeKey(subDepartmentName);
  return SUBDEPT_NAME_SLUG_MAP[deptSlug]?.[normalizedSubDept] ?? null;
};

export const getSlugsFromNames = (departmentName, subDepartmentName) => {
  const dept = getDeptSlugFromName(departmentName);
  const subDept = getSubDeptSlugFromName(departmentName, subDepartmentName);

  if (!dept || !subDept) return null;

  return { dept, subDept }; 
};

/* ─────────────────────────────────────────────────────────────────────────────
   Role → route factory
───────────────────────────────────────────────────────────────────────────── */
const ROLE_ROUTES = {
  ADMIN: () => "/admin",
  SYSTEM_MANAGER: () => "/system-manager",
  USER: (dept, subDept) => `/user/${dept}/${subDept}`,
  APPROVER: (dept, subDept) => `/approver/${dept}/${subDept}`,
};

/**
 * Build the post-login route for a given role + subDepartmentId.
 * @param {string} role         - Normalized role: "ADMIN" | "USER" | etc.
 * @param {number|string} subDeptId - Selected subDepartmentId (null for Admin/Manager)
 */
export const getRouteByRole = (role, subDeptId = null, subDeptMeta = null) => {
  const routeFn = ROLE_ROUTES[role];
  if (!routeFn) {
    console.error("Unknown role:", role);
    return "/login";
  }

  if (role === "ADMIN" || role === "SYSTEM_MANAGER") return routeFn();

  const mapping =
    subDeptMeta?.slugs ??
    getSlugsFromNames(subDeptMeta?.departmentName, subDeptMeta?.subDepartmentName);
  if (!mapping) {
    console.error("No dynamic slug mapping from API data for subDeptId:", subDeptId, subDeptMeta);
    return "/login";
  }

  return routeFn(mapping.dept, mapping.subDept);
};

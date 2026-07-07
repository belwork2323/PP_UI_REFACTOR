const API_BASE = "/api/v1";

export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE}/auth/login`,
  LOGOUT: `${API_BASE}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE}/auth/refresh-token`,
  RESET_PASSWORD: `${API_BASE}/users/reset-password`,
  GENERATE_CAPTCHA: `${API_BASE}/auth/generate-captcha`,
};

export const USER_ENDPOINTS = {
  PROFILE: `${API_BASE}/users/profile`,
  SUBDEPT_DASHBOARD_STATS: `${API_BASE}/user/subdepartment/dashboard/stats`,
};

export const APPROVER_ENDPOINTS = {
  SUBDEPT_DASHBOARD_STATS: `${API_BASE}/approver/subdepartment/dashboard/stats`,
  BATCH_LIST: `${API_BASE}/approver/subdepartment/batch-list`,
  CHANGE_STATUS: `${API_BASE}/approver/form/change-status`,
  FORM_PDF: `${API_BASE}/approver/form/pdf`,
  RAW_MATERIAL_PROCUREMENT_LIST: `${API_BASE}/approver/raw-material-procurement/list`,
  RAW_MATERIAL_PROCUREMENT_CHANGE_STATUS: `${API_BASE}/approver/form/change-status`,
  ROCKET_MOTOR_CASING_LIST: `${API_BASE}/approver/rocket-motor-casing/list`,
  ROCKET_MOTOR_CASING_CHANGE_STATUS: `${API_BASE}/approver/rocket-motor-casing/change-status`,
};

export const ADMIN_ENDPOINTS = {
  BASE: `${API_BASE}/admin`,
  BATCH_LIST: `${API_BASE}/batches/all`,
  CREATE_BATCH: (username) => `${API_BASE}/batches/create?user=${username}`,
  DASHBOARD_ENDPOINTS: {
    GET_STATS: `${API_BASE}/admin/dashboard/stats`,
    GET_CHART_DATA: `${API_BASE}/admin/dashboard/chartData`,
    GET_ACTIVE_BATCHES: `${API_BASE}/admin/dashboard/active-batches`,
    GET_BLOCKCHAIN_EVENTS: `${API_BASE}/admin/dashboard/blockchain-events`,
  },
  PROJECT: {
    LIST: `${API_BASE}/admin/project/list`,
    STATS: `${API_BASE}/admin/project/stats`,
    DETAILS: `${API_BASE}/admin/project/details`,
    CREATE: `${API_BASE}/admin/project/create`,
    UPDATE: `${API_BASE}/admin/project/update`,
    DELETE: `${API_BASE}/admin/project/delete`,
  },
};

export const USER_SOURCING_ENDPOINTS = {
  ROCKET_CASING_LIST: `${API_BASE}/sourcing/rocket-casing/all`,
  ROCKET_CASING_SUBMIT: (username) =>
    `${API_BASE}/sourcing/rocket-casing/submit?user=${username}`,
  RAW_MATERIAL_LIST: `${API_BASE}/sourcing/raw-material/all`,
  RAW_MATERIAL_SUBMIT: (username) =>
    `${API_BASE}/sourcing/raw-material/submit?user=${username}`,
};

export const DISPATCH_ENDPOINTS = {
  BATCH_LIST: `${API_BASE}/batches/all`, // From legacy Dispatch.js
  SUBMIT_FORM: `${API_BASE}/dispatch`, // From legacy DispatchMaterial.js
};

// Append these to your existing endPoints.js
export const SOURCING_APPROVER_ENDPOINTS = {
  PENDING_TASKS: `${API_BASE}/sourcing/approver/pending`,
  ACTION: (type, id) => `${API_BASE}/sourcing/approver/action/${type}/${id}`,
};

export const USER_MANUFACTURING = {
  RAW_MATERIAL: {
    BATCH_LIST: `${API_BASE}/batches/all`,
    SOLID_LIST: `${API_BASE}/solid/all`,
    LIQUID_LIST: `${API_BASE}/liquid/all`,
    SUBMIT_LIQUID: `${API_BASE}/liquid`,
    SUBMIT_SOLID: `${API_BASE}/solid`
  },
  CASEPREPARATION: {
    CASE_PREP_ALL: `${API_BASE}/solid/approved`,
    FETCH_SOLID_APPROVED: `${API_BASE}/case-prep/all`,
    SUBMIT_CASE_PREP: `${API_BASE}/case-prep`,
  },
  MIXING: {
    MIXING_LIST: `${API_BASE}/mixing-data/all`,
    FETCH_APPROVED: `${API_BASE}/mixing-data/all`,
  },
  CASTING: {
    CASTING_LIST: `${API_BASE}/casting-curing/all`,
    FETCH_APPROVED: `${API_BASE}/solid/approved`,
    SUBMIT: `${API_BASE}/casting-curing`,
  },
  POST_CURE: {
    LIST: `${API_BASE}/case-prep/all`,
    FETCH_APPROVED: `${API_BASE}/solid/approved`,
    SUBMIT: `${API_BASE}/post-cure`,
  },
};

export const USER_MANUFACTURING_APPROVER = {
  ALL_BATCH: {
    BATCH_LIST: `${API_BASE}/solid/draft`,
  },
  RAW_MATERIAL: {
    SOLID_BATCH: (batchId) => `${API_BASE}/solid/${batchId}`,
    LIQUID_BATCH: (batchId) => `${API_BASE}/liquid/${batchId}`,
    UPDATE_SOLID_BATCH: (batchId) => `${API_BASE}/solid/update/${batchId}`,
    UPDATE_LIQUID_BATCH: (batchId) => `${API_BASE}/liquid/update/${batchId}`,
    DOWNLOAD_SOLID_BATCH: (batchId) =>
      `${API_BASE}/reports/solid/download/${batchId}`,
    DOWNLOAD_LIQUID_BATCH: (batchId) =>
      `${API_BASE}/reports/liquid/download/${batchId}`,
  },
  CASE_PREP: {
    CASE_PREP_BATCH: (batchId) => `${API_BASE}/case-prep/${batchId}`,
    UPDATE_CASE_PREP: (batchId) => `${API_BASE}/case-prep/update/${batchId}`,
    DOWNLOAD_CASE_PREP_BATCH: (batchId) =>
      `${API_BASE}/reports/caseprep/download/${batchId}`,
  },
  MIXING: {
    MIXING_BATCH: (batchId) => `${API_BASE}/mixing-data/${batchId}`,
    UPDATE_MIXING: (batchId) => `${API_BASE}/mixing-data/update/${batchId}`,
    DOWNLOAD_MIXING_BATCH: (batchId) =>
      `${API_BASE}/reports/mixing-data/download/${batchId}`,
  },
  APPROVER: {
    SOLID_PREP_LIST: `${API_BASE}/solid/draft`,
    CASE_PREP_LIST: `${API_BASE}/case-prep/draft`,
    MIXING_DATA_LIST: `${API_BASE}/mixing-data/draft`,
    CASTING_CURING_LIST: `${API_BASE}/casting-curing/draft`,
    POST_CURE_LIST: `${API_BASE}/post-cure/draft`
  }
};

// Add to your existing endPoints.js
export const DISPATCH_APPROVER_ENDPOINTS = {
  PENDING_LIST: `${API_BASE}/dispatch/draft`,
  DETAILS: (batchId) => `${API_BASE}/dispatch/${batchId}`,
  UPDATE_STATUS: (batchId) => `${API_BASE}/dispatch/update/${batchId}`,
};

// Append to quality_control_endpoints section in your endPoints.js
export const QC_ENDPOINTS = {
  BATCH_LIST: `${API_BASE}/batches/all`,
  ALL_LOGS: `${API_BASE}/qualityControl/all`,
  SUBMIT: (username) => `${API_BASE}/qualityControl/submit?user=${username}`,
};
// =============================
// System lookup — no auth (GET)
// Base URL: VITE_API_BASE_URL || http://localhost:8080/
// Paths are relative to base URL (e.g. …/api/v1/system/roles)
// =============================
export const SYSTEM = {
  ROLES: `${API_BASE}/system/roles`,
  DEPARTMENTS: `${API_BASE}/system/departments`,
  /** Optional ?departmentId= — omit or null for all */
  SUB_DEPARTMENTS: `${API_BASE}/system/sub-departments`,
};

// =============================
// User Management endpoints
// =============================
export const USER_MANAGEMENT = {
  GET_ALL_USERS: `${API_BASE}/admin/user/list`,
  GET_STATS: `${API_BASE}/admin/user/stats`,
  GET_USER_BY_ID: `${API_BASE}/admin/user/details`,
  CREATE_USER: `${API_BASE}/admin/user/create`,
  UPDATE_USER: `${API_BASE}/admin/user/update`,
  DELETE_USER: `${API_BASE}/admin/user`,
  RESET_PASSWORD: (id) => `user-management/users/${id}/reset-password`,
};

// =============================
// User Management endpoints
// =============================
export const BATCH_MANAGEMENT = {
  GET_ALL_BATCHES: `${API_BASE}/admin/batch/list`,
  GET_STATS: `${API_BASE}/admin/batch/stats`,
  GET_BATCH_BY_ID: `${API_BASE}/admin/batch/details`,
  CREATE_BATCH: `${API_BASE}/admin/batch/create`,
  UPDATE_BATCH: `${API_BASE}/admin/batch/update`,
  DELETE_BATCH: `${API_BASE}/admin/batch`,
};

// System Manager Dashboard — 7 API endpoints (all POST)
export const SYSTEM_MANAGER = {
  STATS: `${API_BASE}/system-manager/dashboard/stats`,
  CHART_DATA: `${API_BASE}/system-manager/dashboard/chartData`,
  ACTIVE_BATCHES: `${API_BASE}/system-manager/dashboard/active-batches`,
  ALERTS: `${API_BASE}/system-manager/dashboard/alerts`,
  BATCH_STATUS_LIST: `${API_BASE}/system-manager/dashboard/batchStatusList`,
  BLOCKCHAIN_EVENTS: `${API_BASE}/system-manager/dashboard/blockchain-events`,
  BATCH_STAGES: `${API_BASE}/system-manager/dashboard/batch-stages`,
  BATCH_DETAILS: `${API_BASE}/system-manager/dashboard/batch/details`,
};

// =============================
// User Subdepartment Operations endpoints
// =============================
export const USER_OPERATIONS_ENDPOINTS = {
  BATCH_LIST: `${API_BASE}/user/subdepartment/batch-list`,
  LOT_LIST: `${API_BASE}/user/raw-material-procurement/form/lot-list`,
  MATERIALS_LIST: `${API_BASE}/user/subdepartment/materials-list`,
  MATERIAL_SPECIFICATION_LIST: `${API_BASE}/user/subdepartment/materials/specification-list`,
  DIMENSIONAL_PARAMETERS_LIST: `${API_BASE}/user/subdepartment/dimensional/parameters-list`,
  SOLID_PROCESSES_LIST: `${API_BASE}/user/subdepartment/solid/processes-list`,
  MOTORS_STAGE_LIST: `${API_BASE}/user/subdepartment/motors-stage-list`,
  APPROVED_MOTORS_LIST: `${API_BASE}/user/subdepartment/approved-motors-list`,
  CASTING_STATION_LIST: `${API_BASE}/user/subdepartment/casting-station`,
  MATERIAL_LOTS: `${API_BASE}/user/subdepartment/material-lots`,
};

export const USER_RAW_MATERIAL_PROCUREMENT_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/raw-material-procurement/form/create`,
  FORM_DETAILS: `${API_BASE}/user/raw-material-procurement/form/details`,
  UPDATE_FORM: `${API_BASE}/user/raw-material-procurement/form/update`,
  DELETE_FORM: `${API_BASE}/user/raw-material-procurement/form/delete`,
  STATS: `${API_BASE}/user/raw-material-procurement/stats`,
};

export const USER_ROCKET_MOTOR_CASING_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/rocket-motor-casing/form/create`,
  FORM_DETAILS: `${API_BASE}/user/rocket-motor-casing/form/details`,
  UPDATE_FORM: `${API_BASE}/user/rocket-motor-casing/form/update`,
  DELETE_FORM: `${API_BASE}/user/rocket-motor-casing/form/delete`,
  CASING_LIST: `${API_BASE}/user/subdepartment/rocket-motor-casing/list`,
  STATS: `${API_BASE}/user/rocket-motor-casing/stats`,
};

export const USER_RAW_MATERIAL_PREPARATION_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/raw-material-preparation/form/create`,
  FORM_DETAILS: `${API_BASE}/user/raw-material-preparation/form/details`,
  UPDATE_FORM: `${API_BASE}/user/raw-material-preparation/form/update`,
  SCHEMA_RAW_MATERIAL: `${API_BASE}/user/raw-material-preparation/schema/raw-material`,
  SCHEMA_MOCK_TRIAL: `${API_BASE}/user/raw-material-preparation/schema/mock-trial`,
};

export const USER_CASE_PREPARATION_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/case-preparation/form/create`,
  FORM_DETAILS: `${API_BASE}/user/case-preparation/form/details`,
  UPDATE_FORM: `${API_BASE}/user/case-preparation/form/update`,
  SCHEMA: `${API_BASE}/user/case-preparation/schema`,
};

export const USER_MIXING_FORM_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/mixing/form/create`,
  FORM_DETAILS: `${API_BASE}/user/mixing/form/details`,
  UPDATE_FORM: `${API_BASE}/user/mixing/form/update`,
};

export const USER_CASTING_CURING_FORM_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/casting-curing/form/create`,
  FORM_DETAILS: `${API_BASE}/user/casting-curing/form/details`,
  UPDATE_FORM: `${API_BASE}/user/casting-curing/form/update`,
  CASTING_SCHEMA: `${API_BASE}/user/casting-curing/schema/casting`,
  CURING_SCHEMA: `${API_BASE}/user/casting-curing/schema/curing`,
};

export const USER_POST_CURE_FORM_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/post-cure/form/create`,
  FORM_DETAILS: `${API_BASE}/user/post-cure/form/details`,
  UPDATE_FORM: `${API_BASE}/user/post-cure/form/update`,
  SCHEMA: `${API_BASE}/user/post-cure/schema`,
};

export const USER_SUBSCALE_FORM_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/subscale/form/create`,
  FORM_DETAILS: `${API_BASE}/user/subscale/form/details`,
  UPDATE_FORM: `${API_BASE}/user/subscale/form/update`,
  SCHEMA: `${API_BASE}/user/subscale-processing/schema`,
};

export const USER_TRIMMING_FORM_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/trimming/form/create`,
  FORM_DETAILS: `${API_BASE}/user/trimming/form/details`,
  UPDATE_FORM: `${API_BASE}/user/trimming/form/update`,
  SCHEMA: `${API_BASE}/user/trimming/schema`,
};

export const USER_RAW_MATERIAL_REVALIDATION_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/raw-material-revalidation/form/create`,
  FORM_DETAILS: `${API_BASE}/user/raw-material-revalidation/form/details`,
  UPDATE_FORM: `${API_BASE}/user/raw-material-revalidation/form/update`,
};

export const USER_QC_DIVISION_ENDPOINTS = {
  SCHEMA: `${API_BASE}/user/quality-control/schema`,
  CREATE_FORM: `${API_BASE}/user/qc-division/create`,
  FORM_DETAILS: `${API_BASE}/user/qc-division/details`,
  UPDATE_FORM: `${API_BASE}/user/qc-division/update`,
};

export const USER_NDT_ENDPOINTS = {
  CREATE_FORM: `${API_BASE}/user/ndt/form/create`,
  FORM_DETAILS: `${API_BASE}/user/ndt/form/details`,
  UPDATE_FORM: `${API_BASE}/user/ndt/form/update`,
};

export const USER_STF_ENDPOINTS = {
  SCHEMA: `${API_BASE}/user/stf/schema`,
  CREATE_FORM: `${API_BASE}/user/stf/form/create`,
  FORM_DETAILS: `${API_BASE}/user/stf/form/details`,
  UPDATE_FORM: `${API_BASE}/user/stf/form/update`,
};

export const USER_DISPATCH_ENDPOINTS = {
  SCHEMA: `${API_BASE}/user/dispatch/schema`,
  CREATE_FORM: `${API_BASE}/user/dispatch/form/create`,
  FORM_DETAILS: `${API_BASE}/user/dispatch/form/details`,
  UPDATE_FORM: `${API_BASE}/user/dispatch/form/update`,
};

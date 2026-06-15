/** Barrel — discoverability for role/feature theme getters */

// common (app chrome)
export { default as getAppHeaderTheme } from "./common/appHeader_theme";
export { default as getAppFooterTheme } from "./common/appFooter_theme";
export { default as getDrawerTheme, DRAWER_NAV } from "./common/drawer_theme";
export { default as getDepartmentHeaderTheme } from "./common/departmentHeader_theme";

// auth
export { default as getLoginTheme } from "./auth/login_theme";

// admin
export { default as getDashboardTheme } from "./admin/dashboard_theme";
export { default as getBatchManagementTheme } from "./admin/BatchManagement/batchManagement_theme";
export { default as getUserManagementTheme } from "./admin/UserManagement/userManagement_theme";
export { default as getProjectManagementTheme } from "./admin/projectManagement_theme";

// system_manager
export { default as getSystemManagerTheme } from "./system_manager/sysDashboard_theme";
export { getBatchDetailsTheme } from "./system_manager/batchDetails_theme";

// shared
export { getSharedTheme } from "./shared/shared_theme";
export { default as getOperationsTheme } from "./shared/operations_theme";
export { default as getFilterTheme } from "./shared/filter_theme";

// user — manufacturing
export { default as getManufacturingTheme } from "./user/manufacturing/manufacturing_theme";
export { default as getMixingTheme } from "./user/manufacturing/mixing_theme";
export { default as getCasePreparationTheme } from "./user/manufacturing/casePreparation_theme";
export { default as getCastingAndCuringTheme } from "./user/manufacturing/castingAndCuring_theme";
export { default as getPostCureTheme } from "./user/manufacturing/postCure_theme";
export { default as getRawMaterialPreparationTheme } from "./user/manufacturing/rawMaterialPreparation_theme";

// user — sourcing
export { default as getSourcingTheme } from "./user/sourcing/sourcing_theme";
export { default as getRocketMotorCasingTheme } from "./user/sourcing/rocketMotorCasing_theme";
export { default as getRawMaterialProcurementTheme } from "./user/sourcing/rawMaterialProcurement_theme";

// user — qualityControl
export { default as getQualityControlTheme } from "./user/qualityControl/qualityControl_theme";

// approver
export { getApproverListTheme } from "./approver/approverList_theme";

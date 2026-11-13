import { lazy, type ComponentType, type ElementType } from "react";
import type { SxProps, Theme } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { colors, icons } from "@app/theme";
import getSourcingTheme from "@app/theme/custom_themes/user/sourcing/sourcing_theme";
import getOperationsTheme from "@app/theme/custom_themes/shared/operations_theme";
import getQualityControlTheme from "@app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { SUB_DEPT_LABELS as SOURCING_LABELS } from "@hooks/user/sourcing/shared/sourcingWorkflowData";
import { SUB_DEPT_LABELS as MANUFACTURING_LABELS } from "@hooks/user/manufacturing/manufacturingWorkflowData";

const RawMaterialSourcingMainPage = lazy(
  () => import("@ui/pages/user/sourcing/rms/RawMaterialSourcingMainPage"),
);
const RocketMotorCasingPage = lazy(() => import("@ui/pages/user/sourcing/RocketMotorCasingPage"));

const RawMaterialPreparationPage = lazy(
  () => import("@ui/pages/user/manufacturing/RawMaterial/RawMaterialPreparationPage"),
);
const CasePreparationPage = lazy(
  () => import("@ui/pages/user/manufacturing/CasePreparation/CasePreparationPage"),
);
const MixingPage = lazy(() => import("@ui/pages/user/manufacturing/Mixing/MixingPage"));
const CastingCuringPage = lazy(
  () => import("@ui/pages/user/manufacturing/CastingAndCuring/CastingAndCuringPage"),
);
const PostCurePage = lazy(() => import("@ui/pages/user/manufacturing/PostCure/PostCurePage"));
const SubscalePage = lazy(() => import("@ui/pages/user/manufacturing/Subscale/SubscalePage"));
const TrimmingPage = lazy(() => import("@ui/pages/user/manufacturing/Trimming/TrimmingPage"));

const QCDivisionPage = lazy(() => import("@ui/pages/user/qualityControl/QCDivision/QCDivisionPage"));
const NDTPage = lazy(() => import("@ui/pages/user/qualityControl/NDT/NDTPage"));
const STFPage = lazy(
  () => import("@ui/pages/user/qualityControl/StaticTestFacility/StaticTestFacilityPage"),
);

const DispatchPage = lazy(() => import("@ui/pages/user/dispatch/DispatchPage"));

export type UserDepartment = "sourcing" | "manufacturing" | "quality" | "dispatch";

type DashboardLayout = {
  container: SxProps<Theme>;
  content: SxProps<Theme>;
};

type DepartmentSections = {
  name: string;
  icon?: ElementType;
  getLayout: (mode: string) => DashboardLayout;
  labels: Record<string, string>;
  sections: Record<string, ComponentType>;
};

export const USER_DASHBOARD_SECTIONS: Record<UserDepartment, DepartmentSections> = {
  sourcing: {
    name: "Sourcing Department",
    getLayout: (mode) => getSourcingTheme(mode).dashboard,
    labels: SOURCING_LABELS,
    sections: {
      "raw-material": RawMaterialSourcingMainPage,
      "rocket-motor": RocketMotorCasingPage,
    },
  },
  manufacturing: {
    name: STRINGS.MANUFACTURING.DEPARTMENT_NAME,
    icon: icons.Factory || icons.Build,
    getLayout: (mode) => getOperationsTheme(mode).dashboard,
    labels: MANUFACTURING_LABELS,
    sections: {
      "raw-material-prep": RawMaterialPreparationPage,
      "case-preparation": CasePreparationPage,
      mixing: MixingPage,
      "casting-and-curing": CastingCuringPage,
      "post-cure-operations": PostCurePage,
      subscale: SubscalePage,
      trimming: TrimmingPage,
    },
  },
  quality: {
    name: STRINGS.QUALITY_CONTROL.DEPARTMENT_NAME,
    getLayout: (mode) => getQualityControlTheme(mode).dashboard,
    labels: {
      "raw-material-revalidation": "Raw Material Revalidation",
      "qc-division": "Quality Assurance",
      ndt: "NDT",
      "static-test-facility": "Static Test Facility",
    },
    sections: {
      "raw-material-revalidation": QCDivisionPage,
      "qc-division": QCDivisionPage,
      ndt: NDTPage,
      "static-test-facility": STFPage,
    },
  },
  dispatch: {
    name: "Dispatch Department",
    getLayout: () => ({
      container: { p: 3, background: colors.dashboard.light.pageBg, minHeight: "100vh" },
      content: { mt: 2 },
    }),
    labels: { dispatch: "Dispatch" },
    sections: { dispatch: DispatchPage },
  },
};

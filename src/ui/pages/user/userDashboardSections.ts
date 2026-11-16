import { lazy, type ComponentType, type ElementType } from "react";
import type { SxProps, Theme } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { colors, icons } from "@app/theme";
import getSourcingTheme from "@app/theme/custom_themes/user/sourcing/sourcing_theme";
import getOperationsTheme from "@app/theme/custom_themes/shared/operations_theme";
import getQualityControlTheme from "@app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { SUB_DEPT_LABELS as SOURCING_LABELS } from "@hooks/user/sourcing/shared/sourcingWorkflowData";
import { SUB_DEPT_LABELS as MANUFACTURING_LABELS } from "@hooks/user/manufacturing/manufacturingWorkflowData";

export type UserDepartment = "sourcing" | "manufacturing" | "quality" | "dispatch";

/** Shared import factories — used by lazy() and by prefetchUserSection. */
export const USER_SECTION_IMPORTS: Record<
  UserDepartment,
  Record<string, () => Promise<{ default: ComponentType }>>
> = {
  sourcing: {
    "raw-material": () => import("@ui/pages/user/sourcing/rms/RawMaterialSourcingMainPage"),
    "rocket-motor": () => import("@ui/pages/user/sourcing/RocketMotorCasingPage"),
  },
  manufacturing: {
    "raw-material-prep": () =>
      import("@ui/pages/user/manufacturing/RawMaterial/RawMaterialPreparationPage"),
    "case-preparation": () =>
      import("@ui/pages/user/manufacturing/CasePreparation/CasePreparationPage"),
    mixing: () => import("@ui/pages/user/manufacturing/Mixing/MixingPage"),
    "casting-and-curing": () =>
      import("@ui/pages/user/manufacturing/CastingAndCuring/CastingAndCuringPage"),
    "post-cure-operations": () => import("@ui/pages/user/manufacturing/PostCure/PostCurePage"),
    subscale: () => import("@ui/pages/user/manufacturing/Subscale/SubscalePage"),
    trimming: () => import("@ui/pages/user/manufacturing/Trimming/TrimmingPage"),
  },
  quality: {
    "raw-material-revalidation": () =>
      import("@ui/pages/user/qualityControl/QCDivision/QCDivisionPage"),
    "qc-division": () => import("@ui/pages/user/qualityControl/QCDivision/QCDivisionPage"),
    ndt: () => import("@ui/pages/user/qualityControl/NDT/NDTPage"),
    "static-test-facility": () =>
      import("@ui/pages/user/qualityControl/StaticTestFacility/StaticTestFacilityPage"),
  },
  dispatch: {
    dispatch: () => import("@ui/pages/user/dispatch/DispatchPage"),
  },
};

const lazySections = (dept: UserDepartment): Record<string, ComponentType> =>
  Object.fromEntries(
    Object.entries(USER_SECTION_IMPORTS[dept]).map(([slug, loader]) => [slug, lazy(loader)]),
  );

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
    sections: lazySections("sourcing"),
  },
  manufacturing: {
    name: STRINGS.MANUFACTURING.DEPARTMENT_NAME,
    icon: icons.Factory || icons.Build,
    getLayout: (mode) => getOperationsTheme(mode).dashboard,
    labels: MANUFACTURING_LABELS,
    sections: lazySections("manufacturing"),
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
    sections: lazySections("quality"),
  },
  dispatch: {
    name: "Dispatch Department",
    getLayout: () => ({
      container: { p: 3, background: colors.dashboard.light.pageBg, minHeight: "100vh" },
      content: { mt: 2 },
    }),
    labels: { dispatch: "Dispatch" },
    sections: lazySections("dispatch"),
  },
};

/** Warm the lazy chunk for a user dept/subdept before navigating. */
export const prefetchUserSection = async (
  dept: string | null | undefined,
  subDept: string | null | undefined,
): Promise<void> => {
  const deptKey = String(dept ?? "").trim() as UserDepartment;
  const subKey = String(subDept ?? "").trim();
  if (!deptKey || !subKey) return;

  const loader = USER_SECTION_IMPORTS[deptKey]?.[subKey];
  if (!loader) return;

  try {
    await loader();
  } catch (error) {
    console.warn("prefetchUserSection failed", deptKey, subKey, error);
  }
};

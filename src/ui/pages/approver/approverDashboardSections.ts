import { lazy, type ComponentType } from "react";

import { STRINGS } from "@app/config/strings";
import getSourcingTheme from "@app/theme/custom_themes/user/sourcing/sourcing_theme";
import { SUB_DEPT_LABELS as SOURCING_LABELS } from "@hooks/user/sourcing/shared/sourcingWorkflowData";

export type ApproverDepartment = "sourcing";

/** Shared import factories — used by lazy() and by prefetchApproverSection. */
export const APPROVER_SECTION_IMPORTS: Record<
  ApproverDepartment,
  Record<string, () => Promise<{ default: ComponentType }>>
> = {
  sourcing: {
    "raw-material": () =>
      import("@ui/pages/approver/sourcing/rms/RawMaterialSourcingApproverMainPage"),
    "rocket-motor": () =>
      import("@ui/pages/approver/sourcing/RocketMotorCasingApproverPage"),
  },
};

const lazySections = (dept: ApproverDepartment): Record<string, ComponentType> =>
  Object.fromEntries(
    Object.entries(APPROVER_SECTION_IMPORTS[dept]).map(([slug, loader]) => [
      slug,
      lazy(loader),
    ]),
  );

type DashboardLayout = {
  container: object;
  content: object;
};

type DepartmentSections = {
  name: string;
  getLayout: (mode: string) => DashboardLayout;
  labels: Record<string, string>;
  sections: Record<string, ComponentType>;
};

export const APPROVER_DASHBOARD_SECTIONS: Record<ApproverDepartment, DepartmentSections> = {
  sourcing: {
    name: STRINGS.APPROVER.DASHBOARD.SOURCING.DEPARTMENT_NAME,
    getLayout: (mode) => getSourcingTheme(mode).dashboard,
    labels: SOURCING_LABELS,
    sections: lazySections("sourcing"),
  },
};

/** Warm the lazy chunk for an Approver dept/subdept before navigating. */
export const prefetchApproverSection = async (
  dept: string | null | undefined,
  subDept: string | null | undefined,
): Promise<void> => {
  const deptKey = String(dept ?? "").trim() as ApproverDepartment;
  const subKey = String(subDept ?? "").trim();
  if (!deptKey || !subKey) return;

  const loader = APPROVER_SECTION_IMPORTS[deptKey]?.[subKey];
  if (!loader) return;

  try {
    await loader();
  } catch (error) {
    console.warn("prefetchApproverSection failed", deptKey, subKey, error);
  }
};

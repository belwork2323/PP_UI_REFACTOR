import { alpha } from "@mui/material/styles";

import colors from "./colors";
import fonts from "./fonts";
import spacing from "./spacing";

export type ApproverDepartmentKey =
  | "sourcing"
  | "manufacturing"
  | "dispatch"
  | "qualityControl";

export type ApproverStatusMeta = Record<
  string,
  {
    bg: string;
    color: string;
    border: string;
  }
>;

export type ApproverDepartmentBrand = {
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  surface: string;
  border: string;
  text: string;
  textSub: string;
  warn: string;
  danger: string;
  success: string;
  queue: string;
  queueLight: string;
  background: string;
};

const WAITING_FOR_APPROVAL_META = {
  bg: alpha("#D4AC0D", 0.1),
  color: "#7D6608",
  border: alpha("#D4AC0D", 0.35),
};

const APPROVED_META = {
  bg: alpha("#148F77", 0.1),
  color: "#0E6655",
  border: alpha("#148F77", 0.3),
};

const REJECTED_META = {
  bg: alpha("#C0392B", 0.1),
  color: "#922B21",
  border: alpha("#C0392B", 0.3),
};

export const APPROVER_STATUS_META: ApproverStatusMeta = {
  Pending: WAITING_FOR_APPROVAL_META,
  "Waiting for Approval": WAITING_FOR_APPROVAL_META,
  WAITING_FOR_APPROVAL: WAITING_FOR_APPROVAL_META,
  Approved: APPROVED_META,
  APPROVED: APPROVED_META,
  Rejected: REJECTED_META,
  REJECTED: REJECTED_META,
};

export const APPROVER_PRIORITY_META: ApproverStatusMeta = {
  Critical: {
    bg: alpha("#C0392B", 0.08),
    color: "#922B21",
    border: alpha("#C0392B", 0.25),
  },
  High: {
    bg: alpha("#D4AC0D", 0.1),
    color: "#7D6608",
    border: alpha("#D4AC0D", 0.3),
  },
  Medium: {
    bg: alpha("#2E86C1", 0.1),
    color: "#1A5276",
    border: alpha("#2E86C1", 0.3),
  },
  Low: {
    bg: alpha("#5D6D7E", 0.08),
    color: "#2E4053",
    border: alpha("#5D6D7E", 0.2),
  },
};

const APPROVER_DEPARTMENT_BRANDS: Record<ApproverDepartmentKey, ApproverDepartmentBrand> = {
  sourcing: {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    accent: "#148F77",
    accentLight: "#1ABC9C",
    surface: "#F4F6F8",
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    warn: "#D4AC0D",
    danger: "#C0392B",
    success: "#148F77",
    queue: "#1565C0",
    queueLight: "#1976D2",
    background: colors.dashboard.light.pageBg,
  },
  manufacturing: {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    accent: "#117A65",
    accentLight: "#1ABC9C",
    surface: "#F4F6F8",
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    warn: "#D4AC0D",
    danger: "#C0392B",
    success: "#148F77",
    queue: "#1565C0",
    queueLight: "#1976D2",
    background: colors.dashboard.light.pageBg,
  },
  dispatch: {
    primary: "#7D4E00",
    primaryLight: "#E67E22",
    accent: "#A04000",
    accentLight: "#E8652A",
    surface: "#FDFAF6",
    border: "#E8D5C0",
    text: "#1C2833",
    textSub: "#7D6E63",
    warn: "#D4AC0D",
    danger: "#C0392B",
    success: "#148F77",
    queue: "#A04000",
    queueLight: "#E8652A",
    background: colors.dashboard.light.pageBg,
  },
  qualityControl: {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    accent: "#117A65",
    accentLight: "#1ABC9C",
    surface: "#F4F6F8",
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    warn: "#D4AC0D",
    danger: "#C0392B",
    success: "#148F77",
    queue: "#1565C0",
    queueLight: "#1976D2",
    background: colors.dashboard.light.pageBg,
  },
};

export const approverTypography = {
  title: {
    fontFamily: fonts.family.primary,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.bold,
  },
  body: {
    fontFamily: fonts.family.primary,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.regular,
  },
  caption: {
    fontFamily: fonts.family.primary,
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
  },
  overline: {
    fontFamily: fonts.family.primary,
    fontSize: "0.65rem",
    fontWeight: fonts.weight.bold,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  },
};

export const approverSpacing = {
  pagePadding: spacing.margins.page,
  sectionGap: spacing.margins.section,
  cardPadding: spacing.margins.card,
  inputGap: spacing.md,
  chipGap: spacing.xs,
};

export const getApproverBrand = (
  department: ApproverDepartmentKey,
): ApproverDepartmentBrand => APPROVER_DEPARTMENT_BRANDS[department];

export const isApproverActionableStatus = (status?: string | null) => {
  const normalized = String(status ?? "").trim();
  return (
    normalized === "Pending" ||
    normalized === "Waiting for Approval" ||
    normalized === "WAITING_FOR_APPROVAL"
  );
};

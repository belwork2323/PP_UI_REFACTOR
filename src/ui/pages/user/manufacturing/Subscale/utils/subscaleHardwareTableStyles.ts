import { SUBSCALE_BRAND } from "../../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import fonts from "../../../../../../app/theme/fonts";
import { APP_CONTROL_FONT_SIZE } from "../../../../../components/common/fieldStyles";

export const sectionCardSx = {
  borderRadius: 2.5,
  border: `1px solid ${SUBSCALE_BRAND.border}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(28,40,51,0.04)",
  fontFamily: fonts.family.primary,
  contentVisibility: "auto" as const,
  containIntrinsicSize: "auto 360px",
};

export const sectionHeaderSx = {
  px: 2,
  py: 1.25,
  background: `linear-gradient(135deg, ${SUBSCALE_BRAND.ssTable}, ${SUBSCALE_BRAND.ssTableLight})`,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

export const sectionTitleSx = {
  fontFamily: fonts.family.primary,
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.01em",
};

export const tableHeaderCellSx = {
  fontFamily: fonts.family.primary,
  fontWeight: 800,
  fontSize: "0.68rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  background: `linear-gradient(180deg, ${SUBSCALE_BRAND.ssTableLight} 0%, ${SUBSCALE_BRAND.ssTable} 100%)`,
  color: "#fff",
  whiteSpace: "nowrap" as const,
  borderBottom: "none",
  borderRight: "1px solid rgba(255,255,255,0.32)",
  py: 1.15,
  "&:last-of-type": { borderRight: "none" },
};

export const tableBodyCellSx = {
  fontFamily: fonts.family.primary,
  fontSize: APP_CONTROL_FONT_SIZE,
  fontWeight: 500,
  color: SUBSCALE_BRAND.text,
  py: 0.75,
  borderBottom: `1px solid ${SUBSCALE_BRAND.border}`,
  borderRight: `1px solid ${SUBSCALE_BRAND.border}`,
  "&:last-of-type": { borderRight: "none" },
};

export const articleTypeCellSx = {
  ...tableBodyCellSx,
  fontWeight: 600,
  minWidth: 150,
};

export const bemNoTextSx = {
  ...tableBodyCellSx,
  minWidth: 88,
  fontWeight: 600,
  color: SUBSCALE_BRAND.text,
};

export const formatArticleTypeLabel = (rawLabel: string) => {
  if (!rawLabel) return "";
  return String(rawLabel)
    .replace(/no\s*of\s*['"]?/gi, "")
    .replace(/['"]/g, "")
    .trim();
};

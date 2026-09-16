import { alpha } from "@mui/material";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../app/theme/custom_themes/shared/data_table_theme";

const BRAND = POST_CURE_BRAND;

/** Match Casting/Curing/Case Prep table density — compact headers and body text. */
const TABLE_HEADER_OPTIONS = {
  headerFontSize: "0.63rem",
  headerLetterSpacing: "0.05em",
};

const TABLE_BODY_OPTIONS = {
  bodyFontSize: "0.72rem",
  bodyPaddingY: 1,
  bodyPaddingX: 1.25,
};

export const postCurePlaceholderSx = {
  color: BRAND.textSub,
  opacity: 0.72,
  fontWeight: 400,
  fontSize: "0.68rem",
  lineHeight: 1.4,
};

export const postCureFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    background: BRAND.surface,
    fontSize: "0.78rem",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.pcLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.pc, borderWidth: 2 },
    "&.Mui-focused": { background: "#fff" },
    "&.Mui-disabled": {
      background: alpha(BRAND.surface, 0.85),
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    fontSize: "0.78rem",
    "&::placeholder": postCurePlaceholderSx,
  },
};

export const postCureTableInputSx = {
  ...postCureFieldSx,
  "& .MuiOutlinedInput-root": {
    ...postCureFieldSx["& .MuiOutlinedInput-root"],
    background: "#fff",
    fontSize: "0.72rem",
    minHeight: 32,
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    fontSize: "0.72rem",
    py: "4px",
  },
  "& .MuiFormHelperText-root": {
    fontSize: "0.68rem",
    mx: 0,
    mt: 0.5,
  },
};

export const postCureTableContainerSx = {
  borderRadius: 1.5,
  border: `1px solid ${BRAND.border}`,
  overflow: "hidden",
};

export const postCureTableHeaderCellSx = (_isLead = false) =>
  uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, TABLE_HEADER_OPTIONS);

export const postCureTableRowSx = (idx: number) => ({
  background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
});

export const postCureTableCellSx = {
  ...uniformTableBodyCellSx(
    { border: BRAND.border, text: BRAND.text },
    TABLE_BODY_OPTIONS,
  ),
};

export {
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SubsectionHeading,
  TableSelectInput,
} from "../CastingAndCuring/CastingCuringFormPrimitives";

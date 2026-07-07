import type { InputLabelProps } from "@mui/material";
import { spacing } from "../../../app/theme";

export const schemaFieldLabelProps: Partial<InputLabelProps> = {
  shrink: true,
  sx: {
    fontSize: "0.72rem",
    fontWeight: 600,
    whiteSpace: "normal",
    lineHeight: 1.25,
    position: "relative",
    transform: "none",
    mb: 0.25,
    maxWidth: "100%",
  },
};

export const schemaFieldInputProps = { style: { fontSize: "0.78rem" } };

const singleLineInputRootSx = {
  fontSize: "0.78rem",
  minHeight: 40,
  height: 40,
  alignItems: "center",
  boxSizing: "border-box" as const,
};

export const schemaFieldSx = {
  mb: spacing.sm,
  "& .MuiInputBase-root:not(.MuiInputBase-multiline)": singleLineInputRootSx,
  "& .MuiInputBase-input:not(textarea)": {
    py: 0,
    fontSize: "0.78rem",
    height: "1.4375em",
    boxSizing: "border-box",
  },
  "& .MuiSelect-select": {
    py: 0,
    minHeight: "unset",
    display: "flex",
    alignItems: "center",
    fontSize: "0.78rem",
  },
  "& .MuiInputAdornment-root": {
    height: "auto",
    maxHeight: "none",
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    padding: 4,
  },
  "& .MuiInputBase-input::placeholder": { fontSize: "0.72rem", opacity: 0.8 },
};

export const schemaSelectMenuProps = {
  PaperProps: {
    sx: { "& .MuiMenuItem-root": { fontSize: "0.78rem" } },
  },
};

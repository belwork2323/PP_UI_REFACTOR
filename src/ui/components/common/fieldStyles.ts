import type { InputLabelProps } from "@mui/material";
import { spacing } from "../../../app/theme";

/** Shared control heights — keep text / dropdown / date pickers aligned. */
export const APP_CONTROL_HEIGHT = 40;
export const APP_CONTROL_HEIGHT_COMPACT = 32;
export const APP_CONTROL_RADIUS = "8px";
export const APP_CONTROL_FONT_SIZE = "0.78rem";
export const APP_CONTROL_FONT_SIZE_COMPACT = "0.75rem";

/** Label sits above the control — avoids overlap with placeholder / selected value. */
export const appDropdownLabelProps: Partial<InputLabelProps> = {
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

export const appDropdownInputProps = { style: { fontSize: APP_CONTROL_FONT_SIZE } };

const singleLineInputRootSx = {
  fontSize: APP_CONTROL_FONT_SIZE,
  minHeight: APP_CONTROL_HEIGHT,
  height: APP_CONTROL_HEIGHT,
  alignItems: "center",
  boxSizing: "border-box" as const,
  borderRadius: APP_CONTROL_RADIUS,
};

export const appDropdownSx = {
  mb: spacing.sm,
  "& .MuiInputBase-root:not(.MuiInputBase-multiline)": singleLineInputRootSx,
  "& .MuiInputBase-input:not(textarea):not(.MuiSelect-select)": {
    py: 0,
    fontSize: APP_CONTROL_FONT_SIZE,
    height: "1.4375em",
    boxSizing: "border-box",
  },
  "& .MuiSelect-select": {
    py: "9px",
    minHeight: "unset",
    height: "auto !important",
    display: "flex",
    alignItems: "center",
    fontSize: APP_CONTROL_FONT_SIZE,
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    paddingRight: "32px !important",
    boxSizing: "border-box",
  },
  "& .MuiSelect-icon": {
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
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

/** Compact table-cell control — same height as compact dropdown + date picker. */
export const appDenseControlSx = {
  mb: 0,
  width: "100%",
  minWidth: 0,
  "& .MuiInputBase-root:not(.MuiInputBase-multiline), & .MuiOutlinedInput-root:not(.MuiInputBase-multiline)":
    {
      minHeight: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
      height: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
      fontSize: APP_CONTROL_FONT_SIZE_COMPACT,
      borderRadius: APP_CONTROL_RADIUS,
      boxSizing: "border-box",
    },
  "& .MuiInputBase-input:not(textarea):not(.MuiSelect-select)": {
    py: "0 !important",
    px: "8px !important",
    fontSize: `${APP_CONTROL_FONT_SIZE_COMPACT} !important`,
    height: "auto",
    lineHeight: 1.3,
  },
  "& .MuiSelect-select": {
    py: "6px !important",
    minHeight: "unset !important",
    height: "auto !important",
    fontSize: `${APP_CONTROL_FONT_SIZE_COMPACT} !important`,
    lineHeight: 1.3,
    display: "flex",
    alignItems: "center",
    paddingRight: "28px !important",
  },
  "& .MuiSelect-icon": {
    right: 6,
    fontSize: 18,
  },
  "& .MuiInputAdornment-root": {
    marginLeft: 0,
    maxHeight: APP_CONTROL_HEIGHT_COMPACT,
    height: APP_CONTROL_HEIGHT_COMPACT,
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    padding: 4,
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    fontSize: 18,
  },
  "& .MuiInputBase-input::placeholder": {
    fontSize: "0.72rem",
    opacity: 0.75,
  },
  "& input[type=number]": {
    MozAppearance: "textfield",
  },
  "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
    {
      WebkitAppearance: "none",
      margin: 0,
    },
};

export const appDropdownMenuProps = {
  PaperProps: {
    sx: { "& .MuiMenuItem-root": { fontSize: "0.78rem" } },
  },
};

export const appDropdownPlaceholderSx = {
  color: "text.secondary",
  fontSize: "0.78rem",
  fontStyle: "italic",
  lineHeight: 1.4,
};

export const appDatePickerPaperSx = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  overflow: "hidden",
  "& .MuiPickersDay-root": {
    fontSize: "0.78rem",
    borderRadius: 1,
  },
  "& .MuiPickersDay-root.Mui-selected": {
    fontWeight: 700,
  },
  "& .MuiDayCalendar-weekDayLabel": {
    fontSize: "0.72rem",
    fontWeight: 700,
  },
  "& .MuiPickersCalendarHeader-label": {
    fontSize: "0.85rem",
    fontWeight: 700,
  },
  "& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton": {
    fontSize: "0.78rem",
  },
  "& .MuiPickersArrowSwitcher-button .MuiSvgIcon-root": {
    fontSize: "1.1rem",
  },
};

/**
 * Date field chrome — calendar icon flush at the start of the outlined input.
 * Pass extra styles via DateField `sx` / `inputSx`.
 */
export const appDatePickerFieldSx = {
  mb: spacing.sm,
  "& .MuiOutlinedInput-root": {
    alignItems: "center",
    pl: "6px",
    pr: "8px",
    gap: "2px",
    borderRadius: APP_CONTROL_RADIUS,
  },
  "& .MuiOutlinedInput-root.MuiInputBase-sizeSmall": {
    minHeight: APP_CONTROL_HEIGHT,
    height: APP_CONTROL_HEIGHT,
  },
  "& .MuiInputAdornment-root": {
    margin: 0,
    maxHeight: "none",
    height: "auto",
  },
  "& .MuiInputAdornment-positionStart": {
    marginRight: "2px",
    marginLeft: 0,
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    padding: "4px",
    margin: 0,
    color: "primary.main",
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    fontSize: 18,
  },
  "& .MuiInputBase-input": {
    py: 0,
    px: "4px !important",
    fontSize: APP_CONTROL_FONT_SIZE,
    letterSpacing: "0.01em",
  },
  "& .MuiInputBase-input::placeholder": {
    fontSize: "0.72rem",
    opacity: 0.75,
  },
};

/** Compact date field for table cells — same height as compact text/dropdown. */
export const appDatePickerCompactFieldSx = {
  ...appDatePickerFieldSx,
  mb: 0,
  width: "100%",
  minWidth: 0,
  "& .MuiOutlinedInput-root": {
    ...((appDatePickerFieldSx as any)["& .MuiOutlinedInput-root"] ?? {}),
    pl: "4px",
    pr: "6px",
    minHeight: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
    height: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
    borderRadius: APP_CONTROL_RADIUS,
    fontSize: APP_CONTROL_FONT_SIZE_COMPACT,
  },
  "& .MuiOutlinedInput-root.MuiInputBase-sizeSmall": {
    minHeight: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
    height: `${APP_CONTROL_HEIGHT_COMPACT}px !important`,
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    padding: "2px",
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    fontSize: 16,
  },
  "& .MuiInputBase-input": {
    py: 0,
    px: "2px !important",
    fontSize: APP_CONTROL_FONT_SIZE_COMPACT,
    letterSpacing: "0.01em",
  },
  "& .MuiInputBase-input::placeholder": {
    fontSize: "0.7rem",
    opacity: 0.75,
  },
};

/** Shared calendar popup styling — matches AppDropdown menu treatment. */
export const appDatePickerPopupSlotProps = {
  desktopPaper: { sx: appDatePickerPaperSx },
  mobilePaper: { sx: appDatePickerPaperSx },
  openPickerButton: {
    size: "small" as const,
    edge: "start" as const,
    sx: {
      p: "4px",
      ml: 0,
      mr: 0,
      color: "primary.main",
    },
  },
  openPickerIcon: {
    sx: { fontSize: 18 },
  },
  popper: {
    sx: { zIndex: 1400 },
  },
};

/** Compact calendar adornment — for dense table cells. */
export const appDatePickerCompactPopupSlotProps = {
  ...appDatePickerPopupSlotProps,
  openPickerButton: {
    size: "small" as const,
    edge: "start" as const,
    sx: {
      p: "2px",
      ml: 0,
      mr: 0,
      color: "primary.main",
    },
  },
  openPickerIcon: {
    sx: { fontSize: 16 },
  },
};

/** @deprecated Use appDropdownLabelProps */
export const schemaFieldLabelProps = appDropdownLabelProps;
/** @deprecated Use appDropdownInputProps */
export const schemaFieldInputProps = appDropdownInputProps;
/** @deprecated Use appDropdownSx */
export const schemaFieldSx = appDropdownSx;
/** @deprecated Use appDropdownMenuProps */
export const schemaSelectMenuProps = appDropdownMenuProps;

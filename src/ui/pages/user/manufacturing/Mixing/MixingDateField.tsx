import { Box } from "@mui/material";
import FlowBarDateField from "../../../../components/common/FlowBarDateField";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { mixingFieldSx } from "./MixingFormFields";

export interface MixingDateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  fullWidth?: number | string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  /** Validation focus path — sets `data-mix-field` on the wrapper. */
  fieldPath?: string;
}

export const MixingDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "DD-MM-YYYY",
  fullWidth,
  error = false,
  helperText,
  required = false,
  fieldPath,
}: MixingDateFieldProps) => (
  <Box data-mix-field={fieldPath || undefined} sx={{ width: fullWidth ?? 220 }}>
    <FlowBarDateField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      accentColor={MIXING_BRAND.primaryLight}
      width="100%"
      error={error}
      helperText={helperText}
      required={required}
      inputSx={{
        ...mixingFieldSx,
        "& .MuiFormLabel-root": {
          fontWeight: 700,
          fontSize: "0.72rem",
          color: MIXING_BRAND.textSub,
          mb: 0.6,
        },
      }}
      flowBar={{
        selectLabel: {
          fontWeight: 700,
          fontSize: "0.72rem",
          color: MIXING_BRAND.textSub,
          mb: 0.6,
        },
      }}
    />
  </Box>
);

export default MixingDateField;

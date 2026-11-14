import { Box } from "@mui/material";
import { DateTimeField } from "../../../../components/common/DateField";
import FlowBarDateField from "../../../../components/common/FlowBarDateField";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { mixingFieldSx } from "./MixingFormFields";
import { ReactNode } from "react";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

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
  type?: "date" | "datetime";
  /** Validation focus path — sets `data-mix-field` on the wrapper. */
  fieldPath?: string;
}

export const MixingDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder,
  fullWidth,
  error = false,
  helperText,
  required = false,
  type = "date",
  fieldPath,
}: MixingDateFieldProps) => {
  const resolvedPlaceholder =
    placeholder ?? (type === "datetime" ? "DD-MM-YYYY HH:mm" : "DD-MM-YYYY");
  const inputSx = {
    ...mixingFieldSx,
    "& .MuiFormLabel-root": {
      fontWeight: 700,
      fontSize: "0.72rem",
      color: MIXING_BRAND.textSub,
      mb: 0.6,
    },
  };

  return (
    <Box data-mix-field={fieldPath || undefined} sx={{ width: fullWidth ?? 220 }}>
      {type === "datetime" ? (
        <DateTimeField
          label={<FieldLabelWithAsterisk label={label} required={required} />}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          error={error}
          helperText={helperText}
          inputSx={inputSx}
        />
      ) : (
        <FlowBarDateField
          label={<FieldLabelWithAsterisk label={label} required={required} />}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          accentColor={MIXING_BRAND.primaryLight}
          width="100%"
          error={error}
          helperText={helperText}
          inputSx={inputSx}
          flowBar={{
            selectLabel: {
              fontWeight: 700,
              fontSize: "0.72rem",
              color: MIXING_BRAND.textSub,
              mb: 0.6,
            },
          }}
        />
      )}
    </Box>
  );
};

export default MixingDateField;

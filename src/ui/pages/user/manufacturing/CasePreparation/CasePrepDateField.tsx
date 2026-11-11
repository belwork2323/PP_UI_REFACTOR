import { Box, Typography } from "@mui/material";
import DateField, { DateTimeField } from "../../../../components/common/DateField";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

type CasePrepDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  theme: any;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  type?: "date" | "datetime";
  /** Validation focus target (`data-cp-field`). */
  dataCpField?: string;
};

const CasePrepDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder,
  theme,
  required = false,
  error = false,
  helperText,
  type = "date",
  dataCpField,
}: CasePrepDateFieldProps) => {
  const accentColor = theme?.palette?.primaryLight ?? theme?.palette?.primary ?? "#2E86C1";
  const labelSx = theme?.manufacturing?.casePreparation?.flowBar?.selectLabel;
  const resolvedPlaceholder = placeholder ?? (type === "datetime" ? "DD-MM-YYYY HH:mm" : "DD-MM-YYYY");
  const inputSx = {
    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: accentColor,
    },
  };

  return (
    <Box
      sx={{ minWidth: 220, maxWidth: 280 }}
      {...(dataCpField ? { "data-cp-field": dataCpField } : {})}
    >
      {label ? (
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: theme?.palette?.textSub ?? "#5D6D7E",
            mb: 0.5,
            ...(labelSx ?? {}),
          }}
        >
          {required ? <FieldLabelWithAsterisk label={label} required /> : label}
        </Typography>
      ) : null}
      {readOnly ? (
        <WorkflowReadOnlyText value={value} sx={{ fontSize: "0.82rem", py: 0.75 }} />
      ) : type === "datetime" ? (
        <DateTimeField
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          required={required}
          error={error}
          helperText={helperText}
          compact
          inputSx={inputSx}
        />
      ) : (
        <DateField
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={resolvedPlaceholder}
          required={required}
          error={error}
          helperText={helperText}
          compact
          inputSx={inputSx}
        />
      )}
    </Box>
  );
};

export default CasePrepDateField;

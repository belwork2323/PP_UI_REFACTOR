import { Box, TextField, Typography } from "@mui/material";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

type CasePrepTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  width?: number | string;
  theme: any;
  error?: boolean;
  helperText?: string | null;
  required?: boolean;
};

const CasePrepTextField = ({
  label,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  placeholder = "",
  width = 220,
  theme,
  error,
  helperText,
  required = false,
}: CasePrepTextFieldProps) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};
  const palette = theme?.palette ?? {};
  const hasValue = String(value ?? "").trim().length > 0;

  return (
    <Box sx={flowBar.selectField?.(width)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {required ? <FieldLabelWithAsterisk label={label} required /> : label}
      </Typography>
      {readOnly ? (
        <WorkflowReadOnlyText value={value} sx={{ fontSize: "0.82rem", py: 0.75 }} />
      ) : (
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          error={Boolean(error)}
          helperText={helperText ?? undefined}
          sx={{
            ...flowBar.selectInput?.(hasValue),
            "& .MuiInputBase-input": {
              fontWeight: hasValue ? 600 : 500,
              color: hasValue ? palette.text : palette.textSub,
              py: 1,
              fontSize: "0.82rem",
            },
            "& .MuiInputBase-input::placeholder": {
              color: palette.textSub,
              opacity: 1,
              fontWeight: 500,
            },
          }}
          required={required}
        />
      )}
    </Box>
  );
};

export default CasePrepTextField;

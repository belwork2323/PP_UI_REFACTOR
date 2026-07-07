import { Box, TextField, Typography } from "@mui/material";

type CasePrepTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  width?: number | string;
  theme: any;
};

const CasePrepTextField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "",
  width = 220,
  theme,
}: CasePrepTextFieldProps) => {
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};
  const palette = theme?.palette ?? {};
  const hasValue = String(value ?? "").trim().length > 0;

  return (
    <Box sx={flowBar.selectField?.(width)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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
      />
    </Box>
  );
};

export default CasePrepTextField;

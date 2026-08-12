import { Box, Typography } from "@mui/material";
import DateField from "../../../../components/common/DateField";

type CasePrepDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  theme: any;
};

const CasePrepDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "DD-MM-YYYY",
  theme,
}: CasePrepDateFieldProps) => {
  const accentColor = theme?.palette?.primaryLight ?? theme?.palette?.primary ?? "#2E86C1";
  const labelSx = theme?.manufacturing?.casePreparation?.flowBar?.selectLabel;

  return (
    <Box sx={{ minWidth: 220, maxWidth: 280 }}>
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
          {label}
        </Typography>
      ) : null}
      <DateField
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        compact
        inputSx={{
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: accentColor,
          },
        }}
      />
    </Box>
  );
};

export default CasePrepDateField;

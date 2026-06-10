import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";

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
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar ?? {};
  const hasValue = Boolean(value.trim());

  return (
    <Box sx={flowBar.selectField?.(220)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {label}
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <DatePicker
          enableAccessibleFieldDOMStructure={false}
          format="DD-MM-YYYY"
          disabled={disabled}
          value={value ? dayjs(value, "DD-MM-YYYY") : null}
          onChange={(picked) => onChange(picked?.format("DD-MM-YYYY") || "")}
          slotProps={{
            textField: {
              size: "small",
              fullWidth: true,
              variant: "outlined",
              placeholder,
              sx: flowBar.selectInput?.(hasValue),
            },
          }}
          sx={{ width: "100%" }}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default CasePrepDateField;

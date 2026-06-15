import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { mixingFieldSx } from "./MixingFormFields";

type MixingDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

const MixingDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "DD-MM-YYYY",
}: MixingDateFieldProps) => (
  <Box>
    <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: MIXING_BRAND.textSub, mb: 0.6 }}>
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
            sx: mixingFieldSx,
          },
        }}
      />
    </LocalizationProvider>
  </Box>
);

export default MixingDateField;

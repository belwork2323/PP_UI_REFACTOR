import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import { mandatoryFieldInputSx } from "./MandatoryFormField";

type ReceiptDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  theme: {
    workflow: {
      formElements: {
        metaRowTextField: Record<string, unknown>;
      };
    };
    palette: { danger: string };
  };
  placeholder?: string;
  error?: boolean;
};

const ReceiptDateField = ({
  value,
  onChange,
  theme,
  placeholder = "DD-MM-YYYY",
  error = false,
}: ReceiptDateFieldProps) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      enableAccessibleFieldDOMStructure={false}
      format="DD-MM-YYYY"
      value={value ? dayjs(value, "DD-MM-YYYY") : null}
      onChange={(picked) => onChange(picked?.format("DD-MM-YYYY") || "")}
      slotProps={{
        textField: {
          size: "small",
          fullWidth: true,
          variant: "outlined",
          placeholder,
          error,
          sx: {
            width: "100%",
            ...mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, error, theme),
          },
        },
      }}
      sx={{ width: "100%" }}
    />
  </LocalizationProvider>
);

export default ReceiptDateField;

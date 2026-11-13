import DateField from "@ui/components/common/DateField";
import { mandatoryFieldInputSx } from "@ui/components/validation/ValidatedFormField";

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
  <DateField
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    error={error}
    sx={{
      mb: 0,
      width: "100%",
      ...mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, error, theme),
    }}
  />
);

export default ReceiptDateField;

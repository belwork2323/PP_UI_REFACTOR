import FlowBarDateField from "../../../../components/common/FlowBarDateField";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { mixingFieldSx } from "./MixingFormFields";

type MixingDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  fullWidth?: string;
};

const MixingDateField = ({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "DD-MM-YYYY",
  fullWidth,
}: MixingDateFieldProps) => (
  <FlowBarDateField
    label={label}
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    accentColor={MIXING_BRAND.primaryLight}
    width={fullWidth ?? 220}
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
);

export default MixingDateField;

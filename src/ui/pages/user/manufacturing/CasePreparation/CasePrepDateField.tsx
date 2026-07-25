import FlowBarDateField from "../../../../components/common/FlowBarDateField";

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
  const flowBar = theme?.manufacturing?.casePreparation?.flowBar;
  const accentColor = theme?.palette?.primaryLight ?? theme?.palette?.primary ?? "#2E86C1";

  return (
    <FlowBarDateField
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      width={220}
      flowBar={flowBar}
      accentColor={accentColor}
    />
  );
};

export default CasePrepDateField;

import React, { useMemo } from "react";
import type { DefaultSolidProcessForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import DryingTrayOvenSection from "./DryingTrayOvenSection";
import SievingSection from "./SievingSection";

type Props = {
  value: DefaultSolidProcessForm;
  onChange: (next: DefaultSolidProcessForm) => void;
  disabled?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

const splitFieldErrors = (
  errors: Record<string, string> | undefined,
  prefix: string,
): Record<string, string> => {
  if (!errors) return {};
  const out: Record<string, string> = {};
  Object.entries(errors).forEach(([key, message]) => {
    if (key.startsWith(`${prefix}.`)) {
      out[key.slice(prefix.length + 1)] = message;
    }
  });
  return out;
};

const DefaultSolidMaterialProcessPanel = ({
  value,
  onChange,
  disabled,
  theme,
  validationErrors,
}: Props) => {
  const dryingErrors = useMemo(
    () => splitFieldErrors(validationErrors, "drying"),
    [validationErrors],
  );
  const sievingErrors = useMemo(
    () => splitFieldErrors(validationErrors, "sieving"),
    [validationErrors],
  );

  return (
    <>
      <DryingTrayOvenSection
        value={value.drying}
        onChange={(drying) => onChange({ ...value, drying })}
        disabled={disabled}
        theme={theme}
        fieldErrors={dryingErrors}
      />
      <SievingSection
        value={value.sieving}
        onChange={(sieving) => onChange({ ...value, sieving })}
        disabled={disabled}
        theme={theme}
        fieldErrors={sievingErrors}
      />
    </>
  );
};

export default DefaultSolidMaterialProcessPanel;

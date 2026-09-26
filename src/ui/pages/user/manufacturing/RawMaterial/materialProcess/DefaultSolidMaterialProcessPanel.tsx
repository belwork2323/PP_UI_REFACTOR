import React, { useMemo } from "react";
import type {
  DefaultLiquidProcessForm,
  DefaultSolidProcessForm,
  RmpMaterialProcessForm,
} from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import LotDetailsSection from "./LotDetailsSection";
import DryingTrayOvenSection from "./DryingTrayOvenSection";
import SievingSection from "./SievingSection";

type Props = {
  value: RmpMaterialProcessForm;
  onChange: (next: RmpMaterialProcessForm) => void;
  lotOptions: string[];
  quantityPerPremix: number;
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
  lotOptions,
  quantityPerPremix,
  disabled,
  theme,
  validationErrors,
}: Props) => {
  const lotErrors = useMemo(
    () => splitFieldErrors(validationErrors, "lotDetails"),
    [validationErrors],
  );
  const dryingErrors = useMemo(
    () => splitFieldErrors(validationErrors, "drying"),
    [validationErrors],
  );
  const sievingErrors = useMemo(
    () => splitFieldErrors(validationErrors, "sieving"),
    [validationErrors],
  );

  if (value.uiKey === "defaultLiquid") {
    const liquid = value as DefaultLiquidProcessForm;
    return (
      <LotDetailsSection
        value={liquid.lotDetails}
        onChange={(lotDetails) => onChange({ ...liquid, lotDetails })}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={disabled}
        theme={theme}
        fieldErrors={lotErrors}
      />
    );
  }

  const solid = value as DefaultSolidProcessForm;

  return (
    <>
      <LotDetailsSection
        value={solid.lotDetails}
        onChange={(lotDetails) => onChange({ ...solid, lotDetails })}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={disabled}
        theme={theme}
        fieldErrors={lotErrors}
      />
      <DryingTrayOvenSection
        value={solid.drying}
        onChange={(drying) => onChange({ ...solid, drying })}
        disabled={disabled}
        theme={theme}
        fieldErrors={dryingErrors}
      />
      <SievingSection
        value={solid.sieving}
        onChange={(sieving) => onChange({ ...solid, sieving })}
        disabled={disabled}
        theme={theme}
        fieldErrors={sievingErrors}
      />
    </>
  );
};

export default DefaultSolidMaterialProcessPanel;

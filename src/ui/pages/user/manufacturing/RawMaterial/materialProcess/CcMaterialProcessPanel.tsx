import React, { useMemo } from "react";
import {
  ccIoSectionTitle,
  type CcProcessForm,
} from "../../../../../../data/models/user/rmp/ccProcessForm";
import type { RmpMaterialProcessForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import LotDetailsSection from "./LotDetailsSection";
import DoaFormatSection from "./DoaFormatSection";
import DryingTrayOvenSection from "./DryingTrayOvenSection";
import SievingSection from "./SievingSection";

type Props = {
  value: CcProcessForm;
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

/**
 * CC: Lot Details + CC format + Drying + Sieving.
 * IO: Lot Details + IO format only.
 */
const CcMaterialProcessPanel = ({
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

  const patch = (partial: Partial<CcProcessForm>) => {
    onChange({ ...value, ...partial });
  };

  const showDryingSieving = value.uiKey === "cc";

  return (
    <>
      <LotDetailsSection
        value={value.lotDetails}
        onChange={(lotDetails) => patch({ lotDetails })}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={disabled}
        theme={theme}
        fieldErrors={lotErrors}
      />
      <DoaFormatSection
        title={ccIoSectionTitle(value.uiKey)}
        sievingDatetime={value.sievingDatetime}
        onSievingDatetimeChange={(sievingDatetime) => patch({ sievingDatetime })}
        dispatchDatetime={value.dispatchDatetime}
        observation={value.observation}
        totalQtySentForPremix={value.totalQtySentForPremix}
        onDispatchDatetimeChange={(dispatchDatetime) => patch({ dispatchDatetime })}
        onObservationChange={(observation) => patch({ observation })}
        onTotalQtySentForPremixChange={(totalQtySentForPremix) =>
          patch({ totalQtySentForPremix })
        }
        disabled={disabled}
        theme={theme}
        validationErrors={validationErrors}
      />
      {showDryingSieving ? (
        <>
          <DryingTrayOvenSection
            value={value.drying}
            onChange={(drying) => patch({ drying })}
            disabled={disabled}
            theme={theme}
            fieldErrors={dryingErrors}
          />
          <SievingSection
            value={value.sieving}
            onChange={(sieving) => patch({ sieving })}
            disabled={disabled}
            theme={theme}
            fieldErrors={sievingErrors}
          />
        </>
      ) : null}
    </>
  );
};

export default CcMaterialProcessPanel;

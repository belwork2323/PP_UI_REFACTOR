import React, { useMemo } from "react";
import type { NonoxDProcessForm } from "../../../../../../data/models/user/rmp/nonoxDProcessForm";
import type { RmpMaterialProcessForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import LotDetailsSection from "./LotDetailsSection";
import DoaFormatSection from "./DoaFormatSection";

type Props = {
  value: NonoxDProcessForm;
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

/** NONOX-D: Lot Details + quantity sieved + mesh + dispatch block. */
const NonoxDMaterialProcessPanel = ({
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

  const patch = (partial: Partial<NonoxDProcessForm>) => {
    onChange({ ...value, ...partial });
  };

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
        title="NONOX-D"
        quantitySieved={value.quantitySieved}
        onQuantitySievedChange={(quantitySieved) => patch({ quantitySieved })}
        sieveMeshSize={value.sieveMeshSize}
        onSieveMeshSizeChange={(sieveMeshSize) => patch({ sieveMeshSize })}
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
    </>
  );
};

export default NonoxDMaterialProcessPanel;

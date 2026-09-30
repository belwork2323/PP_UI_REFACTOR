import React, { useMemo } from "react";
import type {
  RawMaterialPrepMaterialProcessSlot,
  RawMaterialPrepPremixSession,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";
import {
  isApRmpFormTemplate,
  rmpUiKeyShowsProcessPanel,
} from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import DefaultSolidMaterialProcessPanel from "./DefaultSolidMaterialProcessPanel";
import ApGradeMaterialProcessPanel, { isApGradeUiKey } from "./ApGradeMaterialProcessPanel";
import ApMaterialHostPanel, { type ApGradeCardState } from "./ApMaterialHostPanel";
import CcMaterialProcessPanel from "./CcMaterialProcessPanel";
import NonoxDMaterialProcessPanel from "./NonoxDMaterialProcessPanel";
import type { CcProcessForm } from "../../../../../../data/models/user/rmp/ccProcessForm";
import type { NonoxDProcessForm } from "../../../../../../data/models/user/rmp/nonoxDProcessForm";
import { isCcIoUiKey } from "../../../../../../data/models/user/rmp/ccProcessForm";

type Props = {
  slotState: RawMaterialPrepMaterialProcessSlot;
  onSlotChange: (next: RawMaterialPrepMaterialProcessSlot) => void;
  /** When material uses AP form template — multi-grade cards on the session. */
  session?: RawMaterialPrepPremixSession | null;
  onApGradeSlotsChange?: (cards: ApGradeCardState[]) => void;
  materialCode?: string;
  /** From material master; preferred over material-code heuristics. */
  rmpFormTemplate?: string | null;
  lotOptions?: string[];
  quantityPerPremix?: number;
  readOnly?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

const RawMaterialMaterialProcessPanel = ({
  slotState,
  onSlotChange,
  session,
  onApGradeSlotsChange,
  materialCode = "",
  rmpFormTemplate,
  lotOptions = [],
  quantityPerPremix = 0,
  readOnly = false,
  theme,
  validationErrors,
}: Props) => {
  const isAp = isApRmpFormTemplate(rmpFormTemplate);

  const apCards: ApGradeCardState[] = useMemo(() => {
    if (!isAp) return [];
    return Array.isArray(session?.apGradeSlots) ? session.apGradeSlots : [];
  }, [isAp, session?.apGradeSlots]);

  if (isAp && onApGradeSlotsChange) {
    return (
      <ApMaterialHostPanel
        cards={apCards}
        onCardsChange={onApGradeSlotsChange}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        readOnly={readOnly}
        theme={theme}
        validationErrors={validationErrors}
      />
    );
  }

  if (!rmpUiKeyShowsProcessPanel(slotState.uiKey)) {
    return null;
  }

  if (isApGradeUiKey(slotState.uiKey)) {
    return (
      <ApGradeMaterialProcessPanel
        uiKey={slotState.uiKey}
        value={slotState.processForm as any}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={readOnly}
        theme={theme}
        validationErrors={validationErrors}
        onChange={(processForm) =>
          onSlotChange({
            uiKey: slotState.uiKey,
            processForm,
          })
        }
      />
    );
  }

  if (isCcIoUiKey(slotState.uiKey)) {
    return (
      <CcMaterialProcessPanel
        value={slotState.processForm as CcProcessForm}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={readOnly}
        theme={theme}
        validationErrors={validationErrors}
        onChange={(processForm) =>
          onSlotChange({
            uiKey: slotState.uiKey,
            processForm,
          })
        }
      />
    );
  }

  if (slotState.uiKey === "nonoxD") {
    return (
      <NonoxDMaterialProcessPanel
        value={slotState.processForm as NonoxDProcessForm}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={readOnly}
        theme={theme}
        validationErrors={validationErrors}
        onChange={(processForm) =>
          onSlotChange({
            uiKey: "nonoxD",
            processForm,
          })
        }
      />
    );
  }

  return (
    <DefaultSolidMaterialProcessPanel
      value={slotState.processForm}
      lotOptions={lotOptions}
      quantityPerPremix={quantityPerPremix}
      disabled={readOnly}
      theme={theme}
      validationErrors={validationErrors}
      onChange={(processForm) =>
        onSlotChange({
          uiKey: slotState.uiKey,
          processForm,
        })
      }
    />
  );
};

export default RawMaterialMaterialProcessPanel;

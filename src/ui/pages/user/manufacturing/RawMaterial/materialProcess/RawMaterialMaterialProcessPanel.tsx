import React, { useMemo } from "react";
import type {
  RawMaterialPrepMaterialProcessSlot,
  RawMaterialPrepPremixSession,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";
import {
  isApMaterialCode,
  rmpUiKeyShowsProcessPanel,
} from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import DefaultSolidMaterialProcessPanel from "./DefaultSolidMaterialProcessPanel";
import ApGradeMaterialProcessPanel, { isApGradeUiKey } from "./ApGradeMaterialProcessPanel";
import ApMaterialHostPanel, { type ApGradeCardState } from "./ApMaterialHostPanel";

type Props = {
  slotState: RawMaterialPrepMaterialProcessSlot;
  onSlotChange: (next: RawMaterialPrepMaterialProcessSlot) => void;
  /** When material is AP — multi-grade cards on the session. */
  session?: RawMaterialPrepPremixSession | null;
  onApGradeSlotsChange?: (cards: ApGradeCardState[]) => void;
  materialCode?: string;
  lotOptions: string[];
  quantityPerPremix: number;
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
  lotOptions,
  quantityPerPremix,
  readOnly = false,
  theme,
  validationErrors,
}: Props) => {
  const apCards: ApGradeCardState[] = useMemo(() => {
    if (!isApMaterialCode(materialCode)) return [];
    return Array.isArray(session?.apGradeSlots) ? session.apGradeSlots : [];
  }, [materialCode, session?.apGradeSlots]);

  if (isApMaterialCode(materialCode) && onApGradeSlotsChange) {
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

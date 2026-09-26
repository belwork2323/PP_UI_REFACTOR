import React from "react";
import type { RawMaterialPrepMaterialProcessSlot } from "../../../../../../data/models/user/RawMaterialPreparationModel";
import { rmpUiKeyShowsProcessPanel } from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import type { DefaultSolidProcessForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import DefaultSolidMaterialProcessPanel from "./DefaultSolidMaterialProcessPanel";

type Props = {
  slotState: RawMaterialPrepMaterialProcessSlot;
  onSlotChange: (next: RawMaterialPrepMaterialProcessSlot) => void;
  readOnly?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

const RawMaterialMaterialProcessPanel = ({
  slotState,
  onSlotChange,
  readOnly = false,
  theme,
  validationErrors,
}: Props) => {
  if (!rmpUiKeyShowsProcessPanel(slotState.uiKey)) {
    return null;
  }

  if (slotState.uiKey !== "defaultSolid") {
    return null;
  }

  const form = slotState.processForm as DefaultSolidProcessForm;

  return (
    <DefaultSolidMaterialProcessPanel
      value={form}
      disabled={readOnly}
      theme={theme}
      validationErrors={validationErrors}
      onChange={(processForm) =>
        onSlotChange({
          uiKey: "defaultSolid",
          processForm,
        })
      }
    />
  );
};

export default RawMaterialMaterialProcessPanel;

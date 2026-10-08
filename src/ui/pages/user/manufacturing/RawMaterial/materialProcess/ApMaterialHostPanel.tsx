import React from "react";
import { Box } from "@mui/material";
import type { RawMaterialPrepMaterialProcessSlot } from "../../../../../../data/models/user/RawMaterialPreparationModel";
import {
  normalizeApGradeCode,
  resolveMaterialUiKey,
  type RmpMaterialUiKey,
} from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import type { RmpMaterialProcessForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import ApGradeMaterialProcessPanel, { isApGradeUiKey } from "./ApGradeMaterialProcessPanel";
import DefaultSolidMaterialProcessPanel from "./DefaultSolidMaterialProcessPanel";

export type ApGradeCardState = {
  gradeCode: string;
  slot: RawMaterialPrepMaterialProcessSlot;
};

type Props = {
  cards: ApGradeCardState[];
  onCardsChange: (next: ApGradeCardState[]) => void;
  lotOptions: string[];
  quantityPerPremix: number;
  readOnly?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

const filterErrorsForGrade = (
  errors: Record<string, string> | undefined,
  gradeCode: string,
  isOnlyCard: boolean,
): Record<string, string> => {
  if (!errors) return {};
  const prefix = `${gradeCode}:`;
  const out: Record<string, string> = {};
  Object.entries(errors).forEach(([key, message]) => {
    if (key.startsWith(prefix)) {
      out[key.slice(prefix.length)] = message;
    } else if (isOnlyCard && !key.includes(":")) {
      out[key] = message;
    }
  });
  return out;
};

/**
 * Host for AP material: one process card per identification-sheet grade.
 * Grades are not added or removed here — each tab is already a sheet grade.
 */
const ApMaterialHostPanel = ({
  cards,
  onCardsChange,
  lotOptions,
  quantityPerPremix,
  readOnly = false,
  theme,
  validationErrors,
}: Props) => {
  const updateCard = (gradeCode: string, nextSlot: RawMaterialPrepMaterialProcessSlot) => {
    onCardsChange(
      cards.map((c) =>
        normalizeApGradeCode(c.gradeCode) === normalizeApGradeCode(gradeCode)
          ? { ...c, slot: nextSlot }
          : c,
      ),
    );
  };

  return (
    <Box>
      {cards.map((card) => {
        const grade = normalizeApGradeCode(card.gradeCode);
        const gradeErrors = filterErrorsForGrade(
          validationErrors,
          grade,
          cards.length === 1,
        );
        const resolvedUiKey = isApGradeUiKey(card.slot.uiKey)
          ? card.slot.uiKey
          : resolveMaterialUiKey({
              materialCode: "",
              slot: "solid",
              gradeCode: grade,
              rmpFormTemplate: "AP",
            });
        return (
          <Box key={grade || card.gradeCode} sx={{ mb: cards.length > 1 ? 2 : 0 }}>
            {isApGradeUiKey(resolvedUiKey) ? (
              <ApGradeMaterialProcessPanel
                uiKey={resolvedUiKey}
                value={card.slot.processForm as any}
                lotOptions={lotOptions}
                quantityPerPremix={quantityPerPremix}
                disabled={readOnly}
                theme={theme}
                validationErrors={gradeErrors}
                onChange={(processForm) =>
                  updateCard(grade, { uiKey: resolvedUiKey, processForm })
                }
              />
            ) : (
              <DefaultSolidMaterialProcessPanel
                value={card.slot.processForm}
                lotOptions={lotOptions}
                quantityPerPremix={quantityPerPremix}
                disabled={readOnly}
                theme={theme}
                validationErrors={gradeErrors}
                onChange={(processForm: RmpMaterialProcessForm) =>
                  updateCard(grade, {
                    uiKey: resolvedUiKey as RmpMaterialUiKey,
                    processForm,
                  })
                }
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default ApMaterialHostPanel;

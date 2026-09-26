import React, { useMemo, useState } from "react";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CasePrepSelect from "../../CasePreparation/CasePrepSelect";
import type { RawMaterialPrepMaterialProcessSlot } from "../../../../../../data/models/user/RawMaterialPreparationModel";
import {
  AP_GRADE_OPTIONS,
  normalizeApGradeCode,
  resolveMaterialUiKey,
  type RmpMaterialUiKey,
} from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import { createEmptyProcessFormForUiKey } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
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

const gradeLabel = (gradeCode: string) =>
  AP_GRADE_OPTIONS.find((o) => o.value === gradeCode)?.label ?? gradeCode;

const makeSlotForGrade = (gradeCode: string): RawMaterialPrepMaterialProcessSlot => {
  const uiKey = resolveMaterialUiKey({
    materialCode: "AP",
    slot: "solid",
    gradeCode,
  });
  return {
    uiKey,
    processForm: createEmptyProcessFormForUiKey(uiKey),
  };
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
 * Host for AP material: pick Coarse / Fine / Ultra Fine, add/delete grade cards until locked.
 * Grade-specific process UI is rendered by ApGradeMaterialProcessPanel.
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
  const [pendingGrade, setPendingGrade] = useState("");

  const usedGrades = useMemo(
    () => new Set(cards.map((c) => normalizeApGradeCode(c.gradeCode))),
    [cards],
  );

  const availableOptions = AP_GRADE_OPTIONS.filter((o) => !usedGrades.has(o.value)).map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const addGrade = (gradeCode: string) => {
    const grade = normalizeApGradeCode(gradeCode);
    if (!grade || usedGrades.has(grade) || readOnly) return;
    onCardsChange([...cards, { gradeCode: grade, slot: makeSlotForGrade(grade) }]);
    setPendingGrade("");
  };

  const removeGrade = (gradeCode: string) => {
    if (readOnly) return;
    onCardsChange(
      cards.filter(
        (c) => normalizeApGradeCode(c.gradeCode) !== normalizeApGradeCode(gradeCode),
      ),
    );
  };

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
      {cards.length === 0 ? (
        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 1,
            p: 1.5,
            mb: 1.5,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, mb: 1 }}>
            Select AP grade to begin
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="flex-end">
            <Box sx={{ minWidth: 220, flex: 1 }}>
              <CasePrepSelect
                label="AP Grade"
                value={pendingGrade}
                placeholder="Select Coarse / Fine / Ultra Fine"
                options={AP_GRADE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                disabled={readOnly}
                width="100%"
                theme={theme}
                onChange={setPendingGrade}
              />
            </Box>
            <Button
              size="small"
              variant="contained"
              disabled={readOnly || !pendingGrade}
              onClick={() => addGrade(pendingGrade)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      ) : null}

      {cards.map((card) => {
        const grade = normalizeApGradeCode(card.gradeCode);
        const gradeErrors = filterErrorsForGrade(
          validationErrors,
          grade,
          cards.length === 1,
        );
        return (
          <Box
            key={grade}
            sx={{
              mb: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              p: 1.25,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mb: 1,
              }}
            >
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 800 }}>
                {gradeLabel(grade)}
              </Typography>
              {!readOnly ? (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => removeGrade(grade)}
                  aria-label={`Remove ${gradeLabel(grade)}`}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Box>

            {isApGradeUiKey(card.slot.uiKey) ? (
              <ApGradeMaterialProcessPanel
                uiKey={card.slot.uiKey}
                value={card.slot.processForm as any}
                lotOptions={lotOptions}
                quantityPerPremix={quantityPerPremix}
                disabled={readOnly}
                theme={theme}
                validationErrors={gradeErrors}
                onChange={(processForm) =>
                  updateCard(grade, { uiKey: card.slot.uiKey, processForm })
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
                    uiKey: card.slot.uiKey as RmpMaterialUiKey,
                    processForm,
                  })
                }
              />
            )}
          </Box>
        );
      })}

      {cards.length > 0 && availableOptions.length > 0 && !readOnly ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems="flex-end"
          sx={{ mt: 1 }}
        >
          <Box sx={{ minWidth: 220, flex: 1 }}>
            <CasePrepSelect
              label="Add AP grade"
              value={pendingGrade}
              placeholder="Select grade"
              options={availableOptions}
              width="100%"
              theme={theme}
              onChange={setPendingGrade}
            />
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddRoundedIcon fontSize="small" />}
            disabled={!pendingGrade}
            onClick={() => addGrade(pendingGrade)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Add grade
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
};

export default ApMaterialHostPanel;

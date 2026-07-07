// src/ui/pages/user/manufacturing/RawMaterial/RawMaterialBuilderPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import RawMaterialPrepFlowBar from "./RawMaterialPrepFlowBar";
import RawMaterialPremixSchemaPanel from "./RawMaterialPremixSchemaPanel";
import RawMaterialWeightmentSheetPanel from "./RawMaterialWeightmentSheetPanel";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import { DEFAULT_SELECTED_PROCESSES, materialRequiresGradeSelection } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import { SOLID_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/rawMaterialPreparation_theme";
import type { RawMaterialPrepPremixSession } from "../../../../../data/models/user/RawMaterialPreparationModel";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const { info: InfoOutlinedIcon } = icons.user.manufacturing.rawMaterial.builderPage;

const RawMaterialBuilderForm = ({
  activeBatch,
  isEditMode,
  selectedPremix,
  selectedProcesses,
  solidMaterialCode,
  solidGradeCode,
  liquidMaterialCode,
  availableSolidMaterials,
  availableLiquidMaterials,
  loadingMaterials,
  availablePremixOptions,
  onPremixChange,
  onProcessToggle,
  onSolidMaterialChange,
  onSolidGradeChange,
  onLiquidMaterialChange,
  onAddPremixSelection,
  addedPremixSelections,
  premixSessions,
  onPremixSlotChange,
  onDeletePremixSelection,
  weightmentSheet,
  onWeightmentSheetChange,
  subDepartmentId,
  theme,
  handleBack,
  onSaveDraft,
  onSubmit,
  actionLoading,
  disableActions,
}: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const labels = STRINGS.SOURCING.SPECIFICATION_FORM;
  const isResubmission = Boolean(isEditMode);
  const processes = { ...DEFAULT_SELECTED_PROCESSES, ...(selectedProcesses ?? {}) };

  const solidNeedsGrade =
    processes.solid &&
    Boolean(solidMaterialCode) &&
    materialRequiresGradeSelection(availableSolidMaterials ?? [], solidMaterialCode);

  const canAddPremixSelection =
    selectedPremix !== "" &&
    (processes.solid || processes.liquid) &&
    (!processes.solid || Boolean(solidMaterialCode)) &&
    (!solidNeedsGrade || Boolean(solidGradeCode)) &&
    (!processes.liquid || Boolean(liquidMaterialCode));

  const premixCards = Array.isArray(addedPremixSelections) ? addedPremixSelections : [];
  const [activePremixIndex, setActivePremixIndex] = useState(0);

  useEffect(() => {
    if (premixCards.length === 0) {
      setActivePremixIndex(0);
      return;
    }
    setActivePremixIndex((prev) => Math.min(prev, premixCards.length - 1));
  }, [premixCards.length]);

  const activePremixEntry = useMemo(
    () => (premixCards.length > 0 ? premixCards[activePremixIndex] : null),
    [premixCards, activePremixIndex]
  );

  const activeSession: RawMaterialPrepPremixSession | null = activePremixEntry
    ? premixSessions?.[activePremixEntry.premix] ?? null
    : null;

  return (
    <>
      <RawMaterialPrepFlowBar
        selectedPremix={selectedPremix}
        selectedProcesses={selectedProcesses}
        solidMaterialCode={solidMaterialCode}
        solidGradeCode={solidGradeCode}
        liquidMaterialCode={liquidMaterialCode}
        availableSolidMaterials={availableSolidMaterials}
        availableLiquidMaterials={availableLiquidMaterials}
        loadingMaterials={loadingMaterials}
        availablePremixOptions={availablePremixOptions}
        onPremixChange={onPremixChange}
        onProcessToggle={onProcessToggle}
        onSolidMaterialChange={onSolidMaterialChange}
        onSolidGradeChange={onSolidGradeChange}
        onLiquidMaterialChange={onLiquidMaterialChange}
        onAddPremixSelection={onAddPremixSelection}
        canAddPremixSelection={canAddPremixSelection}
        theme={theme}
      />

      {premixCards.length > 0 && activePremixEntry && activeSession && (
        <Stack spacing={1.25} mb={2}>
          <Box
            sx={{
              border: `1px solid ${theme.palette.border}`,
              borderRadius: 2,
              px: 1.2,
              py: 1,
              background: theme.palette.surface,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                size="small"
                disabled={activePremixIndex === 0}
                onClick={() => setActivePremixIndex((prev) => Math.max(0, prev - 1))}
              >
                Back
              </Button>
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.primary }}>
                Premix {activePremixIndex + 1} of {premixCards.length}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                disabled={activePremixIndex >= premixCards.length - 1}
                onClick={() => setActivePremixIndex((prev) => Math.min(premixCards.length - 1, prev + 1))}
              >
                Next
              </Button>
            </Stack>
          </Box>

          <Box
            sx={{
              border: `1px solid ${theme.palette.border}`,
              borderRadius: 2,
              px: 1,
              py: 1,
              background: theme.palette.surface,
            }}
          >
            <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: theme.palette.primary, mb: 0.4 }}>
              Premix Navigation
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 0.9 }}>
              Click any premix tab below to open that premix card and continue filling its process details.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
              {premixCards.map((entry: any, idx: number) => {
                const active = idx === activePremixIndex;
                return (
                  <Button
                    key={`premix-tab-${entry.premix}`}
                    size="small"
                    variant={active ? "contained" : "outlined"}
                    onClick={() => setActivePremixIndex(idx)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                  >
                    Premix {entry.premix}
                  </Button>
                );
              })}
            </Stack>
          </Box>

          <Box
            key={activePremixEntry.premix}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.border}`,
              background: theme.palette.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}>
                Premix - {activePremixEntry.premix}
              </Typography>
              <RemoveProcessButton
                onClick={() => onDeletePremixSelection(activePremixEntry.premix)}
                dangerColor={rmTheme.solidPreparation?.brand?.danger ?? SOLID_PREP_BRAND.danger}
                tooltip={RM.DELETE_PREMIX_TOOLTIP}
              />
            </Stack>
            <Stack spacing={0.4} mt={0.75}>
              {activePremixEntry.selectedProcesses?.solid && (
                <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text }}>
                  Solid: {activePremixEntry.solidMaterialCode || "Not selected"}
                  {activePremixEntry.solidGradeCode ? ` (${activePremixEntry.solidGradeCode})` : ""}
                </Typography>
              )}
              {activePremixEntry.selectedProcesses?.liquid && (
                <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text }}>
                  Liquid: {activePremixEntry.liquidMaterialCode || "Not selected"}
                </Typography>
              )}
            </Stack>

            {activePremixEntry.selectedProcesses?.solid && (
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer}>
                <RawMaterialPremixSchemaPanel
                  slot="solid"
                  materialCode={activePremixEntry.solidMaterialCode}
                  materialId={activePremixEntry.solidMaterialId}
                  gradeCode={activePremixEntry.solidGradeCode}
                  gradeId={activePremixEntry.solidGradeId}
                  materials={availableSolidMaterials as MaterialsListItem[]}
                  subDepartmentId={subDepartmentId}
                  batchId={activeBatch?.batchId}
                  slotState={activeSession.solid}
                  savedSections={activeSession.pendingSolidSections}
                  onSlotChange={(next) =>
                    onPremixSlotChange(activePremixEntry.premix, "solid", next)
                  }
                />
              </Box>
            )}

            {activePremixEntry.selectedProcesses?.liquid && (
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer}>
                <RawMaterialPremixSchemaPanel
                  slot="liquid"
                  materialCode={activePremixEntry.liquidMaterialCode}
                  materialId={activePremixEntry.liquidMaterialId}
                  materials={availableLiquidMaterials as MaterialsListItem[]}
                  subDepartmentId={subDepartmentId}
                  batchId={activeBatch?.batchId}
                  slotState={activeSession.liquid}
                  savedSections={activeSession.pendingLiquidSections}
                  onSlotChange={(next) =>
                    onPremixSlotChange(activePremixEntry.premix, "liquid", next)
                  }
                />
              </Box>
            )}
          </Box>

        </Stack>
      )}

      {premixCards.length > 0 && (
        <RawMaterialWeightmentSheetPanel
          value={weightmentSheet}
          onChange={onWeightmentSheetChange}
          theme={theme}
        />
      )}

      {premixCards.length === 0 && (
        <Box sx={rmTheme.builder.emptyStateBox}>
          <InfoOutlinedIcon sx={rmTheme.builder.emptyStateIcon} />
          <Typography sx={rmTheme.builder.emptyStateTitle}>{RM.NO_PROCESS_SELECTED_TITLE}</Typography>
          <Typography sx={rmTheme.builder.emptyStateSubtitle}>{RM.NO_PROCESS_SELECTED_SUBTITLE}</Typography>
        </Box>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} mt={3} justifyContent="flex-end">
        <Button variant="outlined" disabled={actionLoading || disableActions} onClick={onSaveDraft}>
          {labels.SAVE_DRAFT}
        </Button>
        <Button variant="contained" disabled={actionLoading || disableActions} onClick={onSubmit}>
          {isResubmission ? labels.RESUBMIT_APPROVAL : labels.SUBMIT_APPROVAL}
        </Button>
      </Stack>
    </>
  );
};

export default RawMaterialBuilderForm;

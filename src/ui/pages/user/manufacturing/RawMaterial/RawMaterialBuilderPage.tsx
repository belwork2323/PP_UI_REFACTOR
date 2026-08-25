// src/ui/pages/user/manufacturing/RawMaterial/RawMaterialBuilderPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import RawMaterialPremixSchemaPanel from "./RawMaterialPremixSchemaPanel";
import RawMaterialWeightmentSheetPanel from "./RawMaterialWeightmentSheetPanel";
import FlowBarDateField from "../../../../components/common/FlowBarDateField";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import {
  createEmptyPremixSchemaSession,
  isWeightmentSheetEditable,
  type PremixStatusMeta,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip from "./components/PremixStatusChip";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalPremixDialog, {
  buildFinalApprovalPremixRows,
} from "./components/FinalApprovalPremixDialog";
import type {
  RawMaterialPrepPremixSelection,
  RawMaterialPrepPremixSession,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";
import { getPremixMaterialSessionKey } from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const { info: InfoOutlinedIcon } = icons.user.manufacturing.rawMaterial.builderPage;

const formatSheetNumber = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object" && value !== null && "parsedValue" in (value as object)) {
    const parsed = (value as { parsedValue?: unknown }).parsedValue;
    if (parsed != null && parsed !== "") return String(parsed);
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : String(value);
};

const RawMaterialBuilderForm = ({
  activeBatch,
  isEditMode,
  numberOfPremix,
  premixGroups,
  identificationSheet,
  onPremixDateChange,
  addedPremixSelections,
  premixSessions,
  onPremixSlotChange,
  allMaterials,
  availableSolidMaterials,
  availableLiquidMaterials,
  weightmentSheet,
  onWeightmentSheetChange,
  subDepartmentId,
  theme,
  onSavePremixDraft,
  onSubmitPremix,
  premixStatusByNo,
  isPremixEditable,
  actionLoading,
}: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const groups = Array.isArray(premixGroups) ? premixGroups : [];
  const [activePremixIndex, setActivePremixIndex] = useState(0);
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);

  useEffect(() => {
    if (groups.length === 0) {
      setActivePremixIndex(0);
      setActiveMaterialIndex(0);
      return;
    }
    setActivePremixIndex((prev) => Math.min(prev, groups.length - 1));
  }, [groups.length]);

  const activePremixGroup = useMemo(
    () => (groups.length > 0 ? groups[activePremixIndex] : null),
    [groups, activePremixIndex],
  );

  const activePremixMaterials = useMemo(
    () => (activePremixGroup?.materials ?? []) as RawMaterialPrepPremixSelection[],
    [activePremixGroup],
  );

  useEffect(() => {
    if (activePremixMaterials.length === 0) {
      setActiveMaterialIndex(0);
      return;
    }
    setActiveMaterialIndex((prev) => Math.min(prev, activePremixMaterials.length - 1));
  }, [activePremixMaterials.length, activePremixIndex]);

  const activeMaterialEntry = useMemo(
    () =>
      activePremixMaterials.length > 0 ? activePremixMaterials[activeMaterialIndex] : null,
    [activePremixMaterials, activeMaterialIndex],
  );

  const activeSession: RawMaterialPrepPremixSession = activeMaterialEntry
    ? premixSessions?.[
        getPremixMaterialSessionKey(activeMaterialEntry.premix, activeMaterialEntry.materialKey)
      ] ?? createEmptyPremixSchemaSession()
    : createEmptyPremixSchemaSession();

  const schemaMaterials = (Array.isArray(allMaterials) && allMaterials.length > 0
    ? allMaterials
    : [
        ...(Array.isArray(availableSolidMaterials) ? availableSolidMaterials : []),
        ...(Array.isArray(availableLiquidMaterials) ? availableLiquidMaterials : []),
      ]) as MaterialsListItem[];

  const sheetMaterialCount = identificationSheet?.materials?.length ?? 0;
  const statusConfig = rmTheme.details.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const navPalette = {
    primary: theme.palette.primary,
    primaryLight: theme.palette.primaryLight,
    border: theme.palette.border,
    surface: theme.palette.surface,
    textSub: theme.palette.textSub,
    text: theme.palette.text,
  };

  const premixTotal = numberOfPremix || groups.length;

  const premixTabs: UserWorkflowNavTab[] = useMemo(
    () =>
      groups.map((group: { premix: number }) => {
        const statusMeta = (premixStatusByNo as Record<number, PremixStatusMeta>)?.[group.premix];
        const active = groups[activePremixIndex]?.premix === group.premix;
        return {
          id: `premix-${group.premix}`,
          label: `${RM.PREMIX_STEP_LABEL} ${group.premix}`,
          endAdornment: (
            <PremixStatusChip
              status={statusMeta?.premixSubmissionStatus}
              statusConfig={statusConfig}
              variant="embedded"
              onAccent={active}
            />
          ),
        };
      }),
    [groups, premixStatusByNo, statusConfig, activePremixIndex],
  );

  const materialTabs: UserWorkflowNavTab[] = useMemo(
    () =>
      activePremixMaterials.map((entry) => ({
        id: `premix-material-${entry.premix}-${entry.materialKey}`,
        label: `Premix-${entry.premix} ${entry.solidMaterialCode || entry.liquidMaterialCode}`,
      })),
    [activePremixMaterials],
  );

  const activePremixNo = activePremixGroup?.premix ?? 0;
  const activePremixLocked = activePremixNo > 0 && !isPremixEditable(activePremixNo);
  const activePremixStatus = (premixStatusByNo as Record<number, PremixStatusMeta>)?.[activePremixNo]
    ?.premixSubmissionStatus;
  const weightmentSheetEditable = useMemo(
    () => isWeightmentSheetEditable(premixStatusByNo),
    [premixStatusByNo],
  );

  const finalApprovalRows = useMemo(
    () => buildFinalApprovalPremixRows(premixStatusByNo, premixTotal),
    [premixStatusByNo, premixTotal],
  );

  return (
    <>
      {groups.length > 0 && activePremixGroup && activeMaterialEntry && (
        <Stack spacing={1.25} mb={2}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={RM.PREMIX_NAV_TITLE}
              hint={RM.PREMIX_NAV_HINT}
              tabs={premixTabs}
              activeIndex={activePremixIndex}
              onActiveIndexChange={(index) => {
                setActivePremixIndex(index);
                setActiveMaterialIndex(0);
              }}
              palette={navPalette}
              showStepArrows
              mb={1}
            />
            <UserWorkflowTabNav
              title={RM.MATERIAL_NAV_TITLE}
              tabs={materialTabs}
              activeIndex={activeMaterialIndex}
              onActiveIndexChange={setActiveMaterialIndex}
              palette={navPalette}
              showStepArrows
            />
          </UserWorkflowNavPanel>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={actionLoading || activePremixLocked}
              onClick={() => onSavePremixDraft(activeMaterialEntry.premix)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {RM.SAVE_PREMIX_DRAFT(activeMaterialEntry.premix)}
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading || activePremixLocked}
              onClick={() => onSubmitPremix(activeMaterialEntry.premix)}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {RM.SUBMIT_PREMIX(activeMaterialEntry.premix)}
            </Button>
            <ViewStatusButton
              disabled={actionLoading}
              onClick={() => setFinalApprovalOpen(true)}
              label={RM.VIEW_STATUS}
            />
          </Stack>

          <Box
            key={`${activeMaterialEntry.premix}-${activeMaterialEntry.materialKey}`}
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${theme.palette.border}`,
              background: theme.palette.surface,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              mb={1}
            >
              <Stack direction="row" alignItems="center" gap={0.85} minWidth={0} flexWrap="wrap">
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}>
                  Premix {activeMaterialEntry.premix} ·{" "}
                  {activeMaterialEntry.solidMaterialCode || activeMaterialEntry.liquidMaterialCode}
                </Typography>
                {activeMaterialEntry.selectedProcesses?.solid ? (
                  <Chip
                    size="small"
                    label="Solid"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700 }}
                  />
                ) : null}
                {activeMaterialEntry.selectedProcesses?.liquid ? (
                  <Chip
                    size="small"
                    label="Liquid"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.65rem", fontWeight: 700 }}
                  />
                ) : null}
                {activePremixNo > 0 ? (
                  <PremixStatusChip
                    status={activePremixStatus}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                ) : null}
              </Stack>
            </Stack>

            {activePremixLocked ? (
              <Box
                sx={{
                  mb: 1,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: `1px solid ${theme.palette.border}`,
                  bgcolor: theme.palette.background,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}>
                  {activePremixStatus === "APPROVED"
                    ? RM.PREMIX_LOCKED_APPROVED
                    : RM.PREMIX_LOCKED_WAITING}
                </Typography>
              </Box>
            ) : null}

            <Box
              sx={{
                border: `1px solid ${theme.palette.border}`,
                borderRadius: 1.5,
                px: 1.25,
                py: 0.85,
                mb: 1.25,
                background: theme.palette.background,
              }}
            >
              <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: theme.palette.primary, mb: 0.65 }}>
                Material Details (Identification Sheet)
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                  columnGap: 1.25,
                  rowGap: 0.65,
                }}
              >
                {(
                  [
                    [
                      "Material Code",
                      activeMaterialEntry.solidMaterialCode ||
                        activeMaterialEntry.liquidMaterialCode ||
                        "—",
                    ],
                    ["Material Name", activeMaterialEntry.materialName || "—"],
                    ["Grade", activeMaterialEntry.solidGradeCode || "—"],
                    ["Lot ID", activeMaterialEntry.lotId || "—"],
                    ["Make", activeMaterialEntry.make || "—"],
                    [
                      "Qty / Premix",
                      `${formatSheetNumber(activeMaterialEntry.quantityPerPremix)} kg`,
                    ],
                    [
                      "Required Composition",
                      `${formatSheetNumber(activeMaterialEntry.requiredComposition)}%`,
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <Box key={label} minWidth={0}>
                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        fontWeight: 600,
                        color: theme.palette.textSub,
                        lineHeight: 1.2,
                        mb: 0.15,
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        lineHeight: 1.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={String(value)}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {activeMaterialEntry.selectedProcesses?.solid &&
              activeMaterialEntry.solidMaterialCode &&
              Boolean(activeMaterialEntry.solidGradeCode || !activeMaterialEntry.solidGradeCode) && (
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75 }}>
                  Solid: {activeMaterialEntry.solidMaterialCode}
                  {activeMaterialEntry.solidGradeCode ? ` (${activeMaterialEntry.solidGradeCode})` : ""}
                </Typography>
                <Box sx={{ mb: 1, maxWidth: 240 }}>
                  <FlowBarDateField
                    label={RM.SELECT_PREMIX_DATE_LABEL}
                    value={activeMaterialEntry.premixDate ?? activePremixGroup.premixDate ?? ""}
                    placeholder={RM.SELECT_PREMIX_DATE_PLACEHOLDER}
                    width={220}
                    flowBar={rmTheme.flowBar}
                    accentColor={theme.palette.primaryLight ?? theme.palette.primary}
                    disabled={activePremixLocked}
                    onChange={(value) => onPremixDateChange(activeMaterialEntry.premix, value)}
                  />
                </Box>
                <RawMaterialPremixSchemaPanel
                  key={`schema-solid-${activeMaterialEntry.premix}-${activeMaterialEntry.materialKey}`}
                  slot="solid"
                  materialCode={activeMaterialEntry.solidMaterialCode}
                  materialId={activeMaterialEntry.solidMaterialId}
                  gradeCode={activeMaterialEntry.solidGradeCode}
                  gradeId={activeMaterialEntry.solidGradeId}
                  materials={schemaMaterials}
                  subDepartmentId={subDepartmentId}
                  batchId={activeBatch?.batchId}
                  slotState={activeSession.solid}
                  savedSections={activeSession.pendingSolidSections}
                  onSlotChange={(next) =>
                    onPremixSlotChange(
                      activeMaterialEntry.premix,
                      activeMaterialEntry.materialKey,
                      "solid",
                      next,
                    )
                  }
                  readOnly={activePremixLocked}
                />
              </Box>
              )}

            {activeMaterialEntry.selectedProcesses?.liquid && activeMaterialEntry.liquidMaterialCode && (
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75 }}>
                  Liquid: {activeMaterialEntry.liquidMaterialCode}
                </Typography>
                {!activeMaterialEntry.selectedProcesses?.solid ? (
                  <Box sx={{ mb: 1, maxWidth: 240 }}>
                    <FlowBarDateField
                      label={RM.SELECT_PREMIX_DATE_LABEL}
                      value={activeMaterialEntry.premixDate ?? activePremixGroup.premixDate ?? ""}
                      placeholder={RM.SELECT_PREMIX_DATE_PLACEHOLDER}
                      width={220}
                      flowBar={rmTheme.flowBar}
                      accentColor={theme.palette.primaryLight ?? theme.palette.primary}
                      disabled={activePremixLocked}
                      onChange={(value) => onPremixDateChange(activeMaterialEntry.premix, value)}
                    />
                  </Box>
                ) : null}
                <RawMaterialPremixSchemaPanel
                  key={`schema-liquid-${activeMaterialEntry.premix}-${activeMaterialEntry.materialKey}`}
                  slot="liquid"
                  materialCode={activeMaterialEntry.liquidMaterialCode}
                  materialId={activeMaterialEntry.liquidMaterialId}
                  materials={schemaMaterials}
                  subDepartmentId={subDepartmentId}
                  batchId={activeBatch?.batchId}
                  slotState={activeSession.liquid}
                  savedSections={activeSession.pendingLiquidSections}
                  onSlotChange={(next) =>
                    onPremixSlotChange(
                      activeMaterialEntry.premix,
                      activeMaterialEntry.materialKey,
                      "liquid",
                      next,
                    )
                  }
                  readOnly={activePremixLocked}
                />
              </Box>
            )}
          </Box>
        </Stack>
      )}

      {groups.length > 0 && (
        <RawMaterialWeightmentSheetPanel
          value={weightmentSheet}
          onChange={onWeightmentSheetChange}
          theme={theme}
          batchId={activeBatch?.batchId ?? ""}
          identificationSheet={identificationSheet}
          disabled={!weightmentSheetEditable}
        />
      )}

      {groups.length === 0 && (
        <Box sx={rmTheme.builder.emptyStateBox}>
          <InfoOutlinedIcon sx={rmTheme.builder.emptyStateIcon} />
          <Typography sx={rmTheme.builder.emptyStateTitle}>{RM.NO_PROCESS_SELECTED_TITLE}</Typography>
          <Typography sx={rmTheme.builder.emptyStateSubtitle}>
            {sheetMaterialCount > 0
              ? "Batch identification sheet premix details are required to load this form."
              : "No materials found in the batch identification sheet."}
          </Typography>
        </Box>
      )}

      <FinalApprovalPremixDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        onClose={() => setFinalApprovalOpen(false)}
      />
    </>
  );
};

export default RawMaterialBuilderForm;

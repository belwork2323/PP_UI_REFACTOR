import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import RawMaterialMaterialProcessPanel from "./materialProcess/RawMaterialMaterialProcessPanel";
import RawMaterialWeightmentSheetPanel from "./RawMaterialWeightmentSheetPanel";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import {
  createEmptyPremixProcessSession,
  isWeightmentSheetEditable,
  type PremixStatusMeta,
  type RawMaterialPrepPremixSelection,
  type RawMaterialPrepPremixSession,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip from "./components/PremixStatusChip";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalPremixDialog, {
  buildFinalApprovalPremixRows,
} from "./components/FinalApprovalPremixDialog";
import type { MaterialsListItem } from "../../../../../data/models/user/MaterialsListModel";
import { findMaterialByCode } from "../../../../../data/models/user/MaterialsListModel";
import {
  focusRmpField,
  type RmpValidationFocusTarget,
} from "../../../../../data/validation/adapters/rawMaterialPreparation.validation";
import {
  formatRmpMaterialNavLabel,
  getPremixMaterialSessionKey,
} from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import {
  ensureWeightmentRowsForPremixMaterials,
  filterWeightmentSheetForPremix,
  mergeWeightmentSheetForPremix,
} from "../../../../../hooks/user/qualityControl/qcProcessingMaterials";

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
  addedPremixSelections,
  premixSessions,
  onPremixSlotChange,
  onApGradeSlotsChange,
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
  premixFieldErrors = {},
  weightmentErrors = {},
  validationAttempt = { format: false, unit: false, submit: false },
  validationFocusRequest = null,
}: any) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const groups = Array.isArray(premixGroups) ? premixGroups : [];
  const [activePremixIndex, setActivePremixIndex] = useState(0);
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<RmpValidationFocusTarget | null>(null);

  useEffect(() => {
    if (groups.length === 0) {
      setActivePremixIndex(0);
      setActiveMaterialIndex(0);
      return;
    }
    setActivePremixIndex((prev) => Math.min(prev, groups.length - 1));
  }, [groups.length]);

  /** Switch premix/material tabs to the first error; focus runs after tabs settle. */
  useEffect(() => {
    const request = validationFocusRequest as
      | { id: number; target: RmpValidationFocusTarget | null }
      | null;
    if (!request?.target) return;
    const target = request.target;

    const premixIdx = groups.findIndex(
      (group: { premix?: number }) => Number(group?.premix) === target.premixNo,
    );
    if (premixIdx >= 0) {
      setActivePremixIndex(premixIdx);
    }

    const materials =
      premixIdx >= 0
        ? ((groups[premixIdx]?.materials ?? []) as RawMaterialPrepPremixSelection[])
        : [];
    if (target.materialKey) {
      const materialIdx = materials.findIndex((entry) => entry.materialKey === target.materialKey);
      if (materialIdx >= 0) {
        setActiveMaterialIndex(materialIdx);
      }
    }

    setPendingFocus(target);
  }, [validationFocusRequest, groups]);

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

  /** After tab state matches the error target, scroll/focus the field. */
  useEffect(() => {
    if (!pendingFocus) return;

    const activePremixNo = Number(activePremixGroup?.premix ?? 0);
    if (activePremixNo !== pendingFocus.premixNo) return;

    if (pendingFocus.materialKey) {
      if (!activeMaterialEntry || activeMaterialEntry.materialKey !== pendingFocus.materialKey) {
        return;
      }
    }

    const timer = window.setTimeout(() => {
      const root: ParentNode =
        pendingFocus.slot != null
          ? (document.querySelector(`[data-rmp-slot="${pendingFocus.slot}"]`) ?? document)
          : document;
      focusRmpField(pendingFocus.fieldPath, root);
      setPendingFocus(null);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [pendingFocus, activePremixGroup, activeMaterialEntry]);

  const activeMaterialCode = useMemo(() => {
    if (!activeMaterialEntry) return "";
    return String(
      activeMaterialEntry.solidMaterialCode ||
        activeMaterialEntry.liquidMaterialCode ||
        "",
    ).trim();
  }, [activeMaterialEntry]);

  const activePremixNoForWeightment = activePremixGroup?.premix ?? 0;

  const { activePremixWeightmentSheet, activeWeightmentRowSourceIndices } = useMemo(() => {
    if (!activePremixNoForWeightment) {
      return {
        activePremixWeightmentSheet: null as RawMaterialPrepWeightmentSheet | null,
        activeWeightmentRowSourceIndices: undefined as number[] | undefined,
      };
    }
    const scoped = filterWeightmentSheetForPremix(
      weightmentSheet,
      activePremixNoForWeightment,
    );
    const rowSourceIndices: number[] = [];
    (weightmentSheet.weightmentDetails ?? []).forEach((row, idx) => {
      const rowPremix =
        row.premixNo == null || !Number.isFinite(Number(row.premixNo))
          ? null
          : Number(row.premixNo);
      if (rowPremix === activePremixNoForWeightment) {
        rowSourceIndices.push(idx);
      }
    });
    return {
      activePremixWeightmentSheet: scoped,
      activeWeightmentRowSourceIndices: rowSourceIndices.length
        ? rowSourceIndices
        : undefined,
    };
  }, [activePremixNoForWeightment, weightmentSheet]);

  useEffect(() => {
    if (!activePremixNoForWeightment || !onWeightmentSheetChange) return;
    const ensured = ensureWeightmentRowsForPremixMaterials(weightmentSheet, {
      premixNo: activePremixNoForWeightment,
      materials: identificationSheet?.materials ?? [],
    });
    if (
      JSON.stringify(ensured.weightmentDetails) ===
      JSON.stringify(weightmentSheet.weightmentDetails)
    ) {
      return;
    }
    onWeightmentSheetChange(ensured);
  }, [
    activePremixNoForWeightment,
    identificationSheet?.materials,
    onWeightmentSheetChange,
    weightmentSheet,
  ]);

  const handlePremixWeightmentChange = (
    next:
      | RawMaterialPrepWeightmentSheet
      | ((prev: RawMaterialPrepWeightmentSheet) => RawMaterialPrepWeightmentSheet),
  ) => {
    if (!activePremixNoForWeightment || !onWeightmentSheetChange) return;
    onWeightmentSheetChange((prevFull) => {
      const currentFiltered = filterWeightmentSheetForPremix(
        prevFull,
        activePremixNoForWeightment,
      );
      const resolvedFiltered = typeof next === "function" ? next(currentFiltered) : next;
      return mergeWeightmentSheetForPremix(
        prevFull,
        {
          ...resolvedFiltered,
          weightmentDetails: (resolvedFiltered.weightmentDetails ?? []).map((row) => ({
            ...row,
            premixNo: row.premixNo ?? activePremixNoForWeightment,
            scopeMaterialCode:
              String(row.scopeMaterialCode ?? "").trim() ||
              String(row.materialCode ?? "").trim() ||
              null,
          })),
        },
        activePremixNoForWeightment,
      );
    });
  };

  const activeSession: RawMaterialPrepPremixSession = activeMaterialEntry
    ? premixSessions?.[
        getPremixMaterialSessionKey(activeMaterialEntry.premix, activeMaterialEntry.materialKey)
      ] ?? createEmptyPremixProcessSession()
    : createEmptyPremixProcessSession();

  const activeSolidRmpFormTemplate = useMemo(() => {
    if (!activeMaterialEntry?.solidMaterialCode) return null;
    return (
      activeMaterialEntry.solidRmpFormTemplate ??
      findMaterialByCode(availableSolidMaterials ?? [], activeMaterialEntry.solidMaterialCode)
        ?.rmpFormTemplate ??
      null
    );
  }, [
    activeMaterialEntry?.solidMaterialCode,
    activeMaterialEntry?.solidRmpFormTemplate,
    availableSolidMaterials,
  ]);

  const activeLiquidRmpFormTemplate = useMemo(() => {
    if (!activeMaterialEntry?.liquidMaterialCode) return null;
    return (
      activeMaterialEntry.liquidRmpFormTemplate ??
      findMaterialByCode(availableLiquidMaterials ?? [], activeMaterialEntry.liquidMaterialCode)
        ?.rmpFormTemplate ??
      null
    );
  }, [
    activeMaterialEntry?.liquidMaterialCode,
    activeMaterialEntry?.liquidRmpFormTemplate,
    availableLiquidMaterials,
  ]);

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
        label: formatRmpMaterialNavLabel(entry),
      })),
    [activePremixMaterials],
  );

  const activePremixNo = activePremixGroup?.premix ?? 0;
  const activePremixLocked = activePremixNo > 0 && !isPremixEditable(activePremixNo);
  const activePremixStatus = (premixStatusByNo as Record<number, PremixStatusMeta>)?.[activePremixNo]
    ?.premixSubmissionStatus;
  const weightmentSheetEditable = useMemo(
    () => isWeightmentSheetEditable(premixStatusByNo, activePremixNo),
    [premixStatusByNo, activePremixNo],
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
            <SubmitForApprovalButton
              disabled={actionLoading || activePremixLocked}
              onClick={() => onSubmitPremix(activeMaterialEntry.premix)}
              label={RM.SUBMIT_PREMIX(activeMaterialEntry.premix)}
            />
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
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer} data-rmp-slot="solid">
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75 }}>
                  Solid: {activeMaterialEntry.solidMaterialCode}
                  {activeMaterialEntry.solidGradeCode ? ` (${activeMaterialEntry.solidGradeCode})` : ""}
                </Typography>
                <RawMaterialMaterialProcessPanel
                  key={`process-solid-${activeMaterialEntry.premix}-${activeMaterialEntry.materialKey}`}
                  slotState={activeSession.solid}
                  session={activeSession}
                  materialCode={activeMaterialEntry.solidMaterialCode}
                  rmpFormTemplate={activeSolidRmpFormTemplate}
                  lotOptions={activeMaterialEntry.lotIds ?? []}
                  quantityPerPremix={Number(activeMaterialEntry.quantityPerPremix ?? 0)}
                  onSlotChange={(next) =>
                    onPremixSlotChange(
                      activeMaterialEntry.premix,
                      activeMaterialEntry.materialKey,
                      "solid",
                      next,
                    )
                  }
                  onApGradeSlotsChange={
                    onApGradeSlotsChange
                      ? (cards) =>
                          onApGradeSlotsChange(
                            activeMaterialEntry.premix,
                            activeMaterialEntry.materialKey,
                            cards,
                          )
                      : undefined
                  }
                  readOnly={activePremixLocked}
                  theme={theme}
                  validationErrors={
                    premixFieldErrors[
                      `${activeMaterialEntry.premix}:${activeMaterialEntry.materialKey}:solid`
                    ]
                  }
                />
              </Box>
              )}

            {activeMaterialEntry.selectedProcesses?.liquid && activeMaterialEntry.liquidMaterialCode && (
              <Box mt={1.2} sx={rmTheme.builder.sectionContainer} data-rmp-slot="liquid">
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75 }}>
                  Liquid: {activeMaterialEntry.liquidMaterialCode}
                </Typography>
                <RawMaterialMaterialProcessPanel
                  key={`process-liquid-${activeMaterialEntry.premix}-${activeMaterialEntry.materialKey}`}
                  slotState={activeSession.liquid}
                  materialCode={activeMaterialEntry.liquidMaterialCode}
                  rmpFormTemplate={activeLiquidRmpFormTemplate}
                  lotOptions={activeMaterialEntry.lotIds ?? []}
                  quantityPerPremix={Number(activeMaterialEntry.quantityPerPremix ?? 0)}
                  onSlotChange={(next) =>
                    onPremixSlotChange(
                      activeMaterialEntry.premix,
                      activeMaterialEntry.materialKey,
                      "liquid",
                      next,
                    )
                  }
                  readOnly={activePremixLocked}
                  theme={theme}
                  validationErrors={
                    premixFieldErrors[
                      `${activeMaterialEntry.premix}:${activeMaterialEntry.materialKey}:liquid`
                    ]
                  }
                />
              </Box>
            )}
          </Box>

          {activePremixWeightmentSheet ? (
            <RawMaterialWeightmentSheetPanel
              key={`weightment-premix-${activePremixNoForWeightment}`}
              value={activePremixWeightmentSheet}
              onChange={handlePremixWeightmentChange}
              theme={theme}
              batchId={activeBatch?.batchId ?? ""}
              identificationSheet={identificationSheet}
              premixNo={activePremixNoForWeightment}
              disabled={!weightmentSheetEditable}
              allowAddRemoveRows={true}
              weightmentErrors={weightmentErrors}
              validationAttempt={validationAttempt}
              rowSourceIndices={activeWeightmentRowSourceIndices}
            />
          ) : null}
        </Stack>
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

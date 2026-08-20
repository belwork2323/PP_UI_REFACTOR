import { useCallback, useEffect, useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { QcDivisionEntry, QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import {
  buildDivisionNavGroups,
  resolveActiveNavContent,
} from "../../../../../hooks/user/qualityControl/qcDivisionNav";
import {
  getLiquidSchemaForBothEntry,
  getSchemaForDivisionEntry,
  getSolidSchemaForBothEntry,
} from "../../../../../hooks/user/qualityControl/qcDivisionEntries";
import { QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID, getMixingFinalMixEntries } from "../../../../../hooks/user/qualityControl/qcMixingConfig";
import {
  applyMixingDivisionEntryToValues,
  createInitialFinalMixDetailsValues,
  hydrateMixingDetailsValuesFromSections,
  mergeFinalMixEntrySchemaValues,
  pickFinalMixDetailsSchemaValues,
  pickViscositySchemaValues,
  resolveMixingDetailsSeed,
  type QcMixingQualityCheckDefinition,
} from "../../../../../hooks/user/qualityControl/qcMixingTables";
import QCMixingDetailsTable from "./QCMixingDetailsTable";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import QCDivisionEntryPanel, { type QCDivisionEntryUnitActions } from "./QCDivisionEntryPanel";
import QCProcessingMaterialsPanel from "./QCProcessingMaterialsPanel";
import QCSchemaBufferingLoader from "./QCSchemaBufferingLoader";
import QCHardwareAttachmentUpload from "./QCHardwareAttachmentUpload";
import { createInitialHardwareProcessValues } from "../../../../../hooks/user/qualityControl/qcHardwareTables";
import { resolveHardwareUploadAnchorEntry } from "../../../../../hooks/user/qualityControl/qcHardwareConfig";
import type { QcPartialNavItem } from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import { resolveQcUnitActionLabels } from "../../../../../hooks/user/qualityControl/qcDivisionUnitActionLabels";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const resolveVisibleEntries = (
  activeContent: ReturnType<typeof resolveActiveNavContent>,
): QcDivisionEntry[] => {
  if (!activeContent) return [];
  if (activeContent.type === "entry") return [activeContent.entry];
  if (activeContent.type === "motor-entries") return activeContent.entries;
  return [];
};

export type QCDivisionFormBodyProps = {
  batch?: { batchId?: string } | null;
  divisionAutoPopulateData?: Record<string, unknown> | null;
  mixingQualityChecksByStage?: {
    PREMIX: QcMixingQualityCheckDefinition[];
    FINAL_MIX: QcMixingQualityCheckDefinition[];
  };
  formData: QualityControlFormState;
  subDepartmentId?: number;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  readOnly?: boolean;
  /** Block field edits (Waiting / Approved) without forcing details theme. */
  fieldsDisabled?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  onDivisionEntryValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onDivisionEntryLiquidValuesChange: (entryId: string, values: SchemaFormValues) => void;
  onMixingFinalMixDetailsChange: (values: SchemaFormValues) => void;
  onRemoveDivisionEntry: (entryId: string) => void;
  /** When true, hide entry-group switcher (catalog division tabs + partial nav own navigation). */
  hideEntryGroupNav?: boolean;
  activePartialItem?: QcPartialNavItem | null;
  unitActions?: QCDivisionEntryUnitActions | null;
  theme: any;
};

const QCDivisionFormBody = ({
  batch,
  divisionAutoPopulateData = null,
  mixingQualityChecksByStage = { PREMIX: [], FINAL_MIX: [] },
  formData,
  subDepartmentId,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  readOnly = false,
  fieldsDisabled = false,
  schemaLoading = false,
  schemaError = null,
  hideEntryGroupNav = false,
  activePartialItem = null,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  onDivisionEntryValuesChange,
  onDivisionEntryLiquidValuesChange,
  onMixingFinalMixDetailsChange,
  onRemoveDivisionEntry,
  unitActions = null,
  theme,
}: QCDivisionFormBodyProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const divisionEntries = formData.divisionEntries ?? [];
  const hasDivisionEntries = divisionEntries.length > 0;

  const finalMixDetailSections = useMemo(
    () =>
      (formData.savedSections ?? []).filter(
        (section) => section.sectionId === QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID,
      ),
    [formData.savedSections],
  );

  const navGroups = useMemo(() => buildDivisionNavGroups(divisionEntries), [divisionEntries]);
  const safeGroupIndex = Math.min(Math.max(activeDivisionGroupIndex, 0), Math.max(0, navGroups.length - 1));
  const activeGroup = navGroups[safeGroupIndex];
  const subNavCount =
    activeGroup?.kind === "motor-based"
      ? activeGroup.motorTabs.length
      : activeGroup?.kind === "mixing"
        ? activeGroup.tabs.length
        : activeGroup?.kind === "entries"
          ? activeGroup.entries.length
          : 0;
  const safeSubIndex = Math.min(Math.max(activeDivisionSubIndex, 0), Math.max(0, subNavCount - 1));
  const activeContent = useMemo(
    () => resolveActiveNavContent(navGroups, safeGroupIndex, safeSubIndex),
    [navGroups, safeGroupIndex, safeSubIndex],
  );
  const activeEntry = activeContent?.type === "entry" ? activeContent.entry : null;
  const activeMotorId = activeContent?.type === "motor-entries" ? activeContent.motorId : null;

  const finalMixSeedPremixNo = useMemo(() => {
    if (activeEntry?.kind === "MIXING_FINAL_MIX" && activeEntry.premixNo != null) {
      return activeEntry.premixNo;
    }
    const finalMixEntries = getMixingFinalMixEntries(divisionEntries);
    return finalMixEntries[0]?.premixNo ?? null;
  }, [activeEntry?.kind, activeEntry?.premixNo, divisionEntries]);

  const finalMixAutoSeed = useMemo(
    () =>
      resolveMixingDetailsSeed({
        variant: "finalMix",
        premixNo: finalMixSeedPremixNo,
        autoPopulatePayload:
          (divisionAutoPopulateData as { __manufacturingDivisionData?: unknown } | null)
            ?.__manufacturingDivisionData ?? divisionAutoPopulateData,
        batchPayload: batch,
      }),
    [batch, divisionAutoPopulateData, finalMixSeedPremixNo],
  );

  const finalMixDetailsValues = useMemo(() => {
    const fromActiveEntry =
      activeEntry?.kind === "MIXING_FINAL_MIX"
        ? pickFinalMixDetailsSchemaValues(
            formData.divisionEntryValues?.[activeEntry.entryId]?.schemaValues,
          )
        : null;
    if (fromActiveEntry && Object.keys(fromActiveEntry).length > 0) {
      return fromActiveEntry;
    }
    if (formData.mixingFinalMixDetailsValues) {
      return formData.mixingFinalMixDetailsValues;
    }
    if (finalMixDetailSections.length) {
      return hydrateMixingDetailsValuesFromSections(finalMixDetailSections, "finalMix");
    }
    return createInitialFinalMixDetailsValues(mixingQualityChecksByStage.FINAL_MIX);
  }, [
    activeEntry?.entryId,
    activeEntry?.kind,
    finalMixDetailSections,
    formData.divisionEntryValues,
    formData.mixingFinalMixDetailsValues,
    mixingQualityChecksByStage.FINAL_MIX,
  ]);

  const handleFinalMixDetailsChange = useCallback(
    (values: SchemaFormValues) => {
      onMixingFinalMixDetailsChange(values);
      if (activeEntry?.kind === "MIXING_FINAL_MIX") {
        const current = formData.divisionEntryValues?.[activeEntry.entryId]?.schemaValues;
        // Details first, then viscosity-only — never spread full current (it would clobber edits).
        onDivisionEntryValuesChange(
          activeEntry.entryId,
          mergeFinalMixEntrySchemaValues(values, pickViscositySchemaValues(current)),
        );
      }
    },
    [
      activeEntry?.entryId,
      activeEntry?.kind,
      formData.divisionEntryValues,
      onDivisionEntryValuesChange,
      onMixingFinalMixDetailsChange,
    ],
  );

  // Seed once when the active Final Mix unit changes — do not re-seed on every keystroke.
  useEffect(() => {
    if (readOnly) return;
    if (activeEntry?.kind !== "MIXING_FINAL_MIX") return;
    const fromEntry = pickFinalMixDetailsSchemaValues(
      formData.divisionEntryValues?.[activeEntry.entryId]?.schemaValues,
    );
    if (fromEntry && Object.keys(fromEntry).length > 0) {
      if (
        JSON.stringify(fromEntry) !== JSON.stringify(formData.mixingFinalMixDetailsValues ?? {})
      ) {
        onMixingFinalMixDetailsChange(fromEntry);
      }
      return;
    }
    if (!finalMixAutoSeed && !mixingQualityChecksByStage.FINAL_MIX.length) return;
    if (formData.mixingFinalMixDetailsValues && Object.keys(formData.mixingFinalMixDetailsValues).length > 0) {
      return;
    }
    const manufacturing =
      (divisionAutoPopulateData as any)?.__manufacturingDivisionData ?? divisionAutoPopulateData;
    const seeded = applyMixingDivisionEntryToValues(
      createInitialFinalMixDetailsValues(mixingQualityChecksByStage.FINAL_MIX),
      {
        variant: "finalMix",
        premixNo: finalMixSeedPremixNo,
        autoPopulatePayload: manufacturing,
        batchPayload: batch,
        qualityCheckDefinitions: mixingQualityChecksByStage.FINAL_MIX,
      },
      { onlyIfEmpty: true },
    );
    handleFinalMixDetailsChange(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed only when active Final Mix unit changes
  }, [activeEntry?.entryId, activeEntry?.kind, finalMixSeedPremixNo, readOnly]);

  const visibleEntries = useMemo(() => resolveVisibleEntries(activeContent), [activeContent]);
  const processingMaterialEntries = useMemo(
    () => divisionEntries.filter((entry) => entry.kind === "PROCESSING_MATERIAL"),
    [divisionEntries],
  );
  const showProcessingMaterialsPanel =
    processingMaterialEntries.length > 0 &&
    processingMaterialEntries.length === divisionEntries.length;
  const bothPremixSolidSchema = useMemo(() => getSolidSchemaForBothEntry(formData), [formData.schemasByKey]);
  const bothPremixLiquidSchema = useMemo(() => getLiquidSchemaForBothEntry(formData), [formData.schemasByKey]);
  // Raw Material Revalidation is division-scoped only — no unit draft/submit actions.
  const resolvedUnitActions = useMemo(() => {
    if (!unitActions?.show) return unitActions;
    const isRevalidationOnly =
      visibleEntries.length > 0 && visibleEntries.every((entry) => entry.kind === "REVALIDATION");
    if (isRevalidationOnly || activeEntry?.kind === "REVALIDATION") {
      return { ...unitActions, show: false };
    }
    return unitActions;
  }, [activeEntry?.kind, unitActions, visibleEntries]);

  const resolveEntryUnitActions = useCallback(
    (entry?: QcDivisionEntry | null): QCDivisionEntryUnitActions | null => {
      if (!resolvedUnitActions?.show) return resolvedUnitActions;
      const labels = resolveQcUnitActionLabels({ partialItem: activePartialItem, entry });
      return { ...resolvedUnitActions, ...labels };
    },
    [activePartialItem, resolvedUnitActions],
  );

  const showInlineFinalMixDetails = useMemo(
    () => hideEntryGroupNav && activeEntry?.kind === "MIXING_FINAL_MIX",
    [activeEntry?.kind, hideEntryGroupNav],
  );

  const showFinalMixDetailsPanel =
    activeContent?.type === "final-mix-details" || showInlineFinalMixDetails;

  /** Final Mix: draft/submit sit above Final Mix Details; hide duplicate actions on viscosity panel. */
  const finalMixTopUnitActions =
    showFinalMixDetailsPanel && resolvedUnitActions?.show ? resolvedUnitActions : null;
  const firstHardwareEntryId = useMemo(
    () => visibleEntries.find((entry) => entry.kind === "HARDWARE_PROCESS")?.entryId ?? null,
    [visibleEntries],
  );
  const hardwareUploadAnchorEntry = useMemo(() => {
    const hardwareEntries = visibleEntries.filter((entry) => entry.kind === "HARDWARE_PROCESS");
    if (!hardwareEntries.length) return null;
    if (activeMotorId) {
      return resolveHardwareUploadAnchorEntry(hardwareEntries, activeMotorId) ?? null;
    }
    return resolveHardwareUploadAnchorEntry(hardwareEntries, hardwareEntries[0].motorId ?? "") ?? null;
  }, [activeMotorId, visibleEntries]);
  const showHardwareUploadPanel = useMemo(
    () => visibleEntries.some((entry) => entry.kind === "HARDWARE_PROCESS"),
    [visibleEntries],
  );
  const hardwareUploadValues = useMemo(() => {
    if (!hardwareUploadAnchorEntry) return createInitialHardwareProcessValues("ABRADING");
    const saved = formData.divisionEntryValues?.[hardwareUploadAnchorEntry.entryId]?.schemaValues;
    if (saved && Object.keys(saved).length > 0) return saved;
    return createInitialHardwareProcessValues("ABRADING");
  }, [formData.divisionEntryValues, hardwareUploadAnchorEntry]);
  const handleHardwareUploadChange = useCallback(
    (values: SchemaFormValues) => {
      if (!hardwareUploadAnchorEntry) return;
      onDivisionEntryValuesChange(hardwareUploadAnchorEntry.entryId, values);
    },
    [hardwareUploadAnchorEntry, onDivisionEntryValuesChange],
  );
  const finalMixActionLabels = resolveEntryUnitActions(activeEntry);

  const showEntryGroupNav = !hideEntryGroupNav && navGroups.length > 1;

  const entryGroupTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      navGroups.map((group) => ({
        id: group.flowKey,
        label: group.label,
      })),
    [navGroups],
  );

  const navPalette = {
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  if (schemaLoading && !hasDivisionEntries) {
    return <QCSchemaBufferingLoader />;
  }

  if (!hasDivisionEntries || navGroups.length === 0) {
    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          px: 2,
          py: 2.5,
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, textAlign: "center" }}>
          {readOnly ? S.DETAILS_NO_DATA : S.DIVISION_NO_ENTRIES_MESSAGE}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {showEntryGroupNav ? (
        <Box
          sx={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
            px: 1.25,
            py: 1.1,
            mb: 1.25,
            mt: 1,
            background: BRAND.surface,
          }}
        >
          <UserWorkflowTabNav
            title={S.DIVISION_NAV_TITLE}
            hint={S.DIVISION_NAV_HINT}
            tabs={entryGroupTabs}
            activeIndex={safeGroupIndex}
            onActiveIndexChange={(index) => {
              onActiveDivisionGroupIndexChange(index);
              onActiveDivisionSubIndexChange(0);
            }}
            palette={navPalette}
            showStepArrows
            wrapTabs
          />
        </Box>
      ) : null}

      <Box sx={{ mt: showEntryGroupNav ? 0 : 1.25 }}>
        {showFinalMixDetailsPanel ? (
          <Box
            sx={{
              borderRadius: 2.5,
              border: `1px solid ${BRAND.border}`,
              background: BRAND.surface,
              px: 1.5,
              py: 1.25,
              mb: showInlineFinalMixDetails ? 1.25 : 0,
              ...(fieldsDisabled && !readOnly
                ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
                : null),
            }}
          >
            {finalMixTopUnitActions ? (
              <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={1} gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={
                    fieldsDisabled ||
                    readOnly ||
                    !finalMixTopUnitActions.canAct ||
                    finalMixTopUnitActions.actionLoading
                  }
                  onClick={finalMixTopUnitActions.onSaveDraft}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {finalMixActionLabels?.saveDraftLabel ?? S.SAVE_UNIT_DRAFT}
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={
                    fieldsDisabled ||
                    readOnly ||
                    !finalMixTopUnitActions.canAct ||
                    finalMixTopUnitActions.actionLoading
                  }
                  onClick={finalMixTopUnitActions.onSubmit}
                  sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                >
                  {finalMixActionLabels?.submitLabel ?? S.SUBMIT_UNIT}
                </Button>
              </Stack>
            ) : null}
            <QCMixingDetailsTable
              variant="finalMix"
              values={finalMixDetailsValues}
              onChange={handleFinalMixDetailsChange}
              readOnly={readOnly}
              autoSeed={finalMixAutoSeed}
            />
          </Box>
        ) : null}

        {activeMotorId && activeContent?.type === "motor-entries" && activeContent.flowKey !== "TRIMMING" ? (
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary, mb: 1 }}>
            {activeMotorId}
          </Typography>
        ) : null}

        {showProcessingMaterialsPanel ? (
          <Box
            sx={
              fieldsDisabled && !readOnly
                ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
                : undefined
            }
          >
            <QCProcessingMaterialsPanel
              key={`processing-materials-${processingMaterialEntries[0]?.premixNo ?? "all"}`}
              formData={formData}
              entries={processingMaterialEntries}
              entryValuesById={formData.divisionEntryValues ?? {}}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              readOnly={readOnly}
              schemaLoading={schemaLoading}
              schemaError={schemaError}
              onEntryValuesChange={onDivisionEntryValuesChange}
              unitActions={resolveEntryUnitActions(processingMaterialEntries[0] ?? null)}
            />
          </Box>
        ) : (
          visibleEntries.map((entry) => {
            const entryValues = formData.divisionEntryValues?.[entry.entryId];
            if (!entryValues) return null;

            return (
              <QCDivisionEntryPanel
                key={entry.entryId}
                entry={entry}
                entryValues={entryValues}
                schema={getSchemaForDivisionEntry(formData, entry)}
                solidSchema={entry.kind === "BOTH_PREMIX" ? bothPremixSolidSchema : undefined}
                liquidSchema={entry.kind === "BOTH_PREMIX" ? bothPremixLiquidSchema : undefined}
                subDepartmentId={subDepartmentId}
                batchId={batch?.batchId}
                divisionAutoPopulateData={divisionAutoPopulateData}
                mixingQualityCheckDefinitions={
                  entry.kind === "MIXING_PREMIX"
                    ? mixingQualityChecksByStage.PREMIX
                    : entry.kind === "MIXING_FINAL_MIX"
                      ? mixingQualityChecksByStage.FINAL_MIX
                      : undefined
                }
                batchPayload={batch}
                readOnly={readOnly}
                fieldsDisabled={fieldsDisabled}
                schemaLoading={schemaLoading}
                schemaError={schemaError}
                onEntryValuesChange={onDivisionEntryValuesChange}
                onEntryLiquidValuesChange={onDivisionEntryLiquidValuesChange}
                onRemoveEntry={onRemoveDivisionEntry}
                unitActions={
                  entry.kind === "HARDWARE_PROCESS" && entry.entryId !== firstHardwareEntryId
                    ? { ...resolveEntryUnitActions(entry)!, show: false }
                    : resolveEntryUnitActions(entry)
                }
              />
            );
          })
        )}
        {showHardwareUploadPanel && hardwareUploadAnchorEntry ? (
          <Box
            sx={{
              mt: 2,
              ...(fieldsDisabled && !readOnly
                ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
                : null),
            }}
          >
            <QCHardwareAttachmentUpload
              values={hardwareUploadValues}
              onChange={handleHardwareUploadChange}
              readOnly={readOnly}
            />
          </Box>
        ) : null}
      </Box>
    </>
  );
};

export default QCDivisionFormBody;

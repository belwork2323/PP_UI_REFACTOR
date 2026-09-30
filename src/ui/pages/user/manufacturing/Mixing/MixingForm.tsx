import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getMixingTheme, {
  MIXING_BRAND,
} from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { createDataTableTheme } from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import {
  BOWL_ID_OPTIONS,
  collectAssignedBowlIdsByStageType,
  FINAL_MIX_CYCLE_OPTIONS,
  getAvailableBowlIds,
  getFinalMixNoLabel,
  getPremixNoLabel,
} from "../../../../../hooks/user/manufacturing/mixingConfig";
import type { IdentificationSheetMixingStage } from "../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  buildMixCardId,
  createDefaultMixingFormState,
  isMixCardLocked,
  mapBackendQualityChecksToRows,
  mapProcessRows,
  resolveMixingCycleQualityChecks,
  type MixCardStageType,
  type MixCardStatusMeta,
  type MixCardSubmissionStatus,
} from "../../../../../data/models/user/MixingFormModel";
import type {
  FinalMixEntry,
  PremixEntry,
  ProcessParticularRow,
} from "../../../../../data/models/user/MixingFormModel";
import { useMixingFormHook } from "../../../../../hooks/user/manufacturing/useMixingFormHook";
import { useMixingQualityChecks } from "../../../../../hooks/user/manufacturing/useMixingQualityChecks";
import { useBuildingOptions } from "../../../../../hooks/user/useBuildingOptions";
import {
  isPremixEnabledForWorkflowWithBatch,
  getPremixNavTabDisabledReasonWithBatch,
  type BatchStageContext,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import { SUB_DEPT } from "../../../../../utils/batchStageUtils";
import MixingDateField from "./MixingDateField";
import MixingCardNavigation from "./MixingCardNavigation";
import MixingQualityChecksTable from "./MixingQualityChecksTable";
import {
  MixingFieldLabel,
  MixingSelectField,
  MixingTableInput,
  MixingTextField,
} from "./MixingFormFields";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalMixCardDialog, {
  areAllMixCardsApproved,
  buildFinalApprovalMixCardRows,
} from "./components/FinalApprovalMixCardDialog";
import validateMixing, {
  focusMixField,
  resolveFirstMixingValidationFocus,
} from "@/data/validation/adapters/mixing.validation";
import { hasValidationErrors } from "@/data/validation/validationErrors";
import { useAlertStore } from "@/app/store/alertStore";
import type { ValidationAttemptFlags } from "@/ui/components/validation/useValidationDisplay";
import useValidationDisplay from "@/ui/components/validation/useValidationDisplay";
import type { ValidationTier } from "@/data/validation/submissionIntent";

import mixingController from "@/controllers/user/manufacturing/mixingController";

type CombinedStageKind = "PREMIX" | "FINAL_MIX";

type CombinedNavItem = {
  kind: CombinedStageKind;
  id: string;
  label: string;
  cardIndex: number;
};

const {
  blender: BlenderRoundedIcon,
  checklist: ChecklistRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
} = icons.user.manufacturing.mixing.form;

const BRAND = MIXING_BRAND;
const S = STRINGS.MANUFACTURING.MIXING;
const dataTable = createDataTableTheme({ ...MIXING_BRAND });

const slideIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;

const SectionCard = styled(Box)({
  borderRadius: 16,
  border: "1px solid rgba(21,101,192,0.2)",
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 18px rgba(21,101,192,0.07)",
  animation: `${slideIn} 0.35s ease both`,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21,101,192,0.07), rgba(25,118,210,0.03))",
  borderBottom: "1px solid rgba(21,101,192,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const PROCESS_PLACEHOLDERS = {
  rpm: S.PLACEHOLDER_RPM,
  time: S.PLACEHOLDER_TIME,
  temp: S.PLACEHOLDER_TEMP,
  vacuum: S.PLACEHOLDER_VACUUM,
} as const;

const EmptySectionState = ({ message }: { message: string }) => (
  <Box
    sx={{
      border: `1px dashed ${alpha(BRAND.mx, 0.25)}`,
      borderRadius: 2,
      p: 2.5,
      background: alpha(BRAND.surface, 0.45),
    }}
  >
    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{message}</Typography>
  </Box>
);

type PremixStageCardProps = {
  cardIdx: number;
  premix: PremixEntry;
  bowlIdOptions: string[];
  buildingOptions: { value: string; label: string }[];
  mixingCycleOptions: { value: string; label: string }[];
  loadingBuildings?: boolean;
  loadingCycles?: boolean;
  readOnly?: boolean;
  statusChip?: React.ReactNode;
  headerActions?: React.ReactNode;
  lockedMessage?: string | null;
  qualityChecksLoading?: boolean;
  qualityChecksError?: string | null;
  onRemove: (premixNo: string) => void;
  onPremixFieldChange: (
    premixNo: string,
    field: keyof Omit<PremixEntry, "premixNo" | "processParticulars" | "qualityChecks">,
    value: string,
  ) => void;
  onMixingCycleChange: (premixNo: string, cycleCode: string) => void;
  onProcessChange: (
    premixNo: string,
    rowId: number,
    field: "rpm" | "time" | "temp" | "vacuum",
    value: string,
  ) => void;
  onQualityChange: (
    premixNo: string,
    parameterId: string | number,
    index: number,
    value: string,
  ) => void;
  onClearFieldError?: (path: string) => void;
  errors: Record<string, string> | null;
  validationAttempt?: ValidationAttemptFlags;
  isEditMode?: boolean;
};

const PremixStageCard = ({
  cardIdx,
  premix,
  bowlIdOptions,
  buildingOptions,
  mixingCycleOptions,
  loadingBuildings = false,
  loadingCycles = false,
  readOnly = false,
  statusChip,
  headerActions,
  lockedMessage,
  qualityChecksLoading = false,
  qualityChecksError = null,
  onRemove,
  onPremixFieldChange,
  onMixingCycleChange,
  onProcessChange,
  onQualityChange,
  onClearFieldError,
  errors = {},
  validationAttempt = { format: false, unit: false, submit: false },
  isEditMode = false,
}: PremixStageCardProps) => {
  const processParticularsList = premix.processParticulars || [];
  const { visibleError } = useValidationDisplay(errors ?? {}, validationAttempt);
  const getFieldError = (fieldPath: string) => visibleError(fieldPath);

  const handleQualityCheckChange = (parameterId: string | number, index: number, value: string) => {
    onQualityChange(premix.premixNo, parameterId, index, value);
    const qcIdx = (premix.qualityChecks || []).findIndex(
      (r) => String(r.parameterId) === String(parameterId),
    );
    if (qcIdx >= 0) {
      const path = `premixes.${cardIdx}.qualityChecks.${qcIdx}.observedValues.${index}`;
      onClearFieldError?.(path);
    }
  };

  const isCycleDisabled = readOnly || (isEditMode && Boolean(premix.mixingCycleCode));

  return (
    <SectionCard>
      <SectionHeader>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" minWidth={0}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg,#1565C0,#1976D2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(21,101,192,0.3)",
              flexShrink: 0,
            }}
          >
            <ChecklistRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            {S.SECTION_PREMIX_STAGE} — {getPremixNoLabel(Number(premix.premixNo))}
          </Typography>
          {statusChip ?? null}
        </Stack>
        {headerActions ?? null}
      </SectionHeader>

      {lockedMessage ? (
        <Box
          sx={{
            mx: 2,
            mt: 1.5,
            px: 1.25,
            py: 0.75,
            borderRadius: 1.5,
            border: `1px solid ${alpha(BRAND.border, 0.9)}`,
            bgcolor: alpha(BRAND.surface, 0.8),
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
            {lockedMessage}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <MixingTextField
              label="Mixer"
              value={premix.mixerType}
              placeholder="Mixer"
              disabled
              onChange={() => undefined}
              required
              fieldPath={`premixes.${cardIdx}.mixerType`}
              error={Boolean(getFieldError(`premixes.${cardIdx}.mixerType`))}
              helperText={getFieldError(`premixes.${cardIdx}.mixerType`)}
            />
            <MixingSelectField
              label="Building No"
              value={premix.bldgNo}
              placeholder={
                loadingBuildings
                  ? "Loading buildings..."
                  : buildingOptions.length
                    ? "Select building"
                    : "No buildings available"
              }
              options={buildingOptions}
              disabled={readOnly || loadingBuildings}
              onChange={(value) => {
                onClearFieldError?.(`premixes.${cardIdx}.bldgNo`);
                onPremixFieldChange(premix.premixNo, "bldgNo", value);
              }}
              required
              fieldPath={`premixes.${cardIdx}.bldgNo`}
              error={Boolean(getFieldError(`premixes.${cardIdx}.bldgNo`))}
              helperText={getFieldError(`premixes.${cardIdx}.bldgNo`)}
            />
            <MixingDateField
              label={S.LABEL_PREMIX_DATE}
              value={premix.premixDate}
              placeholder="DD-MM-YYYY"
              onChange={(value) => onPremixFieldChange(premix.premixNo, "premixDate", value)}
              disabled
              fullWidth="100%"
              required
              fieldPath={`premixes.${cardIdx}.premixDate`}
              error={Boolean(getFieldError(`premixes.${cardIdx}.premixDate`))}
              helperText={getFieldError(`premixes.${cardIdx}.premixDate`)}
            />
            <MixingTextField
              label={S.LABEL_PREMIX_QTY}
              value={premix.premixQuantity}
              placeholder={S.PLACEHOLDER_PREMIX_QTY}
              type="number"
              disabled
              onChange={() => undefined}
              required
              fieldPath={`premixes.${cardIdx}.premixQuantity`}
              error={Boolean(getFieldError(`premixes.${cardIdx}.premixQuantity`))}
              helperText={getFieldError(`premixes.${cardIdx}.premixQuantity`)}
            />
            <MixingSelectField
              label={S.LABEL_MIXING_CYCLE}
              value={premix.mixingCycleCode ?? ""}
              placeholder={
                loadingCycles
                  ? "Loading cycles..."
                  : mixingCycleOptions.length
                    ? "Select Mixing Cycle"
                    : "No cycles available"
              }
              options={mixingCycleOptions}
              disabled={isCycleDisabled || loadingCycles}
              onChange={(value) => {
                onClearFieldError?.(`premixes.${cardIdx}.mixingCycleCode`);
                onMixingCycleChange(premix.premixNo, value);
              }}
              required
              fieldPath={`premixes.${cardIdx}.mixingCycleCode`}
              error={Boolean(getFieldError(`premixes.${cardIdx}.mixingCycleCode`))}
              helperText={getFieldError(`premixes.${cardIdx}.mixingCycleCode`)}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            {(() => {
              const bowlIdPath = `premixes.${cardIdx}.bowlId`;
              const errorMsg = getFieldError(bowlIdPath);
              return (
                <MixingSelectField
                  label={S.LABEL_BOWL_ID}
                  value={premix.bowlId ?? ""}
                  placeholder={S.PLACEHOLDER_BOWL_ID}
                  options={bowlIdOptions}
                  disabled={readOnly}
                  error={!!errorMsg}
                  helperText={errorMsg}
                  fieldPath={bowlIdPath}
                  onChange={(value) => {
                    onPremixFieldChange(premix.premixNo, "bowlId", value);
                    onClearFieldError?.(bowlIdPath);
                  }}
                  required
                />
              );
            })()}

            {(() => {
              const bowlTrialDatePath = `premixes.${cardIdx}.bowlTrialDate`;
              const errorMsg = getFieldError(bowlTrialDatePath);
              return (
                <MixingDateField
                  label={S.LABEL_BOWL_TRIAL_DATE}
                  value={premix.bowlTrialDate ?? ""}
                  placeholder="DD-MM-YYYY"
                  fullWidth="100%"
                  disabled={readOnly}
                  error={!!errorMsg}
                  helperText={errorMsg}
                  fieldPath={bowlTrialDatePath}
                  onChange={(value) => {
                    onPremixFieldChange(premix.premixNo, "bowlTrialDate", value);
                    onClearFieldError?.(bowlTrialDatePath);
                  }}
                  required
                />
              );
            })()}

            {(() => {
              const bowlTrialObsPath = `premixes.${cardIdx}.bowlTrialObservations`;
              const errorMsg = getFieldError(bowlTrialObsPath);
              return (
                <MixingTextField
                  label={S.LABEL_BOWL_TRIAL_OBS}
                  value={premix.bowlTrialObservations ?? ""}
                  placeholder={S.PLACEHOLDER_BOWL_TRIAL_OBS}
                  multiline
                  minRows={2}
                  disabled={readOnly}
                  error={!!errorMsg}
                  helperText={errorMsg}
                  fieldPath={bowlTrialObsPath}
                  onChange={(value) => {
                    onPremixFieldChange(premix.premixNo, "bowlTrialObservations", value);
                    onClearFieldError?.(bowlTrialObsPath);
                  }}
                  required
                />
              );
            })()}
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
          {S.SECTION_PROCESS_PARTICULARS}
        </Typography>

        {getFieldError(`premixes.${cardIdx}.processParticulars.root`) && (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
            {getFieldError(`premixes.${cardIdx}.processParticulars.root`)}
          </Typography>
        )}

        <TableContainer sx={{ ...dataTable.tableContainer, overflowX: "auto", mb: 2.5 }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...dataTable.tableHeaderCell(true), minWidth: 320 }}>
                  {S.COL_OPERATION}
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_ROTATION}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_TIME}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_TEMP}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_VACUUM}
                  </MixingFieldLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {processParticularsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={dataTable.tableCell}>
                    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, py: 1 }}>
                      {S.PROCESS_PARTICULARS_EMPTY}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                processParticularsList.map((processRow, rowIdx) => (
                  <TableRow key={processRow.operationId ?? rowIdx} sx={dataTable.tableRow(rowIdx)}>
                    <TableCell sx={{ ...dataTable.tableCell, fontWeight: 700 }}>
                      {processRow.operation || `Operation ${processRow.operationId}`}
                    </TableCell>

                    {(["rpm", "time", "temp", "vacuum"] as const).map((fieldName) => {
                      const fieldPath = `premixes.${cardIdx}.processParticulars.${rowIdx}.${fieldName}`;
                      const errorMsg = getFieldError(fieldPath);

                      return (
                        <TableCell key={fieldName} sx={dataTable.tableCell}>
                          <MixingTableInput
                            value={processRow[fieldName] ?? ""}
                            placeholder={PROCESS_PLACEHOLDERS[fieldName]}
                            disabled={readOnly}
                            error={!!errorMsg}
                            helperText={errorMsg}
                            fieldPath={fieldPath}
                            onChange={(newValue: string) => {
                              onProcessChange(
                                premix.premixNo,
                                processRow.operationId,
                                fieldName,
                                newValue,
                              );
                              onClearFieldError?.(fieldPath);
                            }}
                            required
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
          {S.SECTION_QUALITY_CHECKS}
        </Typography>

        {getFieldError(`premixes.${cardIdx}.qualityChecks.root`) && (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
            {getFieldError(`premixes.${cardIdx}.qualityChecks.root`)}
          </Typography>
        )}

        {qualityChecksLoading ? (
          <Stack direction="row" alignItems="center" gap={1} sx={{ py: 1.5 }}>
            <CircularProgress size={18} sx={{ color: BRAND.mx }} />
            <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>
              Loading quality checks…
            </Typography>
          </Stack>
        ) : qualityChecksError ? (
          <Typography sx={{ fontSize: "0.78rem", color: "error.main", mb: 1 }}>
            {qualityChecksError}
          </Typography>
        ) : null}

        <MixingQualityChecksTable
          rows={premix.qualityChecks || []}
          readOnly={readOnly}
          onChange={handleQualityCheckChange}
          onClearFieldError={onClearFieldError}
          arrayName={`premixes.${cardIdx}.qualityChecks`}
          errors={errors}
          validationAttempt={validationAttempt}
        />
      </Box>
    </SectionCard>
  );
};

type FinalMixStageCardProps = {
  cardIdx: number;
  entry: FinalMixEntry;
  bowlIdOptions: string[];
  buildingOptions: { value: string; label: string }[];
  mixingCycleOptions: { value: string; label: string }[];
  loadingBuildings?: boolean;
  loadingCycles?: boolean;
  readOnly?: boolean;
  statusChip?: React.ReactNode;
  headerActions?: React.ReactNode;
  lockedMessage?: string | null;
  qualityChecksLoading?: boolean;
  qualityChecksError?: string | null;
  onRemove: (mixNo: string) => void;
  onFieldChange: (
    mixNo: string,
    field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks" | "processParticulars">,
    value: string,
  ) => void;
  onProcessChange: (
    mixNo: string,
    rowId: number,
    field: "rpm" | "time" | "temp" | "vacuum",
    value: string,
  ) => void;
  onQualityChange: (
    mixNo: string,
    parameterId: string | number,
    index: number,
    value: string,
  ) => void;
  onClearFieldError?: (path: string) => void;
  errors: Record<string, string> | null;
  validationAttempt?: ValidationAttemptFlags;
  isEditMode?: boolean;
};

const FinalMixStageCard = ({
  cardIdx,
  entry,
  bowlIdOptions,
  buildingOptions,
  loadingBuildings = false,
  readOnly = false,
  statusChip,
  headerActions,
  lockedMessage,
  onFieldChange,
  onProcessChange,
  onQualityChange,
  onClearFieldError,
  errors = {},
  validationAttempt = { format: false, unit: false, submit: false },
  isEditMode = false,
}: FinalMixStageCardProps) => {
  const processParticularsList = entry.processParticulars || [];
  const { visibleError } = useValidationDisplay(errors ?? {}, validationAttempt);
  const getFieldError = (fieldPath: string) => visibleError(fieldPath);

  return (
    <SectionCard>
      <SectionHeader>
        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" minWidth={0}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg,#1565C0,#1976D2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 3px 10px rgba(21,101,192,0.3)",
              flexShrink: 0,
            }}
          >
            <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            {S.SECTION_FINAL_MIX_STAGE} — {getFinalMixNoLabel(Number(entry.mixNo))}
          </Typography>
          {statusChip ?? null}
        </Stack>
        {headerActions ?? null}
      </SectionHeader>

      {lockedMessage ? (
        <Box
          sx={{
            mx: 2,
            mt: 1.5,
            px: 1.25,
            py: 0.75,
            borderRadius: 1.5,
            border: `1px solid ${alpha(BRAND.border, 0.9)}`,
            bgcolor: alpha(BRAND.surface, 0.8),
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, fontWeight: 600 }}>
            {lockedMessage}
          </Typography>
        </Box>
      ) : null}

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 2.5,
          }}
        >
          <MixingTextField
            label={S.DETAIL_LABEL_FINAL_MIX_NO}
            value={entry.finalMixNo}
            placeholder={S.DETAIL_LABEL_FINAL_MIX_NO}
            disabled
            onChange={() => undefined}
            required
          />
          <MixingTextField
            label="Mixer"
            value={entry.mixerType}
            placeholder="Mixer"
            disabled
            onChange={() => undefined}
            required
            fieldPath={`finalMixes.${cardIdx}.mixerType`}
            error={Boolean(getFieldError(`finalMixes.${cardIdx}.mixerType`))}
            helperText={getFieldError(`finalMixes.${cardIdx}.mixerType`)}
          />
          <MixingSelectField
            label="Building No"
            value={entry.bldgNo}
            placeholder={
              loadingBuildings
                ? "Loading buildings..."
                : buildingOptions.length
                  ? "Select building"
                  : "No buildings available"
            }
            options={buildingOptions}
            disabled={readOnly || loadingBuildings}
            onChange={(value) => {
              onClearFieldError?.(`finalMixes.${cardIdx}.bldgNo`);
              onFieldChange(entry.mixNo, "bldgNo", value);
            }}
            required
            fieldPath={`finalMixes.${cardIdx}.bldgNo`}
            error={Boolean(getFieldError(`finalMixes.${cardIdx}.bldgNo`))}
            helperText={getFieldError(`finalMixes.${cardIdx}.bldgNo`)}
          />
          {/* Final mix shares premix mixing cycle code automatically via text field */}
          <MixingTextField
            label={S.LABEL_MIXING_CYCLE}
            value={entry.mixingCycleCode ?? ""}
            placeholder="Shared from Premix Cycle"
            disabled
            onChange={() => undefined}
            required
            fieldPath={`finalMixes.${cardIdx}.mixingCycleCode`}
            error={Boolean(getFieldError(`finalMixes.${cardIdx}.mixingCycleCode`))}
            helperText={getFieldError(`finalMixes.${cardIdx}.mixingCycleCode`)}
          />
          {(() => {
            const bowlIdPath = `finalMixes.${cardIdx}.bowlId`;
            const errorMsg = getFieldError(bowlIdPath);
            return (
              <MixingSelectField
                label={S.LABEL_BOWL_ID}
                value={entry.bowlId ?? ""}
                placeholder={S.PLACEHOLDER_BOWL_ID}
                options={bowlIdOptions}
                disabled={readOnly}
                error={!!errorMsg}
                helperText={errorMsg}
                fieldPath={bowlIdPath}
                onChange={(value) => {
                  onFieldChange(entry.mixNo, "bowlId", value);
                  onClearFieldError?.(bowlIdPath);
                }}
                required
              />
            );
          })()}
        </Box>

        <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
          {S.SECTION_PROCESS_PARTICULARS}
        </Typography>

        {getFieldError(`finalMixes.${cardIdx}.processParticulars.root`) && (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
            {getFieldError(`finalMixes.${cardIdx}.processParticulars.root`)}
          </Typography>
        )}

        <TableContainer sx={{ ...dataTable.tableContainer, overflowX: "auto", mb: 2.5 }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...dataTable.tableHeaderCell(true), minWidth: 320 }}>
                  {S.COL_OPERATION}
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_ROTATION}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_TIME}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_TEMP}
                  </MixingFieldLabel>
                </TableCell>
                <TableCell sx={dataTable.tableHeaderCell(false)}>
                  <MixingFieldLabel required sx={{ color: BRAND.surface }}>
                    {S.COL_VACUUM}
                  </MixingFieldLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {processParticularsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={dataTable.tableCell}>
                    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, py: 1 }}>
                      {S.PROCESS_PARTICULARS_EMPTY}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                processParticularsList.map((processRow, rowIdx) => (
                  <TableRow key={processRow.operationId ?? rowIdx} sx={dataTable.tableRow(rowIdx)}>
                    <TableCell sx={{ ...dataTable.tableCell, fontWeight: 700 }}>
                      {processRow.operation || `Operation ${processRow.operationId}`}
                    </TableCell>

                    {(["rpm", "time", "temp", "vacuum"] as const).map((fieldName) => {
                      const fieldPath = `finalMixes.${cardIdx}.processParticulars.${rowIdx}.${fieldName}`;
                      const errorMsg = getFieldError(fieldPath);

                      return (
                        <TableCell key={fieldName} sx={dataTable.tableCell}>
                          <MixingTableInput
                            value={processRow[fieldName] ?? ""}
                            placeholder={PROCESS_PLACEHOLDERS[fieldName]}
                            disabled={readOnly}
                            error={!!errorMsg}
                            helperText={errorMsg}
                            fieldPath={fieldPath}
                            onChange={(newValue: string) => {
                              onProcessChange(
                                entry.mixNo,
                                processRow.operationId,
                                fieldName,
                                newValue,
                              );
                              onClearFieldError?.(fieldPath);
                            }}
                            required
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
          {S.SECTION_QUALITY_CHECKS}
        </Typography>

        {getFieldError(`finalMixes.${cardIdx}.qualityChecks.root`) && (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
            {getFieldError(`finalMixes.${cardIdx}.qualityChecks.root`)}
          </Typography>
        )}

        <MixingQualityChecksTable
          rows={entry.qualityChecks || []}
          readOnly={readOnly}
          onChange={(parameterId, index, value) => {
            onQualityChange(entry.mixNo, parameterId, index, value);
            const qcIdx = (entry.qualityChecks || []).findIndex(
              (r) => String(r.parameterId) === String(parameterId),
            );
            if (qcIdx >= 0) {
              onClearFieldError?.(
                `finalMixes.${cardIdx}.qualityChecks.${qcIdx}.observedValues.${index}`,
              );
            }
          }}
          onClearFieldError={onClearFieldError}
          arrayName={`finalMixes.${cardIdx}.qualityChecks`}
          errors={errors}
          validationAttempt={validationAttempt}
        />
      </Box>
    </SectionCard>
  );
};

type MixingFormProps = {
  initialData?: ReturnType<typeof createDefaultMixingFormState>;
  numberOfPremix?: number;
  motorStage?: number;
  isEditMode?: boolean;
  onBlocksChange?: (payload: ReturnType<typeof createDefaultMixingFormState>) => void;
  identificationSheet?: {
    mixerType?: string | null;
    bldgNo?: string | null;
    metadata?: {
      mixing?: {
        stages?: IdentificationSheetMixingStage[];
      } | null;
    } | null;
  } | null;
  mixCardStatusById?: Record<string, MixCardStatusMeta>;
  getMixCardStatus?: (mixCardId: string) => MixCardSubmissionStatus;
  isMixCardEditable?: (mixCardId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  batchStageContext?: BatchStageContext | null;
  projectId?: string | null;
  actionLoading?: boolean;
  onSaveMixCardDraft?: (stageType: MixCardStageType, cardNo: string) => void;
  onSubmitMixCard?: (stageType: MixCardStageType, cardNo: string) => void;
};

const MixingForm = ({
  initialData,
  numberOfPremix,
  motorStage = 1,
  isEditMode = false,
  onBlocksChange,
  identificationSheet,
  mixCardStatusById = {},
  getMixCardStatus,
  isMixCardEditable: checkMixCardEditable,
  previousStageGate = null,
  batchStageContext = null,
  projectId = null,
  actionLoading = false,
  onSaveMixCardDraft,
  onSubmitMixCard,
}: MixingFormProps) => {
  const {
    premixCards,
    finalMixCards,
    removePremixCard,
    removeFinalMixCard,
    updatePremixField,
    updateProcessParticular,
    updateFinalMixProcessParticular,
    updateQualityCheck,
    updateFinalMixField,
    updateFinalMixQualityCheck,
    applyPremixQualityChecks,
    applyFinalMixQualityChecks,
    setPremixMixingCycle,
    setFinalMixMixingCycle,
    applyFinalMixOperationsAndQCs,
    applyPremixOperationsAndQCs,
  } = useMixingFormHook(
    initialData ?? createDefaultMixingFormState(),
    onBlocksChange,
    numberOfPremix,
    identificationSheet,
  );

  const { dropdownOptions: buildingOptions, loadingBuildings } = useBuildingOptions(true);
  const [mixingCycleOptions, setMixingCycleOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loadingCycles, setLoadingCycles] = useState(false);

  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const statusConfig = useMemo(
    () => getMixingTheme(manufacturingTheme).details.bannerStatusConfig,
    [manufacturingTheme],
  );

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationAttempt, setValidationAttempt] = useState<ValidationAttemptFlags>({
    format: false,
    unit: false,
    submit: false,
  });
  const validationAttemptRef = React.useRef(validationAttempt);
  validationAttemptRef.current = validationAttempt;
  const [validationFocusRequest, setValidationFocusRequest] = useState<{
    id: number;
    fieldPath: string;
  } | null>(null);

  const mapAndSetErrors = (errors: Record<string, string>, indexMap: (p: string) => string) => {
    const mapped: Record<string, string> = {};
    for (const [path, message] of Object.entries(errors)) {
      const mappedPath = indexMap(path);
      mapped[mappedPath] = message;
    }
    // Replace (do not merge) so highlights match the latest gate result.
    setValidationErrors(mapped);
    return mapped;
  };

  const remapPremixErrorPath = (activeIndex: number) => (path: string) =>
    path
      .replace(/^premixes\.0\./, `premixes.${activeIndex}.`)
      .replace(/^premixes\.0$/, `premixes.${activeIndex}`);

  const remapFinalMixErrorPath = (activeIndex: number) => (path: string) =>
    path
      .replace(/^finalMixes\.0\./, `finalMixes.${activeIndex}.`)
      .replace(/^finalMixes\.0$/, `finalMixes.${activeIndex}`);

  const clearFieldError = useCallback((path: string) => {
    setValidationAttempt((flags) => (flags.format ? flags : { ...flags, format: true }));
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });
  }, []);

  const emitMixingValidationFailure = useCallback(
    (
      mappedErrors: Record<string, string>,
      intent: "draft" | "submit",
      navItems: CombinedNavItem[],
    ) => {
      const focus = resolveFirstMixingValidationFocus(mappedErrors);
      const firstMessage =
        (focus?.fieldPath && mappedErrors[focus.fieldPath]) ||
        Object.values(mappedErrors).find((m) => String(m ?? "").trim()) ||
        "";
      const base =
        intent === "draft"
          ? "Cannot save draft. Fix the validation errors first."
          : "Cannot submit. Fix the validation errors first.";
      // Explicit snackbar — same path as RMP / QC revalidation.
      useAlertStore.getState().showValidationAlert(
        firstMessage ? `${base} (${String(firstMessage).trim()})` : base,
      );

      if (focus) {
        const navIndex = navItems.findIndex(
          (item) => item.kind === focus.stageType && item.cardIndex === focus.cardIndex,
        );
        if (navIndex >= 0) setActiveCardIndex(navIndex);
        setValidationFocusRequest((prev) => ({
          id: (prev?.id ?? 0) + 1,
          fieldPath: focus.fieldPath,
        }));
      }
    },
    [],
  );

  // Focus after card paint / tab switch (rAF alone is too early when remounting Premix/Final Mix).
  useEffect(() => {
    if (!validationFocusRequest?.fieldPath) return;
    const fieldPath = validationFocusRequest.fieldPath;
    let tries = 0;
    const tryFocus = () => {
      tries += 1;
      if (focusMixField(fieldPath)) return;
      if (tries < 8) {
        window.setTimeout(tryFocus, 50);
      }
    };
    const t = window.setTimeout(tryFocus, 80);
    return () => clearTimeout(t);
  }, [validationFocusRequest, activeCardIndex, validationErrors]);

  useEffect(() => {
    let isMounted = true;

    const fetchCycles = async () => {
      const resolvedProjectId = String(projectId ?? "").trim();
      if (!resolvedProjectId || motorStage == null) return;
      setLoadingCycles(true);
      try {
        const response = await mixingController.fetchMixingCycle(
          resolvedProjectId,
          motorStage,
        );
        const dataList = (response as any)?.data?.data || (response as any)?.data || response || [];

        const list = Array.isArray(dataList) ? dataList : [dataList];
        const formatted = list
          .filter((item: any) => item && item.mixingCycleCode)
          .map((item: any) => ({
            value: String(item.mixingCycleCode),
            label: `${item.mixingCycleCode} - ${item.mixingCycleName || "Mixing Cycle"}`,
          }));

        if (isMounted) {
          setMixingCycleOptions(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch mixing cycle options", err);
      } finally {
        if (isMounted) setLoadingCycles(false);
      }
    };

    void fetchCycles();
    return () => {
      isMounted = false;
    };
  }, [projectId, motorStage]);

  const batchMixingStages = useMemo(
    () => identificationSheet?.metadata?.mixing?.stages ?? [],
    [identificationSheet?.metadata?.mixing?.stages],
  );
  const batchPremixBowlIds = useMemo(
    () => collectAssignedBowlIdsByStageType(batchMixingStages, "PREMIX"),
    [batchMixingStages],
  );

  const batchFinalMixBowlIds = useMemo(
    () => collectAssignedBowlIdsByStageType(batchMixingStages, "FINAL_MIX"),
    [batchMixingStages],
  );

  const getPremixBowlIdOptions = useCallback(
    (currentBowlId?: string | null) =>
      getAvailableBowlIds(
        BOWL_ID_OPTIONS,
        [...premixCards.map((card) => card.bowlId), ...batchPremixBowlIds],
        currentBowlId,
      ),
    [batchPremixBowlIds, premixCards],
  );

  const getFinalMixBowlIdOptions = useCallback(
    (currentBowlId?: string | null) =>
      getAvailableBowlIds(
        BOWL_ID_OPTIONS,
        [...finalMixCards.map((card) => card.bowlId), ...batchFinalMixBowlIds],
        currentBowlId,
      ),
    [batchFinalMixBowlIds, finalMixCards],
  );

  const combinedNavItems = useMemo<CombinedNavItem[]>(() => {
    const premixItems = premixCards.map((entry, cardIndex) => ({
      kind: "PREMIX" as const,
      id: `premix-${entry.premixNo}`,
      label: getPremixNoLabel(Number(entry.premixNo)),
      cardIndex,
    }));
    const finalMixItems = finalMixCards.map((entry, cardIndex) => ({
      kind: "FINAL_MIX" as const,
      id: `final-mix-${entry.mixNo}`,
      label: getFinalMixNoLabel(Number(entry.mixNo)),
      cardIndex,
    }));
    return [...premixItems, ...finalMixItems];
  }, [premixCards, finalMixCards]);

  const activeNavItem = combinedNavItems[activeCardIndex] ?? null;

  const activePremix =
    activeNavItem?.kind === "PREMIX" ? (premixCards[activeNavItem.cardIndex] ?? null) : null;
  const activeFinalMix =
    activeNavItem?.kind === "FINAL_MIX" ? (finalMixCards[activeNavItem.cardIndex] ?? null) : null;

  // Custom dependency gate: Check if corresponding premix is approved for final mix gating
  const isFinalMixUnlockedByPremix = useCallback(
    (finalMixCardIndex: number) => {
      const premixEntry = premixCards[finalMixCardIndex];
      if (!premixEntry) return false;
      const premixCardId = buildMixCardId("PREMIX", premixEntry.premixNo);
      const premixStatus =
        getMixCardStatus?.(premixCardId) ??
        mixCardStatusById[premixCardId]?.mixCardSubmissionStatus;
      return premixStatus === "APPROVED";
    },
    [premixCards, getMixCardStatus, mixCardStatusById],
  );

  // Handle active-tab-based Mixing Cycle selection and API details retrieval
  const handleMixingCycleSelection = useCallback(
    async (premixNo: string, cycleCode: string) => {
      const activeTab = activeNavItem?.kind;
      if (!activeTab) return;

      const matched = mixingCycleOptions.find((o) => String(o.value) === String(cycleCode));
      const cycleName =
        matched?.label?.replace(new RegExp(`^${cycleCode}\\s*-\\s*`), "")?.trim() ||
        matched?.label ||
        "";
      // Display value used by set*MixingCycle / mixingCycle field
      const cycleDisplay = cycleName ? `${cycleName} (${cycleCode})` : cycleCode;

      if (!cycleCode) {
        if (activeTab === "PREMIX") {
          setPremixMixingCycle(premixNo, "");
          updatePremixField(premixNo, "mixingCycleCode" as any, "");
          updatePremixField(premixNo, "mixingCycleName" as any, "");

          // paired final mix: same number
          const pairedMixNo = String(premixNo);
          setFinalMixMixingCycle(pairedMixNo, "");
          updateFinalMixField(pairedMixNo, "mixingCycleCode" as any, "");
          updateFinalMixField(pairedMixNo, "mixingCycleName" as any, "");
        }
        return;
      }

      try {
        const getPayloadData = (res: any) =>
          res && typeof res === "object" ? (res.data?.data ?? res.data ?? res) : null;

        if (activeTab === "PREMIX") {
          // cycle fields — THIS premix only
          setPremixMixingCycle(premixNo, cycleDisplay);
          updatePremixField(premixNo, "mixingCycleCode" as any, cycleCode);
          updatePremixField(premixNo, "mixingCycleName" as any, cycleName);

          // paired Final Mix N only (same number)
          const pairedMixNo = String(premixNo);
          setFinalMixMixingCycle(pairedMixNo, cycleDisplay);
          updateFinalMixField(pairedMixNo, "mixingCycleCode" as any, cycleCode);
          updateFinalMixField(pairedMixNo, "mixingCycleName" as any, cycleName);

          const premixRes = await mixingController.fetchMixingCycleDetails(cycleCode);
          const premixPayload = getPayloadData(premixRes);
          if (premixPayload) {
            const resolved = resolveMixingCycleQualityChecks(premixPayload);
            const premixQCRows = mapBackendQualityChecksToRows(resolved.premixQualityChecks);
            const rawOps =
              premixPayload.cycles?.premixOperations || premixPayload.premixOperations || [];
            const processRows = mapProcessRows(rawOps);

            // CRITICAL: third arg = this premix only
            applyPremixOperationsAndQCs(processRows, premixQCRows, premixNo);
          }

          // Final Mix ops/QCs for same cycle → paired card only
          const finalRes = await mixingController.fetchMixingCycleDetails(cycleCode);
          const finalPayload = getPayloadData(finalRes);
          if (finalPayload) {
            const resolved = resolveMixingCycleQualityChecks(finalPayload);
            const finalQCRows = mapBackendQualityChecksToRows(resolved.finalMixQualityChecks);
            const rawOps =
              finalPayload.cycles?.finalMixOperations || finalPayload.finalMixOperations || [];
            applyFinalMixOperationsAndQCs(mapProcessRows(rawOps), finalQCRows, pairedMixNo);
          }
        } else if (activeTab === "FINAL_MIX") {
          // Final Mix cycle is usually disabled; if ever enabled, same idea:
          // only this mixNo + optionally mirror to premix of same number
          setFinalMixMixingCycle(premixNo, cycleDisplay);
          updateFinalMixField(premixNo, "mixingCycleCode" as any, cycleCode);
          updateFinalMixField(premixNo, "mixingCycleName" as any, cycleName);

          const finalRes = await mixingController.fetchMixingCycleDetails(cycleCode);
          const finalPayload = getPayloadData(finalRes);
          if (finalPayload) {
            const resolved = resolveMixingCycleQualityChecks(finalPayload);
            const finalQCRows = mapBackendQualityChecksToRows(resolved.finalMixQualityChecks);
            const rawOps =
              finalPayload.cycles?.finalMixOperations || finalPayload.finalMixOperations || [];
            applyFinalMixOperationsAndQCs(mapProcessRows(rawOps), finalQCRows, premixNo);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch mixing cycle details for ${activeTab}`, error);
      }
    },
    [
      activeNavItem?.kind,
      mixingCycleOptions,
      setPremixMixingCycle,
      setFinalMixMixingCycle,
      updatePremixField,
      updateFinalMixField,
      applyPremixOperationsAndQCs,
      applyFinalMixOperationsAndQCs,
    ],
  );

  useEffect(() => {
    finalMixCards.forEach((card) => {
      if (card.mixingCycleCode) return;
      const pairedPremix = premixCards.find((p) => String(p.premixNo) === String(card.mixNo));
      if (!pairedPremix?.mixingCycleCode) return;

      const code = pairedPremix.mixingCycleCode;
      const name = pairedPremix.mixingCycleName ?? "";
      const display = pairedPremix.mixingCycle || (name ? `${name} (${code})` : code);

      updateFinalMixField(card.mixNo, "mixingCycleCode" as any, code);
      if (name) updateFinalMixField(card.mixNo, "mixingCycleName" as any, name);
      setFinalMixMixingCycle(card.mixNo, display);
    });
  }, [premixCards, finalMixCards, updateFinalMixField, setFinalMixMixingCycle]);

  // When active Final Mix has cycle but empty process rows → load only that card
  useEffect(() => {
    if (!activeFinalMix) return;

    const pairedPremix = premixCards.find(
      (p) => String(p.premixNo) === String(activeFinalMix.mixNo),
    );
    const cycleCode = activeFinalMix.mixingCycleCode || pairedPremix?.mixingCycleCode || "";
    if (!cycleCode) return;

    const hasProcess = (activeFinalMix.processParticulars || []).length > 0;
    if (hasProcess) return;

    let cancelled = false;
    (async () => {
      try {
        if (!activeFinalMix.mixingCycleCode) {
          updateFinalMixField(activeFinalMix.mixNo, "mixingCycleCode" as any, cycleCode);
          const name = pairedPremix?.mixingCycleName ?? "";
          if (name) {
            updateFinalMixField(activeFinalMix.mixNo, "mixingCycleName" as any, name);
          }
        }

        const res = await mixingController.fetchMixingCycleDetails(cycleCode);
        const payload = res && typeof res === "object" ? (res.data?.data ?? res.data ?? res) : null;
        if (cancelled || !payload) return;

        const resolved = resolveMixingCycleQualityChecks(payload);
        const qcRows = mapBackendQualityChecksToRows(resolved.finalMixQualityChecks);
        const rawOps = payload.cycles?.finalMixOperations || payload.finalMixOperations || [];
        applyFinalMixOperationsAndQCs(
          mapProcessRows(rawOps),
          qcRows,
          activeFinalMix.mixNo, // only this card
        );
      } catch (err) {
        console.warn("Failed Final Mix cycle load for pair", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeFinalMix?.mixNo,
    activeFinalMix?.mixingCycleCode,
    activeFinalMix?.processParticulars?.length,
    premixCards,
    updateFinalMixField,
    applyFinalMixOperationsAndQCs,
  ]);
  const resolveStatus = useCallback(
    (stageType: MixCardStageType, cardNo: string) => {
      const mixCardId = buildMixCardId(stageType, cardNo);
      return (
        getMixCardStatus?.(mixCardId) ??
        mixCardStatusById[mixCardId]?.mixCardSubmissionStatus ??
        "TO_BE_INITIATED"
      );
    },
    [getMixCardStatus, mixCardStatusById],
  );

  const isMixCardWorkflowEnabled = useCallback(
    (stageType: MixCardStageType, cardNo: string | number) => {
      if (stageType === "PREMIX") {
        return isPremixEnabledForWorkflowWithBatch(
          batchStageContext,
          SUB_DEPT.MIXING,
          cardNo,
          premixCards.map((card) => card.premixNo),
          previousStageGate,
          (premixNo) => resolveStatus("PREMIX", String(premixNo)),
          "PREMIX",
        );
      }
      // Final mix requires explicit premix approval check
      const cardIndex = finalMixCards.findIndex((f) => String(f.mixNo) === String(cardNo));
      if (cardIndex >= 0 && !isFinalMixUnlockedByPremix(cardIndex)) {
        return false;
      }
      return isPremixEnabledForWorkflowWithBatch(
        batchStageContext,
        SUB_DEPT.MIXING,
        cardNo,
        finalMixCards.map((card) => card.mixNo),
        previousStageGate,
        (mixNo) => resolveStatus("FINAL_MIX", String(mixNo)),
        "FINAL_MIX",
      );
    },
    [
      batchStageContext,
      finalMixCards,
      premixCards,
      previousStageGate,
      resolveStatus,
      isFinalMixUnlockedByPremix,
    ],
  );

  useEffect(() => {
    if (combinedNavItems.length === 0) {
      setActiveCardIndex(0);
      return;
    }
    const firstEnabled = combinedNavItems.findIndex((item) => {
      const cardNo =
        item.kind === "PREMIX"
          ? premixCards[item.cardIndex]?.premixNo
          : finalMixCards[item.cardIndex]?.mixNo;
      if (cardNo == null || cardNo === "") return false;
      return isMixCardWorkflowEnabled(item.kind, cardNo);
    });
    setActiveCardIndex((prev) => {
      const currentItem = combinedNavItems[prev];
      if (currentItem) {
        const cardNo =
          currentItem.kind === "PREMIX"
            ? premixCards[currentItem.cardIndex]?.premixNo
            : finalMixCards[currentItem.cardIndex]?.mixNo;
        if (cardNo != null && cardNo !== "" && isMixCardWorkflowEnabled(currentItem.kind, cardNo)) {
          return Math.min(prev, combinedNavItems.length - 1);
        }
      }
      return firstEnabled >= 0 ? firstEnabled : Math.min(prev, combinedNavItems.length - 1);
    });
  }, [combinedNavItems, finalMixCards, isMixCardWorkflowEnabled, premixCards]);

  const activeMixCardId = activePremix
    ? buildMixCardId("PREMIX", activePremix.premixNo)
    : activeFinalMix
      ? buildMixCardId("FINAL_MIX", activeFinalMix.mixNo)
      : null;

  const activeMixCardStatus =
    (activeMixCardId
      ? (getMixCardStatus?.(activeMixCardId) ??
        mixCardStatusById[activeMixCardId]?.mixCardSubmissionStatus)
      : undefined) ?? "TO_BE_INITIATED";

  const activeUnitEnabled = activePremix
    ? isMixCardWorkflowEnabled("PREMIX", activePremix.premixNo)
    : activeFinalMix
      ? isMixCardWorkflowEnabled("FINAL_MIX", activeFinalMix.mixNo)
      : false;

  const activeMixCardLocked =
    !activeUnitEnabled ||
    (activeMixCardId != null
      ? !(checkMixCardEditable?.(activeMixCardId) ?? !isMixCardLocked(activeMixCardStatus))
      : false);

  const combinedNavTabs = useMemo(
    () =>
      combinedNavItems.map((item) => {
        const cardNo =
          item.kind === "PREMIX"
            ? String(premixCards[item.cardIndex]?.premixNo ?? "")
            : String(finalMixCards[item.cardIndex]?.mixNo ?? "");
        const status = resolveStatus(item.kind, cardNo);
        const selected =
          activeNavItem?.kind === item.kind && activeNavItem.cardIndex === item.cardIndex;
        return {
          id: item.id,
          label: item.label,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              showIcon={false}
              variant="embedded"
              onAccent={selected}
            />
          ),
        };
      }),
    [activeNavItem, combinedNavItems, finalMixCards, premixCards, resolveStatus, statusConfig],
  );

  const finalApprovalRows = useMemo(
    () => buildFinalApprovalMixCardRows({ premixCards, finalMixCards }, mixCardStatusById),
    [finalMixCards, mixCardStatusById, premixCards],
  );
  const allMixCardsApproved = areAllMixCardsApproved(finalApprovalRows);

  const handleSaveDraftClick = async (
    stageType: "PREMIX" | "FINAL_MIX",
    cardNo: string | number,
  ) => {
    setValidationAttempt((flags) => ({ ...flags, format: true, unit: true, submit: false }));
    if (stageType === "PREMIX") {
      const activeIndex = premixCards.findIndex((p) => p.premixNo === String(cardNo));
      if (activeIndex < 0) return;
      const payload = { premixes: [premixCards[activeIndex]] };
      const errs = validateMixing(payload, "UNIT");
      if (hasValidationErrors(errs)) {
        const mapped = mapAndSetErrors(errs, remapPremixErrorPath(activeIndex));
        emitMixingValidationFailure(mapped, "draft", combinedNavItems);
        return;
      }
      setValidationErrors({});
      onSaveMixCardDraft?.(stageType, String(cardNo));
    } else {
      const activeIndex = finalMixCards.findIndex((f) => f.mixNo === String(cardNo));
      if (activeIndex < 0) return;
      const payload = { finalMixes: [finalMixCards[activeIndex]] };
      const errs = validateMixing(payload, "UNIT");
      if (hasValidationErrors(errs)) {
        const mapped = mapAndSetErrors(errs, remapFinalMixErrorPath(activeIndex));
        emitMixingValidationFailure(mapped, "draft", combinedNavItems);
        return;
      }
      setValidationErrors({});
      onSaveMixCardDraft?.(stageType, String(cardNo));
    }
  };

  const handleSubmitClick = async (stageType: "PREMIX" | "FINAL_MIX", cardNo: string | number) => {
    setValidationAttempt({ format: true, unit: true, submit: true });
    if (stageType === "PREMIX") {
      const activeIndex = premixCards.findIndex((p) => p.premixNo === String(cardNo));
      if (activeIndex < 0) return;
      const payload = { premixes: [premixCards[activeIndex]] };
      const errs = validateMixing(payload, "SUBMIT");
      if (hasValidationErrors(errs)) {
        const mapped = mapAndSetErrors(errs, remapPremixErrorPath(activeIndex));
        emitMixingValidationFailure(mapped, "submit", combinedNavItems);
        return;
      }
      setValidationErrors({});
      setValidationAttempt({ format: false, unit: false, submit: false });
      onSubmitMixCard?.(stageType, String(cardNo));
    } else {
      const activeIndex = finalMixCards.findIndex((f) => f.mixNo === String(cardNo));
      if (activeIndex < 0) return;
      const payload = { finalMixes: [finalMixCards[activeIndex]] };
      const errs = validateMixing(payload, "SUBMIT");
      if (hasValidationErrors(errs)) {
        const mapped = mapAndSetErrors(errs, remapFinalMixErrorPath(activeIndex));
        emitMixingValidationFailure(mapped, "submit", combinedNavItems);
        return;
      }
      setValidationErrors({});
      setValidationAttempt({ format: false, unit: false, submit: false });
      onSubmitMixCard?.(stageType, String(cardNo));
    }
  };

  // Live validation from the start: FORMAT always after first edit/attempt; SUBMIT after failed submit.
  useEffect(() => {
    const activePremixItem = activePremix;
    const activeFinalMixItem = activeFinalMix;
    if (!activePremixItem && !activeFinalMixItem) return;

    const attempt = validationAttemptRef.current;
    if (!attempt.format && !attempt.unit && !attempt.submit) return;

    // Keep required highlights after Save (UNIT) / Submit — do not wipe with FORMAT.
    const tier: ValidationTier = attempt.submit
      ? "SUBMIT"
      : attempt.unit
        ? "UNIT"
        : "FORMAT";
    const handler = setTimeout(() => {
      if (activePremixItem) {
        const activeIndex = premixCards.findIndex((p) => p.premixNo === activePremixItem.premixNo);
        if (activeIndex < 0) return;
        const payload = { premixes: [activePremixItem] };
        const errs = validateMixing(payload, tier);
        const prefix = `premixes.${activeIndex}.`;
        setValidationErrors((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (key.startsWith(prefix) || key === `premixes.${activeIndex}`) delete next[key];
          });
          for (const [path, message] of Object.entries(errs)) {
            const mappedPath = path
              .replace(/^premixes\.0\./, prefix)
              .replace(/^premixes\.0$/, `premixes.${activeIndex}`);
            next[mappedPath] = message;
          }
          return next;
        });
      } else if (activeFinalMixItem) {
        const activeIndex = finalMixCards.findIndex((f) => f.mixNo === activeFinalMixItem.mixNo);
        if (activeIndex < 0) return;
        const payload = { finalMixes: [activeFinalMixItem] };
        const errs = validateMixing(payload, tier);
        const prefix = `finalMixes.${activeIndex}.`;
        setValidationErrors((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (key.startsWith(prefix) || key === `finalMixes.${activeIndex}`) delete next[key];
          });
          for (const [path, message] of Object.entries(errs)) {
            const mappedPath = path
              .replace(/^finalMixes\.0\./, prefix)
              .replace(/^finalMixes\.0$/, `finalMixes.${activeIndex}`);
            next[mappedPath] = message;
          }
          return next;
        });
      }
    }, 120);

    return () => clearTimeout(handler);
  }, [activePremix, activeFinalMix, premixCards, finalMixCards, validationAttempt]);

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        mb={2.5}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "11px",
              background: "linear-gradient(135deg,#1565C0,#1976D2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
            }}
          >
            <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
              {S.FORM_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
              {S.FORM_SUBTITLE}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {combinedNavItems.length === 0 || (!activePremix && !activeFinalMix) ? (
        <EmptySectionState message={S.NO_STAGE_CARDS} />
      ) : (
        <MixingCardNavigation
          sectionTitle={S.STAGE_NAV_TITLE}
          sectionHint={S.STAGE_NAV_HINT}
          tabs={combinedNavTabs}
          activeIndex={activeCardIndex}
          onActiveIndexChange={setActiveCardIndex}
          isTabDisabled={(_, index) => {
            const item = combinedNavItems[index];
            if (!item) return true;
            const cardNo =
              item.kind === "PREMIX"
                ? premixCards[item.cardIndex]?.premixNo
                : finalMixCards[item.cardIndex]?.mixNo;
            if (cardNo == null || cardNo === "") return true;
            return !isMixCardWorkflowEnabled(item.kind, cardNo);
          }}
          tabTooltip={(_, index) => {
            const item = combinedNavItems[index];
            if (!item) return undefined;
            if (item.kind === "PREMIX") {
              const orderedPremixNos = premixCards.map((card) => card.premixNo);
              const premixIndex = item.cardIndex;
              return getPremixNavTabDisabledReasonWithBatch(
                batchStageContext,
                SUB_DEPT.MIXING,
                premixCards[premixIndex]?.premixNo,
                premixIndex,
                orderedPremixNos,
                previousStageGate,
                (premixNo) => resolveStatus("PREMIX", String(premixNo)),
                {
                  previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED,
                  notYetUnlocked: STRINGS.MANUFACTURING.NOT_YET_UNLOCKED,
                  sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
                },
                "PREMIX",
              );
            }
            const finalMixIndex = item.cardIndex;
            if (!isFinalMixUnlockedByPremix(finalMixIndex)) {
              return "Premix stage must be approved before unlocking Final Mix.";
            }
            const orderedFinalMixNos = finalMixCards.map((card) => card.mixNo);
            return getPremixNavTabDisabledReasonWithBatch(
              batchStageContext,
              SUB_DEPT.MIXING,
              finalMixCards[finalMixIndex]?.mixNo,
              finalMixIndex,
              orderedFinalMixNos,
              previousStageGate,
              (mixNo) => resolveStatus("FINAL_MIX", String(mixNo)),
              {
                previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED,
                notYetUnlocked: STRINGS.MANUFACTURING.NOT_YET_UNLOCKED,
                sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
              },
              "FINAL_MIX",
            );
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {activePremix ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={actionLoading || activeMixCardLocked}
                    onClick={() => handleSaveDraftClick("PREMIX", activePremix.premixNo)}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {S.SAVE_PREMIX_DRAFT(activePremix.premixNo)}
                  </Button>
                  <SubmitForApprovalButton
                    disabled={actionLoading || activeMixCardLocked}
                    onClick={() => handleSubmitClick("PREMIX", activePremix.premixNo)}
                    label={S.SUBMIT_PREMIX(activePremix.premixNo)}
                  />
                </>
              ) : activeFinalMix ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={actionLoading || activeMixCardLocked}
                    onClick={() => handleSaveDraftClick("FINAL_MIX", activeFinalMix.mixNo)}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {S.SAVE_FINAL_MIX_DRAFT(activeFinalMix.mixNo)}
                  </Button>
                  <SubmitForApprovalButton
                    disabled={actionLoading || activeMixCardLocked}
                    onClick={() => handleSubmitClick("FINAL_MIX", activeFinalMix.mixNo)}
                    label={S.SUBMIT_FINAL_MIX(activeFinalMix.mixNo)}
                  />
                </>
              ) : null}
              <ViewStatusButton
                disabled={actionLoading}
                onClick={() => setFinalApprovalOpen(true)}
                label={S.VIEW_STATUS}
              />
            </Stack>

            {activePremix ? (
              <PremixStageCard
                key={`premix-card-${activePremix.premixNo}`}
                cardIdx={premixCards.findIndex((p) => p.premixNo === activePremix.premixNo)}
                premix={activePremix}
                bowlIdOptions={getPremixBowlIdOptions(activePremix.bowlId)}
                buildingOptions={buildingOptions}
                mixingCycleOptions={mixingCycleOptions}
                loadingBuildings={loadingBuildings}
                loadingCycles={loadingCycles}
                readOnly={activeMixCardLocked}
                statusChip={
                  <PremixStatusChip
                    status={activeMixCardStatus as any}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                }
                lockedMessage={
                  !activeUnitEnabled
                    ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED
                    : activeMixCardLocked
                      ? activeMixCardStatus === "APPROVED"
                        ? S.MIX_CARD_LOCKED_APPROVED
                        : S.MIX_CARD_LOCKED_WAITING
                      : null
                }
                onRemove={removePremixCard}
                onPremixFieldChange={updatePremixField}
                onMixingCycleChange={(premixNo, cycleCode) => {
                  void handleMixingCycleSelection(String(premixNo), cycleCode);
                }}
                onProcessChange={updateProcessParticular}
                onQualityChange={updateQualityCheck}
                onClearFieldError={clearFieldError}
                errors={validationErrors}
                validationAttempt={validationAttempt}
                isEditMode={isEditMode}
              />
            ) : activeFinalMix ? (
              <FinalMixStageCard
                key={`final-mix-card-${activeFinalMix.mixNo}`}
                cardIdx={finalMixCards.findIndex((f) => f.mixNo === activeFinalMix.mixNo)}
                entry={activeFinalMix}
                bowlIdOptions={getFinalMixBowlIdOptions(activeFinalMix.bowlId)}
                buildingOptions={buildingOptions}
                mixingCycleOptions={mixingCycleOptions}
                loadingBuildings={loadingBuildings}
                loadingCycles={loadingCycles}
                readOnly={activeMixCardLocked}
                statusChip={
                  <PremixStatusChip
                    status={activeMixCardStatus as any}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                }
                lockedMessage={
                  !isFinalMixUnlockedByPremix(
                    finalMixCards.findIndex((f) => f.mixNo === activeFinalMix.mixNo),
                  )
                    ? "Premix stage must be approved before this Final Mix is available."
                    : !activeUnitEnabled
                      ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED
                      : activeMixCardLocked
                        ? activeMixCardStatus === "APPROVED"
                          ? S.MIX_CARD_LOCKED_APPROVED
                          : S.MIX_CARD_LOCKED_WAITING
                        : null
                }
                onRemove={removeFinalMixCard}
                onFieldChange={updateFinalMixField}
                onQualityChange={updateFinalMixQualityCheck}
                onProcessChange={updateFinalMixProcessParticular}
                errors={validationErrors}
                validationAttempt={validationAttempt}
                onClearFieldError={clearFieldError}
                isEditMode={isEditMode}
              />
            ) : null}
          </Stack>
        </MixingCardNavigation>
      )}

      <FinalApprovalMixCardDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMixCardsApproved={allMixCardsApproved}
        hideConfirm
        onClose={() => setFinalApprovalOpen(false)}
      />
    </Box>
  );
};

export default MixingForm;

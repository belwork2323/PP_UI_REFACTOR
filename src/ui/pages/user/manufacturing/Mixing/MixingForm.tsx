import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
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
  type MixCardStageType,
  type MixCardStatusMeta,
  type MixCardSubmissionStatus,
} from "../../../../../data/models/user/MixingFormModel";
import type { FinalMixEntry, PremixEntry } from "../../../../../data/models/user/MixingFormModel";
import { useMixingFormHook } from "../../../../../hooks/user/manufacturing/useMixingFormHook";
import {
  isPremixEnabledForWorkflow,
  getPremixNavTabDisabledReason,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import { mixingController } from "../../../../../controllers/user/manufacturing/mixingController";
import MixingDateField from "./MixingDateField";
import MixingCardNavigation from "./MixingCardNavigation";
import MixingQualityChecksTable from "./MixingQualityChecksTable";
import { MixingSelectField, MixingTableInput, MixingTextField } from "./MixingFormFields";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import FinalApprovalMixCardDialog, {
  areAllMixCardsApproved,
  buildFinalApprovalMixCardRows,
} from "./components/FinalApprovalMixCardDialog";

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

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "11px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 12px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const tableShellSx = {
  overflowX: "auto" as const,
  border: `1px solid ${alpha(BRAND.border, 0.85)}`,
  borderRadius: 2,
  background: "#fff",
};

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
  premix: PremixEntry;
  bowlIdOptions: string[];
  readOnly?: boolean;
  statusChip?: React.ReactNode;
  headerActions?: React.ReactNode;
  lockedMessage?: string | null;
  onRemove: (premixNo: string) => void;
  onPremixFieldChange: (
    premixNo: string,
    field: keyof Omit<PremixEntry, "premixNo" | "processParticulars" | "qualityChecks">,
    value: string,
  ) => void;
  onProcessChange: (
    premixNo: string,
    rowId: number,
    field: "rpm" | "time" | "temp" | "vacuum",
    value: string,
  ) => void;
  onQualityChange: (
    premixNo: string,
    parameter: string,
    field: "observed1" | "observed2" | "observed3" | "observed4",
    value: string,
  ) => void;
};

const PremixStageCard = ({
  premix,
  bowlIdOptions,
  readOnly = false,
  statusChip,
  headerActions,
  lockedMessage,
  onRemove,
  onPremixFieldChange,
  onProcessChange,
  onQualityChange,
}: PremixStageCardProps) => (
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
          />
          <MixingTextField
            label="Building No"
            value={premix.bldgNo}
            placeholder="Building No"
            disabled
            onChange={() => undefined}
          />
          <MixingDateField
            label={S.LABEL_PREMIX_DATE}
            value={premix.premixDate}
            placeholder="DD-MM-YYYY"
            onChange={(value) => onPremixFieldChange(premix.premixNo, "premixDate", value)}
            disabled
            fullWidth="100%"
          />
          <MixingTextField
            label={S.LABEL_PREMIX_QTY}
            value={premix.premixQuantity}
            placeholder={S.PLACEHOLDER_PREMIX_QTY}
            type="number"
            disabled
            onChange={() => undefined}
          />
          <MixingTextField
            label={S.LABEL_MIXING_CYCLE}
            value={premix.mixingCycle ? `${premix.mixingCycle}` : ""}
            placeholder={S.PLACEHOLDER_MIXING_CYCLE}
            disabled
            onChange={() => undefined}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <MixingSelectField
            label={S.LABEL_BOWL_ID}
            value={premix.bowlId}
            placeholder={S.PLACEHOLDER_BOWL_ID}
            options={bowlIdOptions}
            disabled={readOnly}
            onChange={(value) => onPremixFieldChange(premix.premixNo, "bowlId", value)}
          />
          <MixingDateField
            label={S.LABEL_BOWL_TRIAL_DATE}
            value={premix.bowlTrialDate}
            placeholder="DD-MM-YYYY"
            fullWidth="100%"
            disabled={readOnly}
            onChange={(value) => onPremixFieldChange(premix.premixNo, "bowlTrialDate", value)}
          />
          <Box>
            <MixingTextField
              label={S.LABEL_BOWL_TRIAL_OBS}
              value={premix.bowlTrialObservations}
              placeholder={S.PLACEHOLDER_BOWL_TRIAL_OBS}
              multiline
              minRows={2}
              disabled={readOnly}
              onChange={(value) =>
                onPremixFieldChange(premix.premixNo, "bowlTrialObservations", value)
              }
            />
          </Box>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
        {S.SECTION_PROCESS_PARTICULARS}
      </Typography>
      {/* <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 1.2 }}>
        {S.SECTION_PROCESS_PARTICULARS_HINT}
      </Typography> */}
      <TableContainer sx={{ ...tableShellSx, mb: 2.5 }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 320 }}>{S.COL_OPERATION}</TH>
              <TH>{S.COL_ROTATION}</TH>
              <TH>{S.COL_TIME}</TH>
              <TH>{S.COL_TEMP}</TH>
              <TH>{S.COL_VACUUM}</TH>
            </TableRow>
          </TableHead>
          <TableBody>
            {premix.processParticulars.length === 0 ? (
              <TableRow>
                <TD colSpan={5}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      color: BRAND.textSub,
                      py: 1,
                    }}
                  >
                    {S.PROCESS_PARTICULARS_EMPTY}
                  </Typography>
                </TD>
              </TableRow>
            ) : (
              premix.processParticulars.map((row, rowIdx) => (
                <TableRow
                  key={row.operationId}
                  sx={{
                    background: rowIdx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                  }}
                >
                  <TD>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: BRAND.text,
                      }}
                    >
                      {row.operation || `Operation ${row.operationId}`}
                    </Typography>
                  </TD>

                  {(["rpm", "time", "temp", "vacuum"] as const).map((field) => (
                    <TD key={field}>
                      <MixingTableInput
                        value={row[field]}
                        placeholder={PROCESS_PLACEHOLDERS[field]}
                        disabled={readOnly}
                        onChange={(value) =>
                          onProcessChange(premix.premixNo, row.operationId, field, value)
                        }
                      />
                    </TD>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
        {S.SECTION_QUALITY_CHECKS}
      </Typography>

      <MixingQualityChecksTable
        rows={premix.qualityChecks}
        readOnly={readOnly}
        onChange={(parameter, field, value) =>
          onQualityChange(premix.premixNo, parameter, field, value)
        }
      />
    </Box>
  </SectionCard>
);

const FinalMixStageCard = ({
  entry,
  bowlIdOptions,
  readOnly = false,
  statusChip,
  headerActions,
  lockedMessage,
  onRemove,
  onFieldChange,
  onProcessChange,
  onQualityChange,
}: {
  entry: FinalMixEntry;
  bowlIdOptions: string[];
  readOnly?: boolean;
  statusChip?: React.ReactNode;
  headerActions?: React.ReactNode;
  lockedMessage?: string | null;
  onRemove: (mixNo: string) => void;
  onFieldChange: (
    mixNo: string,
    field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks">,
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
    parameter: string,
    field: "observed1" | "observed2" | "observed3" | "observed4",
    value: string,
  ) => void;
}) => (
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
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <MixingTextField
          label="Linked Premix No"
          value={entry.linkedPremixNo}
          placeholder="Linked Premix No"
          disabled
          onChange={() => undefined}
        />
        <MixingTextField
          label="Mixer"
          value={entry.mixerType}
          placeholder="Mixer"
          disabled
          onChange={() => undefined}
        />
        <MixingTextField
          label="Building No"
          value={entry.bldgNo}
          placeholder="Building No"
          disabled
          onChange={() => undefined}
        />
        <MixingTextField
          label={S.LABEL_MIXING_CYCLE}
          value={entry.mixingCycle ? `${entry.mixingCycle}` : ""}
          placeholder={S.PLACEHOLDER_MIXING_CYCLE}
          disabled
          onChange={() => undefined}
        />
        <MixingSelectField
          label={S.LABEL_BOWL_ID}
          value={entry.bowlId}
          placeholder={S.PLACEHOLDER_BOWL_ID}
          options={bowlIdOptions}
          disabled={readOnly}
          onChange={(value) => onFieldChange(entry.mixNo, "bowlId", value)}
        />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
        {S.SECTION_PROCESS_PARTICULARS}
      </Typography>

      {/* <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 1.2 }}>
        {S.SECTION_PROCESS_PARTICULARS_HINT}
      </Typography> */}

      <TableContainer sx={{ ...tableShellSx, mb: 2.5 }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 320 }}>{S.COL_OPERATION}</TH>
              <TH>{S.COL_ROTATION}</TH>
              <TH>{S.COL_TIME}</TH>
              <TH>{S.COL_TEMP}</TH>
              <TH>{S.COL_VACUUM}</TH>
            </TableRow>
          </TableHead>

          <TableBody>
            {entry.processParticulars.length === 0 ? (
              <TableRow>
                <TD colSpan={5}>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      color: BRAND.textSub,
                      py: 1,
                    }}
                  >
                    {S.PROCESS_PARTICULARS_EMPTY}
                  </Typography>
                </TD>
              </TableRow>
            ) : (
              entry.processParticulars.map((row, rowIdx) => (
                <TableRow
                  key={row.operationId}
                  sx={{
                    background: rowIdx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                  }}
                >
                  <TD>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        color: BRAND.text,
                      }}
                    >
                      {row.operation || `Operation ${row.operationId}`}
                    </Typography>
                  </TD>

                  {(["rpm", "time", "temp", "vacuum"] as const).map((field) => (
                    <TD key={field}>
                      <MixingTableInput
                        value={row[field]}
                        placeholder={PROCESS_PLACEHOLDERS[field]}
                        disabled={readOnly}
                        onChange={(value) =>
                          onProcessChange(entry.mixNo, row.operationId, field, value)
                        }
                      />
                    </TD>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
        {S.SECTION_QUALITY_CHECKS}
      </Typography>

      <MixingQualityChecksTable
        rows={entry.qualityChecks}
        readOnly={readOnly}
        onChange={(parameter, field, value) =>
          onQualityChange(entry.mixNo, parameter, field, value)
        }
      />
    </Box>
  </SectionCard>
);

type MixingFormProps = {
  initialData?: ReturnType<typeof createDefaultMixingFormState>;
  numberOfPremix?: number;
  motorStage?: number;
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
  actionLoading?: boolean;
  canSubmitForFinalApproval?: boolean;
  onSaveMixCardDraft?: (stageType: MixCardStageType, cardNo: string) => void;
  onSubmitMixCard?: (stageType: MixCardStageType, cardNo: string) => void;
  onSubmitForFinalApproval?: () => void;
};

const MixingForm = ({
  initialData,
  numberOfPremix,
  motorStage,
  onBlocksChange,
  identificationSheet,
  mixCardStatusById = {},
  getMixCardStatus,
  isMixCardEditable: checkMixCardEditable,
  previousStageGate = null,
  actionLoading = false,
  canSubmitForFinalApproval = false,
  onSaveMixCardDraft,
  onSubmitMixCard,
  onSubmitForFinalApproval,
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
  } = useMixingFormHook(
    initialData ?? createDefaultMixingFormState(),
    onBlocksChange,
    numberOfPremix,
    identificationSheet,
  );

  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const statusConfig = useMemo(
    () => getMixingTheme(manufacturingTheme).details.bannerStatusConfig,
    [manufacturingTheme],
  );
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const loadQualityChecks = async () => {
      try {
        const [premixResponse, finalMixResponse] = await Promise.all([
          mixingController.fetchQualityChecks("PREMIX", motorStage),
          mixingController.fetchQualityChecks("FINAL_MIX", motorStage),
        ]);

        if (!isMounted) return;

        const mapRows = (response: any) => {
          const definitions =
            (Array.isArray(response?.data?.data?.qualityChecks) &&
              response.data.data.qualityChecks) ||
            (Array.isArray(response?.data?.qualityChecks) && response.data.qualityChecks) ||
            (Array.isArray(response?.qualityChecks) && response.qualityChecks) ||
            [];
          return mapBackendQualityChecksToRows(definitions);
        };

        applyPremixQualityChecks(mapRows(premixResponse));
        applyFinalMixQualityChecks(mapRows(finalMixResponse));
      } catch (error) {
        console.warn("Failed to fetch quality checks", error);
      }
    };

    void loadQualityChecks();

    return () => {
      isMounted = false;
    };
  }, [motorStage, applyPremixQualityChecks, applyFinalMixQualityChecks]);

  const handleRemovePremix = useCallback(
    (premixNo: string) => {
      const removedNavIndex = combinedNavItems.findIndex(
        (item) => item.kind === "PREMIX" && premixCards[item.cardIndex]?.premixNo === premixNo,
      );
      removePremixCard(premixNo);
      if (removedNavIndex >= 0) {
        setActiveCardIndex((prev) => {
          if (prev > removedNavIndex) return prev - 1;
          if (prev === removedNavIndex) return Math.max(0, prev - 1);
          return prev;
        });
      }
    },
    [combinedNavItems, premixCards, removePremixCard],
  );

  const handleRemoveFinalMix = useCallback(
    (mixNo: string) => {
      const removedNavIndex = combinedNavItems.findIndex(
        (item) => item.kind === "FINAL_MIX" && finalMixCards[item.cardIndex]?.mixNo === mixNo,
      );
      removeFinalMixCard(mixNo);
      if (removedNavIndex >= 0) {
        setActiveCardIndex((prev) => {
          if (prev > removedNavIndex) return prev - 1;
          if (prev === removedNavIndex) return Math.max(0, prev - 1);
          return prev;
        });
      }
    },
    [combinedNavItems, finalMixCards, removeFinalMixCard],
  );

  const activeNavItem = combinedNavItems[activeCardIndex] ?? null;
  const activePremix =
    activeNavItem?.kind === "PREMIX" ? premixCards[activeNavItem.cardIndex] ?? null : null;
  const activeFinalMix =
    activeNavItem?.kind === "FINAL_MIX" ? finalMixCards[activeNavItem.cardIndex] ?? null : null;

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
        return isPremixEnabledForWorkflow(
          cardNo,
          premixCards.map((card) => card.premixNo),
          previousStageGate,
          (premixNo) => resolveStatus("PREMIX", String(premixNo)),
        );
      }
      return isPremixEnabledForWorkflow(
        cardNo,
        finalMixCards.map((card) => card.mixNo),
        previousStageGate,
        (mixNo) => resolveStatus("FINAL_MIX", String(mixNo)),
      );
    },
    [finalMixCards, premixCards, previousStageGate, resolveStatus],
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
      ? getMixCardStatus?.(activeMixCardId) ??
        mixCardStatusById[activeMixCardId]?.mixCardSubmissionStatus
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
    [
      activeNavItem,
      combinedNavItems,
      finalMixCards,
      premixCards,
      resolveStatus,
      statusConfig,
    ],
  );

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMixCardRows(
        { premixCards, finalMixCards },
        mixCardStatusById,
      ),
    [finalMixCards, mixCardStatusById, premixCards],
  );
  const allMixCardsApproved = areAllMixCardsApproved(finalApprovalRows);

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
              return getPremixNavTabDisabledReason(
                premixCards[premixIndex]?.premixNo,
                premixIndex,
                orderedPremixNos,
                previousStageGate,
                (premixNo) => resolveStatus("PREMIX", String(premixNo)),
                {
                  previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED,
                  sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
                },
              );
            }
            const orderedFinalMixNos = finalMixCards.map((card) => card.mixNo);
            const finalMixIndex = item.cardIndex;
            return getPremixNavTabDisabledReason(
              finalMixCards[finalMixIndex]?.mixNo,
              finalMixIndex,
              orderedFinalMixNos,
              previousStageGate,
              (mixNo) => resolveStatus("FINAL_MIX", String(mixNo)),
              {
                previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_PREMIX_TAB_DISABLED,
                sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
              },
            );
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                size="small"
                disabled={actionLoading || !canSubmitForFinalApproval}
                onClick={() => setFinalApprovalOpen(true)}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {S.SUBMIT_FOR_FINAL_APPROVAL}
              </Button>
            </Stack>

            {activePremix ? (
              <PremixStageCard
                key={`premix-card-${activePremix.premixNo}`}
                premix={activePremix}
                bowlIdOptions={getPremixBowlIdOptions(activePremix.bowlId)}
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
                headerActions={
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={actionLoading || activeMixCardLocked}
                      onClick={() => onSaveMixCardDraft?.("PREMIX", activePremix.premixNo)}
                    >
                      {S.SAVE_PREMIX_DRAFT}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={actionLoading || activeMixCardLocked}
                      onClick={() => onSubmitMixCard?.("PREMIX", activePremix.premixNo)}
                    >
                      {S.SUBMIT_PREMIX}
                    </Button>
                  </Stack>
                }
                onRemove={handleRemovePremix}
                onPremixFieldChange={updatePremixField}
                onProcessChange={updateProcessParticular}
                onQualityChange={updateQualityCheck}
              />
            ) : activeFinalMix ? (
              <FinalMixStageCard
                key={`final-mix-card-${activeFinalMix.mixNo}`}
                entry={activeFinalMix}
                bowlIdOptions={getFinalMixBowlIdOptions(activeFinalMix.bowlId)}
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
                headerActions={
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={actionLoading || activeMixCardLocked}
                      onClick={() => onSaveMixCardDraft?.("FINAL_MIX", activeFinalMix.mixNo)}
                    >
                      {S.SAVE_FINAL_MIX_DRAFT}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={actionLoading || activeMixCardLocked}
                      onClick={() => onSubmitMixCard?.("FINAL_MIX", activeFinalMix.mixNo)}
                    >
                      {S.SUBMIT_FINAL_MIX}
                    </Button>
                  </Stack>
                }
                onRemove={handleRemoveFinalMix}
                onFieldChange={updateFinalMixField}
                onQualityChange={updateFinalMixQualityCheck}
                onProcessChange={updateFinalMixProcessParticular}
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
        confirmDisabled={actionLoading}
        onClose={() => setFinalApprovalOpen(false)}
        onProceed={async () => {
          setFinalApprovalOpen(false);
          await onSubmitForFinalApproval?.();
        }}
      />
    </Box>
  );
};

export default MixingForm;

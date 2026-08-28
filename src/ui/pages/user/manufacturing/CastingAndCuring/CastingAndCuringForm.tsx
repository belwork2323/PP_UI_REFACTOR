import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import {
  CASTING_CURING_FLOW_LABELS,
  getCastingBowlSeedRowsFromBatch,
  mergeCastingCuringMotorsFromBatchAndForm,
  resolveCastingCuringBatchMotorCount,
  type CastingCuringBatchMotorSource,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import {
  createDefaultCuringProcessSetup,
  resolveCastingMotorProcessMeta,
  type CastingCuringFormState,
  type CastingCuringMotorSession,
  type CastingCuringMotorStatusMeta,
  type CastingCuringMotorSubmissionStatus,
  type CuringProcessSetup,
} from "../../../../../data/models/user/CastingCuringFormModel";
import { createEmptyCastingMotorData } from "../../../../../data/models/user/CastingMotorDataModel";
import { createEmptyCuringMotorData } from "../../../../../data/models/user/CuringMotorDataModel";
import type { CuringCycleConfig } from "../../../../../data/models/user/CuringCycleConfigModel";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../CasePreparation/components/FinalApprovalMotorDialog";
import CastingCuringFlowBar from "./CastingCuringFlowBar";
import CastingMotorPanel from "./CastingMotorPanel";
import CuringMotorPanel from "./CuringMotorPanel";
import CastingCuringSetupHeaderCard from "./CastingCuringSetupHeaderCard";
import CuringProcessFlowBar from "./CuringProcessFlowBar";
import CuringSetupHeaderCard from "./CuringSetupHeaderCard";
import { generalController } from "../../../../../controllers/admin/common/generalController";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

const S = STRINGS.MANUFACTURING.CASTING_CURING;
const { thermostat: ThermostatRoundedIcon } = icons.user.manufacturing.castingAndCuring.form;

type MotorProcessTab = "CASTING" | "CURING";

type CastingAndCuringFormProps = {
  batch?: CastingCuringBatchMotorSource | null;
  formData: CastingCuringFormState;
  castingMotorDraftsById: Record<string, { castingStation: string; motorReceivedAt: string }>;
  addedMotors: Array<{ motorId: string; motorReceivedAt: string; castingStation?: string }>;
  curingCycleConfig?: CuringCycleConfig | null;
  curingCyclesLoading?: boolean;
  onFetchCuringCycleConfig?: () => void | Promise<unknown>;
  onCastingMotorDraftChange: (
    motorId: string,
    field: "castingStation" | "motorReceivedAt",
    value: string,
  ) => void;
  onLoadCastingForm: (motorId: string) => void;
  onLoadCuringForm: (motorId: string) => void;
  getCuringSetupDraft: (motorId: string) => CuringProcessSetup;
  getCrossMotorExcludedBowlSelections?: (motorId: string) => string[];
  onCuringSetupDraftChange: (
    motorId: string,
    field: keyof CuringProcessSetup,
    value: string | number | "",
  ) => void;
  onMotorSessionChange: (motorId: string, next: CastingCuringMotorSession) => void;
  onRemoveMotor: (motorId: string) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  motorStatusById?: Record<string, CastingCuringMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => CastingCuringMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  theme: any;
};

const CastingAndCuringForm = ({
  batch,
  formData,
  castingMotorDraftsById,
  addedMotors,
  curingCycleConfig = null,
  curingCyclesLoading = false,
  onFetchCuringCycleConfig,
  onCastingMotorDraftChange,
  onLoadCastingForm,
  onLoadCuringForm,
  getCuringSetupDraft,
  getCrossMotorExcludedBowlSelections,
  onCuringSetupDraftChange,
  onMotorSessionChange,
  onRemoveMotor: _onRemoveMotor,
  onSaveMotorDraft,
  onSubmitMotor,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  theme,
}: CastingAndCuringFormProps) => {
  const BRAND = CASTING_CURING_BRAND;
  const motorCards = useMemo(() => {
    const formMotors = Array.isArray(addedMotors) ? addedMotors : [];
    return mergeCastingCuringMotorsFromBatchAndForm(batch, formMotors);
  }, [addedMotors, batch]);
  const resolveMotorStatus = useCallback(
    (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED",
    [getMotorStatus, motorStatusById],
  );
  const motorNavGate = useMemo(
    () =>
      buildMotorNavGateHelpers(motorCards, previousStageGate, resolveMotorStatus, {
        previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
        sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
      }),
    [motorCards, previousStageGate, resolveMotorStatus],
  );
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}`;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("CASTING");
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const [ovenOptions, setOvenOptions] = useState<
    Array<{ value: string; label: string; noOfOvenAvailable?: number }>
  >([]);
  const [ovensLoading, setOvensLoading] = useState(false);
  const batchMotorCount = useMemo(() => resolveCastingCuringBatchMotorCount(batch), [batch]);
  const bowlSeedRows = useMemo(() => getCastingBowlSeedRowsFromBatch(batch), [batch]);

  useEffect(() => {
    setActiveMotorIndex(0);
    prevMotorCountRef.current = 0;
  }, [formSessionKey]);

  useEffect(() => {
    let cancelled = false;

    const loadOvens = async () => {
      setOvensLoading(true);
      try {
        const response = await generalController.getOvens();
        if (cancelled) return;
        if (!response?.success || !Array.isArray(response.data)) {
          setOvenOptions([]);
          return;
        }
        setOvenOptions(
          response.data
            .map(
              (oven: {
                code?: string;
                name?: string;
                noOfOvenAvailable?: number;
                noOfOvenAdded?: number;
              }) => {
                const code = String(oven.code ?? oven.name ?? "").trim();
                const available = Number(oven.noOfOvenAvailable ?? oven.noOfOvenAdded ?? 0);
                return {
                  value: code,
                  label: String(oven.name ?? code).trim() || code,
                  noOfOvenAvailable:
                    Number.isFinite(available) && available > 0 ? available : undefined,
                };
              },
            )
            .filter((option) => option.value),
        );
      } catch {
        if (!cancelled) setOvenOptions([]);
      } finally {
        if (!cancelled) setOvensLoading(false);
      }
    };

    void loadOvens();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;
    const firstEnabled = motorCards.findIndex((_, index) => motorNavGate.isMotorTabEnabled(index));

    if (prevCount === 0) {
      setActiveMotorIndex(firstEnabled >= 0 ? firstEnabled : 0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => {
        const current = motorCards[prev];
        if (current && motorNavGate.isMotorWorkflowEnabled(current.motorId)) {
          return Math.min(prev, motorCards.length - 1);
        }
        return firstEnabled >= 0 ? firstEnabled : Math.min(prev, motorCards.length - 1);
      });
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards, motorNavGate]);

  const activeMotorEntry = motorCards[activeMotorIndex] ?? motorCards[0] ?? null;
  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (
      (formData.motors ?? []).find(
        (motor) => String(motor.motorId).trim() === String(activeMotorEntry.motorId).trim(),
      ) ?? null
    );
  }, [activeMotorEntry, formData.motors]);

  const curingFormLoaded = Boolean(activeMotorSession?.curingFormLoaded);
  const curingSetupDraft = activeMotorEntry ? getCuringSetupDraft(activeMotorEntry.motorId) : null;
  const activeDraft = activeMotorEntry
    ? (castingMotorDraftsById[activeMotorEntry.motorId] ?? {
        castingStation: "",
        motorReceivedAt: "",
      })
    : { castingStation: "", motorReceivedAt: "" };

  useEffect(() => {
    if (activeProcessTab !== "CURING") return;
    void onFetchCuringCycleConfig?.();
  }, [activeProcessTab, onFetchCuringCycleConfig, batch?.batchId, batch?.motorStage]);
  const showMotorNav = motorCards.length > 0;
  const showMotorWorkspace = Boolean(activeMotorEntry && activeMotorSession);

  const headerMotorId = activeMotorEntry?.motorId ?? "";
  const headerReceivedAt = activeMotorEntry?.motorReceivedAt ?? "";
  const activeMotorMeta = useMemo(() => {
    if (!activeMotorSession) {
      return {
        castingType: formData.castingType,
        castingStation: formData.castingStation,
      };
    }
    return resolveCastingMotorProcessMeta(activeMotorSession, formData);
  }, [activeMotorSession, formData]);
  const headerCastingStation = activeMotorMeta.castingStation;

  const navPalette = useMemo(
    () => ({
      primary: theme.palette.primary,
      primaryLight: theme.palette.primaryLight,
      border: theme.palette.border,
      surface: theme.palette.surface,
      textSub: theme.palette.textSub,
      text: theme.palette.text,
    }),
    [theme.palette],
  );

  const statusConfig = theme?.manufacturing?.castingAndCuring?.details?.bannerStatusConfig ?? {};
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as CastingCuringMotorSubmissionStatus;
  const activeMotorPriorEnabled = motorNavGate.isMotorWorkflowEnabled(activeMotorId);
  const activeMotorLocked = activeMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(activeMotorId) ?? true)
    : false;

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry, index) => {
        const status =
          getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED";
        return {
          id: entry.motorId,
          label: entry.motorId,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              variant="embedded"
              onAccent={index === activeMotorIndex}
            />
          ),
        };
      }),
    [activeMotorIndex, getMotorStatus, motorCards, motorStatusById, statusConfig],
  );

  const handleMotorNavIndexChange = (index: number) => {
    setActiveMotorIndex(index);
    setActiveProcessTab("CASTING");
  };

  const sectionToggleSx = {
    width: "100%",
    mb: 1.5,
    display: "flex",
    "& .MuiToggleButtonGroup-grouped": { flex: 1 },
    "& .MuiToggleButton-root": {
      flex: 1,
      px: 2.5,
      py: 0.9,
      fontWeight: 700,
      fontSize: "0.82rem",
      textTransform: "none" as const,
      borderColor: alpha(BRAND.cc, 0.35),
      "&.Mui-selected": {
        background: `linear-gradient(135deg, ${alpha(BRAND.cc, 0.14)}, ${alpha(BRAND.ccLight, 0.1)})`,
        color: BRAND.cc,
        borderColor: BRAND.cc,
      },
    },
  };

  const handleCuringSetupChange = (
    field: keyof CuringProcessSetup,
    value: string | number | "",
  ) => {
    if (!activeMotorEntry || curingFormLoaded) return;
    onCuringSetupDraftChange(activeMotorEntry.motorId, field, value);
  };

  const excludedBowlLabels = activeMotorSession
    ? (getCrossMotorExcludedBowlSelections?.(activeMotorSession.motorId) ?? [])
    : [];

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
            <ThermostatRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
              {S.FORM_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
              {batch?.projectName
                ? `${batch.projectName} · ${batch.batchId ?? ""}`
                : (batch?.batchId ?? S.FORM_SUBTITLE)}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {showMotorNav ? (
        <Stack spacing={1.25}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={S.MOTOR_NAV_TITLE}
              hint={S.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={handleMotorNavIndexChange}
              isTabDisabled={(_, index) => !motorNavGate.isMotorTabEnabled(index)}
              tabTooltip={(_, index) => motorNavGate.getMotorTabTooltip(index)}
              palette={navPalette}
              showStepArrows
              titleEndAdornment={
                <Chip
                  label={`${S.BATCH_MOTOR_COUNT_LABEL}: ${batchMotorCount}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 24,
                    background: BRAND.cc ?? "#1565C0",
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            {showMotorWorkspace && activeMotorEntry ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  {S.SAVE_MOTOR_DRAFT(activeMotorEntry.motorId)}
                </Button>
                <SubmitForApprovalButton
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                  label={S.SUBMIT_MOTOR(activeMotorEntry.motorId)}
                />
              </>
            ) : null}
            <ViewStatusButton
              disabled={actionLoading}
              onClick={() => setFinalApprovalOpen(true)}
              label={S.VIEW_STATUS}
            />
          </Stack>

          {!showMotorWorkspace && activeMotorEntry ? (
            <>
              {!activeMotorPriorEnabled ? (
                <Box
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.border}`,
                    bgcolor: theme.palette.background ?? BRAND.surface,
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}
                  >
                    {STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED}
                  </Typography>
                </Box>
              ) : null}
              <CastingCuringFlowBar
                motorId={activeMotorEntry.motorId}
                castingStation={activeDraft.castingStation}
                motorReceivedAt={activeDraft.motorReceivedAt}
                onCastingStationChange={(value) =>
                  onCastingMotorDraftChange(activeMotorEntry.motorId, "castingStation", value)
                }
                onMotorReceivedAtChange={(value) =>
                  onCastingMotorDraftChange(activeMotorEntry.motorId, "motorReceivedAt", value)
                }
                onLoadCastingForm={() => onLoadCastingForm(activeMotorEntry.motorId)}
                schemaLoading={false}
                disabled={!activeMotorPriorEnabled || activeMotorLocked}
                theme={theme}
              />
            </>
          ) : null}

          {showMotorWorkspace ? (
            <Box
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.border}`,
                background: theme.palette.surface,
                px: 1.5,
                py: 1.25,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                gap={1}
                mb={1}
              >
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}
                  >
                    {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                  </Typography>
                  <PremixStatusChip
                    status={activeMotorStatus}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                </Stack>
              </Stack>

              {activeMotorLocked ? (
                <Box
                  sx={{
                    mb: 1.25,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.border}`,
                    bgcolor: theme.palette.background ?? BRAND.surface,
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}
                  >
                    {!activeMotorPriorEnabled
                      ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                      : activeMotorStatus === "APPROVED"
                        ? S.MOTOR_LOCKED_APPROVED
                        : S.MOTOR_LOCKED_WAITING}
                  </Typography>
                </Box>
              ) : null}

              {activeMotorStatus === "REJECTED" &&
              motorStatusById[activeMotorId]?.rejectionReason ? (
                <Alert severity="error" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
                  {motorStatusById[activeMotorId]?.rejectionReason}
                </Alert>
              ) : null}

              <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub, mb: 1 }}>
                {S.FLOW_MOTOR_RECEIVED_AT}: {activeMotorEntry.motorReceivedAt || "—"}
              </Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={activeProcessTab}
                onChange={(_, value: MotorProcessTab | null) => {
                  if (!value) return;
                  setActiveProcessTab(value);
                }}
                sx={sectionToggleSx}
              >
                <ToggleButton value="CASTING">
                  {CASTING_CURING_FLOW_LABELS.sectionTabCasting}
                </ToggleButton>
                <ToggleButton value="CURING">
                  {CASTING_CURING_FLOW_LABELS.sectionTabCuring}
                </ToggleButton>
              </ToggleButtonGroup>

              {activeProcessTab === "CASTING" && activeMotorSession ? (
                <Box
                  sx={{
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.border}`,
                    background: theme.palette.surface,
                    px: 1.5,
                    py: 1.25,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: theme.palette.primary,
                      mb: 1,
                    }}
                  >
                    {S.CASTING_SECTION_TITLE} — {activeMotorEntry.motorId}
                  </Typography>
                  <CastingCuringSetupHeaderCard
                    castingStation={headerCastingStation}
                    motorId={headerMotorId}
                    motorReceivedAt={headerReceivedAt}
                    theme={theme}
                  />
                  <CastingMotorPanel
                    key={`casting-${activeMotorSession.motorId}`}
                    value={activeMotorSession.castingData ?? createEmptyCastingMotorData()}
                    onChange={(next) =>
                      onMotorSessionChange(String(activeMotorSession.motorId).trim(), {
                        ...activeMotorSession,
                        castingData: next,
                      })
                    }
                    motorId={activeMotorSession.motorId}
                    batchId={batch?.batchId}
                    bowlSeedRows={bowlSeedRows}
                    excludedBowlLabels={excludedBowlLabels}
                    disabled={activeMotorLocked}
                    theme={theme}
                  />
                </Box>
              ) : null}

              {activeProcessTab === "CURING" ? (
                <Stack spacing={1.25}>
                  <CuringProcessFlowBar
                    setup={curingSetupDraft ?? createDefaultCuringProcessSetup()}
                    curingFormLoaded={curingFormLoaded}
                    curingCycleConfig={curingCycleConfig}
                    batch={batch}
                    curingCyclesLoading={curingCyclesLoading}
                    ovenOptions={ovenOptions}
                    ovensLoading={ovensLoading}
                    onChange={handleCuringSetupChange}
                    onLoadCuringForm={() =>
                      activeMotorEntry && onLoadCuringForm(activeMotorEntry.motorId)
                    }
                    theme={theme}
                  />
                  {curingFormLoaded && activeMotorSession ? (
                    <CuringSetupHeaderCard
                      setup={activeMotorSession.curingSetup}
                      curingCycleConfig={curingCycleConfig}
                      batch={batch}
                      theme={theme}
                    />
                  ) : null}
                  {curingFormLoaded && activeMotorSession ? (
                    <Box
                      sx={{
                        borderRadius: 2.5,
                        border: `1px solid ${theme.palette.border}`,
                        background: theme.palette.surface,
                        px: 1.5,
                        py: 1.25,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          color: theme.palette.primary,
                          mb: 1,
                        }}
                      >
                        {S.CURING_SECTION_TITLE} — {activeMotorEntry.motorId}
                      </Typography>
                      <CuringMotorPanel
                        key={`curing-${activeMotorSession.motorId}`}
                        value={activeMotorSession.curingData ?? createEmptyCuringMotorData()}
                        onChange={(next) =>
                          onMotorSessionChange(String(activeMotorSession.motorId).trim(), {
                            ...activeMotorSession,
                            curingData: next,
                          })
                        }
                        motorId={activeMotorSession.motorId}
                        buildingNo={String(batch?.identificationSheet?.BldgNo ?? "")}
                        disabled={activeMotorLocked}
                        theme={theme}
                        showPropellantPressure={curingCycleConfig?.showPropellantPressure !== false}
                      />
                    </Box>
                  ) : null}
                </Stack>
              ) : null}
            </Box>
          ) : null}
        </Stack>
      ) : null}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        hideConfirm
        copy={{
          title: S.FINAL_APPROVAL_DIALOG_TITLE,
          info: S.FINAL_APPROVAL_DIALOG_INFO,
          proceed: S.FINAL_APPROVAL_PROCEED,
          close: S.FINAL_APPROVAL_CLOSE,
          notReady: S.FINAL_APPROVAL_NOT_READY,
          colMotor: S.FINAL_APPROVAL_COL_MOTOR,
          colType: S.FINAL_APPROVAL_COL_TYPE,
          colStatus: S.FINAL_APPROVAL_COL_STATUS,
        }}
        onClose={() => setFinalApprovalOpen(false)}
      />
    </Box>
  );
};

export default CastingAndCuringForm;

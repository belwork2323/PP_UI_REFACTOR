import React, { useEffect, useMemo, useRef, useState } from "react";
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
  canAddCastingCuringMotors,
  isCastingCuringFormStarted,
  resolveCastingCuringBatchMotorCount,
  resolveCastingCuringMotorCountLimit,
  resolveCastingCuringMotorOptions,
  resolveCastingFinalMixCount,
  type CastingCuringBatchMotorSource,
  type CastingMotorDraftEntry,
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
import type { CuringCycleConfig } from "../../../../../data/models/user/CuringCycleConfigModel";
import { buildCastingSetupContext, type SchemaFormValues } from "../../../../../schema-engine";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../CasePreparation/components/FinalApprovalMotorDialog";
import CastingCuringFlowBar from "./CastingCuringFlowBar";
import CastingCuringMotorSchemaPanel from "./CastingCuringMotorSchemaPanel";
import CastingCuringSetupHeaderCard from "./CastingCuringSetupHeaderCard";
import CuringProcessFlowBar from "./CuringProcessFlowBar";
import CuringSetupHeaderCard from "./CuringSetupHeaderCard";
import { generalController } from "../../../../../controllers/admin/common/generalController";
import {
  isMotorEnabledByPreviousStage,
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
  castingType: string;
  motorCount: number | "";
  castingMotorDrafts: CastingMotorDraftEntry[];
  addedMotors: Array<{ motorId: string; motorReceivedAt: string; castingStation?: string }>;
  schemaLoading?: boolean;
  schemaError?: string | null;
  castingSchemaError?: string | null;
  curingSchemaError?: string | null;
  curingCycleConfig?: CuringCycleConfig | null;
  curingCyclesLoading?: boolean;
  onFetchCuringCycleConfig?: () => void | Promise<unknown>;
  subDepartmentId?: number;
  onCastingTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onCastingMotorDraftChange: (
    index: number,
    field: keyof CastingMotorDraftEntry,
    value: string,
  ) => void;
  onLoadCastingForm: () => void;
  onAddMotors: () => void;
  onLoadCuringForm: (motorId: string) => void;
  getCuringSetupDraft: (motorId: string) => CuringProcessSetup;
  getMotorCastingFormValues: (motorId: string) => SchemaFormValues;
  getMotorCuringFormValues: (motorId: string) => SchemaFormValues;
  onCuringSetupDraftChange: (
    motorId: string,
    field: keyof CuringProcessSetup,
    value: string | number | "",
  ) => void;
  onMotorCuringValuesChange: (motorId: string, values: SchemaFormValues) => void;
  onMotorCastingValuesChange: (motorId: string, values: SchemaFormValues) => void;
  onMotorSessionChange: (motorId: string, next: CastingCuringMotorSession) => void;
  onRemoveMotor: (motorId: string) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
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
  castingType,
  motorCount,
  castingMotorDrafts,
  addedMotors,
  schemaLoading = false,
  schemaError = null,
  castingSchemaError = null,
  curingSchemaError = null,
  curingCycleConfig = null,
  curingCyclesLoading = false,
  onFetchCuringCycleConfig,
  subDepartmentId,
  onCastingTypeChange,
  onMotorCountChange,
  onCastingMotorDraftChange,
  onLoadCastingForm,
  onAddMotors,
  onLoadCuringForm,
  getCuringSetupDraft,
  getMotorCastingFormValues,
  getMotorCuringFormValues,
  onCuringSetupDraftChange,
  onMotorCastingValuesChange,
  onMotorCuringValuesChange,
  onMotorSessionChange,
  onRemoveMotor,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  theme,
}: CastingAndCuringFormProps) => {
  const BRAND = CASTING_CURING_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}:${formData.castingFormLoaded ? "loaded" : "draft"}`;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("CASTING");
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const [ovenOptions, setOvenOptions] = useState<
    Array<{ value: string; label: string; noOfOvenAvailable?: number }>
  >([]);
  const [ovensLoading, setOvensLoading] = useState(false);
  const castingFormLoaded = Boolean(formData.castingFormLoaded);
  const usedMotorIds = motorCards.map((motor) => motor.motorId);

  const batchMotorOptions = useMemo(() => {
    const options = resolveCastingCuringMotorOptions(batch);
    return options.filter((option) =>
      isMotorEnabledByPreviousStage(option.value, previousStageGate),
    );
  }, [batch, previousStageGate]);
  const batchMotorCount = useMemo(() => resolveCastingCuringBatchMotorCount(batch), [batch]);
  const maxMotorCount = useMemo(
    () =>
      resolveCastingCuringMotorCountLimit({
        batch,
        batchMotorOptions,
        usedMotorIds,
        castingFormLoaded,
      }),
    [batch, batchMotorOptions, usedMotorIds, castingFormLoaded],
  );
  const canAddMotors = canAddCastingCuringMotors({
    castingFormLoaded,
    castingType,
    motorCount,
    castingMotorDrafts,
    usedMotorIds,
    availableMotorOptions: batchMotorOptions,
    maxMotorCount,
  });

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
    const firstEnabled = motorCards.findIndex((entry) =>
      isMotorEnabledByPreviousStage(entry.motorId, previousStageGate),
    );

    if (prevCount === 0) {
      setActiveMotorIndex(firstEnabled >= 0 ? firstEnabled : 0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => {
        const current = motorCards[prev];
        if (current && isMotorEnabledByPreviousStage(current.motorId, previousStageGate)) {
          return Math.min(prev, motorCards.length - 1);
        }
        return firstEnabled >= 0 ? firstEnabled : Math.min(prev, motorCards.length - 1);
      });
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards, previousStageGate]);

  const activeMotorEntry = motorCards[activeMotorIndex] ?? motorCards[0] ?? null;
  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (
      (formData.motors ?? []).find(
        (motor) => String(motor.motorId).trim() === String(activeMotorEntry.motorId).trim(),
      ) ?? null
    );
  }, [activeMotorEntry, formData.motors]);

  const formStarted = isCastingCuringFormStarted(formData.motors);
  const curingFormLoaded = Boolean(activeMotorSession?.curingFormLoaded);
  const curingSetupDraft = activeMotorEntry ? getCuringSetupDraft(activeMotorEntry.motorId) : null;

  useEffect(() => {
    if (activeProcessTab !== "CURING") return;
    void onFetchCuringCycleConfig?.();
  }, [activeProcessTab, onFetchCuringCycleConfig, batch?.batchId, batch?.motorStage]);
  const batchProjectId = String(batch?.projectId ?? "").trim();
  const showMotorWorkspace = Boolean(
    castingFormLoaded && formStarted && activeMotorEntry && activeMotorSession,
  );

  const headerMotorId = activeMotorEntry?.motorId ?? "";
  const headerReceivedAt = activeMotorEntry?.motorReceivedAt ?? "";
  const activeMotorMeta = useMemo(() => {
    if (!activeMotorSession) {
      return {
        castingType: castingFormLoaded ? formData.castingType : castingType,
        castingStation: castingFormLoaded ? formData.castingStation : "",
      };
    }
    return resolveCastingMotorProcessMeta(activeMotorSession, formData);
  }, [activeMotorSession, castingFormLoaded, castingType, formData]);
  const headerCastingType = activeMotorMeta.castingType;
  const headerCastingStation = activeMotorMeta.castingStation;
  const castingSetupContext = useMemo(
    () =>
      buildCastingSetupContext({
        castingType: activeMotorMeta.castingType,
        castingStation: activeMotorMeta.castingStation,
        motorId: activeMotorEntry?.motorId ?? "",
        finalMixCount: resolveCastingFinalMixCount(batch),
      }),
    [activeMotorEntry?.motorId, activeMotorMeta, batch],
  );

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
  const activeMotorPriorEnabled = isMotorEnabledByPreviousStage(activeMotorId, previousStageGate);
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
  const canOpenFinalApproval = Boolean(batch?.formId);

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

        {motorCards.length > 0 ? (
          <Button
            variant="contained"
            size="small"
            disabled={actionLoading || !canOpenFinalApproval}
            onClick={() => setFinalApprovalOpen(true)}
          >
            {S.SUBMIT_FOR_FINAL_APPROVAL}
          </Button>
        ) : null}
      </Stack>

      <CastingCuringFlowBar
        batchMotorCount={batchMotorCount}
        castingType={castingType}
        motorCount={motorCount}
        castingMotorDrafts={castingMotorDrafts}
        availableMotorOptions={batchMotorOptions}
        usedMotorIds={usedMotorIds}
        maxMotorCount={maxMotorCount}
        castingFormLoaded={castingFormLoaded}
        onCastingTypeChange={onCastingTypeChange}
        onMotorCountChange={onMotorCountChange}
        onCastingMotorDraftChange={onCastingMotorDraftChange}
        onLoadCastingForm={onLoadCastingForm}
        onAddMotors={onAddMotors}
        canAddMotors={canAddMotors}
        schemaLoading={schemaLoading}
        theme={theme}
      />

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>
          {schemaError}
        </Typography>
      ) : null}

      {showMotorWorkspace ? (
        <Stack spacing={1.25}>
          {motorCards.length > 0 ? (
            <UserWorkflowNavPanel palette={navPalette}>
              <UserWorkflowTabNav
                title={S.MOTOR_NAV_TITLE}
                hint={S.MOTOR_NAV_HINT}
                tabs={motorTabs}
                activeIndex={activeMotorIndex}
                onActiveIndexChange={handleMotorNavIndexChange}
                isTabDisabled={(_, index) =>
                  !isMotorEnabledByPreviousStage(motorCards[index]?.motorId, previousStageGate)
                }
                tabTooltip={(_, index) =>
                  isMotorEnabledByPreviousStage(motorCards[index]?.motorId, previousStageGate)
                    ? undefined
                    : STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                }
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
          ) : null}

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

              <Stack direction="row" gap={1} flexShrink={0}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                >
                  {S.SAVE_MOTOR_DRAFT}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={actionLoading || activeMotorLocked}
                  onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                >
                  {S.SUBMIT_MOTOR}
                </Button>
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

            {activeMotorStatus === "REJECTED" && motorStatusById[activeMotorId]?.rejectionReason ? (
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

            {activeProcessTab === "CASTING" ? (
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
                  sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary, mb: 1 }}
                >
                  {S.CASTING_SECTION_TITLE} — {activeMotorEntry.motorId}
                </Typography>
                <CastingCuringSetupHeaderCard
                  castingType={headerCastingType}
                  castingStation={headerCastingStation}
                  motorId={headerMotorId}
                  motorReceivedAt={headerReceivedAt}
                  theme={theme}
                />
                <CastingCuringMotorSchemaPanel
                  key={`casting-${activeMotorSession.motorId}`}
                  schema={formData.castingSchema}
                  motor={activeMotorSession}
                  castingFormValues={getMotorCastingFormValues(activeMotorSession.motorId)}
                  subDepartmentId={subDepartmentId}
                  batchId={batch?.batchId}
                  setupContext={castingSetupContext}
                  onMotorChange={(nextMotor) =>
                    onMotorSessionChange(String(activeMotorSession.motorId).trim(), nextMotor)
                  }
                  onCastingFormValuesChange={(values) =>
                    onMotorCastingValuesChange(String(activeMotorSession.motorId).trim(), values)
                  }
                  loading={schemaLoading}
                  error={castingSchemaError}
                  readOnly={activeMotorLocked}
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
                  schemaLoading={schemaLoading}
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
                {curingFormLoaded && formData.curingSchema ? (
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
                    <CastingCuringMotorSchemaPanel
                      key={`curing-${activeMotorSession.motorId}`}
                      schema={formData.curingSchema}
                      motor={activeMotorSession}
                      curingFormValues={getMotorCuringFormValues(activeMotorSession.motorId)}
                      subDepartmentId={subDepartmentId}
                      batchId={batch?.batchId}
                      projectId={batchProjectId || undefined}
                      setupContext={castingSetupContext}
                      onMotorChange={(nextMotor) =>
                        onMotorSessionChange(String(activeMotorSession.motorId).trim(), nextMotor)
                      }
                      onCuringFormValuesChange={(values) =>
                        onMotorCuringValuesChange(String(activeMotorSession.motorId).trim(), values)
                      }
                      loading={schemaLoading}
                      error={curingSchemaError}
                      readOnly={activeMotorLocked}
                    />
                  </Box>
                ) : null}
              </Stack>
            ) : null}
          </Box>
        </Stack>
      ) : null}

      {!castingFormLoaded ? (
        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mt: 2 }}>
          Fill all casting process fields above, then load the casting form.
        </Typography>
      ) : null}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        confirmDisabled={actionLoading}
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
        onProceed={async () => {
          setFinalApprovalOpen(false);
          await onSubmitForFinalApproval?.();
        }}
      />
    </Box>
  );
};

export default CastingAndCuringForm;

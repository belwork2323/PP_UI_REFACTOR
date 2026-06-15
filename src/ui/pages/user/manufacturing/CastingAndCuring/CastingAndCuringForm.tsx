import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
  isCastingCuringFormStarted,
  isMotorCastingComplete,
  resolveCastingCuringMotorOptions,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import {
  createDefaultCuringProcessSetup,
  type CastingCuringFormState,
  type CastingCuringMotorSession,
  type CastingProcessSetup,
  type CuringProcessSetup,
} from "../../../../../data/models/user/CastingCuringFormModel";
import { buildCastingSetupContext } from "../../../../../schemaManagement/utils/schemaSetupContext";
import CastingCuringFlowBar from "./CastingCuringFlowBar";
import CastingCuringSchemaPanel from "./CastingCuringSchemaPanel";
import CastingCuringSetupHeaderCard from "./CastingCuringSetupHeaderCard";
import CuringProcessFlowBar from "./CuringProcessFlowBar";
import CuringSetupHeaderCard from "./CuringSetupHeaderCard";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";

const S = STRINGS.MANUFACTURING.CASTING_CURING;
const { thermostat: ThermostatRoundedIcon } = icons.user.manufacturing.castingAndCuring.form;

type MotorProcessTab = "CASTING" | "CURING";

type CastingAndCuringFormProps = {
  batch?: {
    batchId?: string;
    projectName?: string;
    motorId?: string;
    motorIds?: Array<string | number>;
    motorStage?: unknown;
    motorType?: unknown;
  } | null;
  formData: CastingCuringFormState;
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  castingSetupDraft: CastingProcessSetup;
  addedMotors: Array<{ motorId: string; motorReceivedAt: string }>;
  schemaLoading?: boolean;
  schemaError?: string | null;
  castingSchemaError?: string | null;
  curingSchemaError?: string | null;
  subDepartmentId?: number;
  onCastingTypeChange: (value: string) => void;
  onCastingStationChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onSetupDraftChange: (field: keyof CastingProcessSetup, value: string) => void;
  onLoadCastingForm: () => void;
  onRemoveLoadedCastingForm: () => void;
  onLoadCuringForm: (motorId: string) => void;
  getCuringSetupDraft: (motorId: string) => CuringProcessSetup;
  onCuringSetupDraftChange: (
    motorId: string,
    field: keyof CuringProcessSetup,
    value: string | number | "",
  ) => void;
  onMotorSessionChange: (motorId: string, next: CastingCuringMotorSession) => void;
  theme: any;
};

const CastingAndCuringForm = ({
  batch,
  formData,
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  castingSetupDraft,
  addedMotors,
  schemaLoading = false,
  schemaError = null,
  castingSchemaError = null,
  curingSchemaError = null,
  subDepartmentId,
  onCastingTypeChange,
  onCastingStationChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onSetupDraftChange,
  onLoadCastingForm,
  onRemoveLoadedCastingForm,
  onLoadCuringForm,
  getCuringSetupDraft,
  onCuringSetupDraftChange,
  onMotorSessionChange,
  theme,
}: CastingAndCuringFormProps) => {
  const BRAND = CASTING_CURING_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("CASTING");
  const [removeCastingConfirmOpen, setRemoveCastingConfirmOpen] = useState(false);
  const castingFormLoaded = Boolean(formData.castingFormLoaded);

  const availableMotorOptions = useMemo(() => resolveCastingCuringMotorOptions(batch), [batch]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      return;
    }
    setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
  }, [motorCards.length]);

  const activeMotorEntry = motorCards[activeMotorIndex] ?? motorCards[0] ?? null;
  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const formStarted = isCastingCuringFormStarted(formData.motors);
  const isActiveMotorCastingComplete = Boolean(
    activeMotorSession &&
      isMotorCastingComplete(formData.castingSchema, activeMotorSession.formValues ?? {}),
  );
  const isCuringUnlocked = isActiveMotorCastingComplete;
  const curingFormLoaded = Boolean(activeMotorSession?.curingFormLoaded);
  const curingSetupDraft = activeMotorEntry ? getCuringSetupDraft(activeMotorEntry.motorId) : null;
  const showMotorWorkspace = Boolean(
    castingFormLoaded && formStarted && activeMotorEntry && activeMotorSession,
  );

  const usedMotorIds = motorCards.map((motor) => motor.motorId);
  const headerMotorIds = motorCards.map((motor) => motor.motorId);
  const headerReceivedAt = activeMotorEntry?.motorReceivedAt ?? motorReceivedAt;
  const headerSetup = castingFormLoaded ? formData.castingSetup : castingSetupDraft;
  const headerCastingType = castingFormLoaded ? formData.castingType : castingType;
  const headerCastingStation = castingFormLoaded ? formData.castingStation : castingStation;
  const castingSetupContext = useMemo(
    () =>
      buildCastingSetupContext({
        finalMixCount: formData.castingSetup?.finalMixCount,
        castingType: formData.castingType,
        castingStation: formData.castingStation,
      }),
    [formData.castingSetup?.finalMixCount, formData.castingType, formData.castingStation],
  );

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
    if (!activeMotorEntry || !isCuringUnlocked || curingFormLoaded) return;
    onCuringSetupDraftChange(activeMotorEntry.motorId, field, value);
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
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
              : batch?.batchId ?? S.FORM_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      <CastingCuringFlowBar
        castingType={castingType}
        castingStation={castingStation}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        motorReceivedAt={motorReceivedAt}
        setup={castingSetupDraft}
        availableMotorOptions={availableMotorOptions}
        usedMotorIds={usedMotorIds}
        castingFormLoaded={castingFormLoaded}
        onCastingTypeChange={onCastingTypeChange}
        onCastingStationChange={onCastingStationChange}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onMotorReceivedAtChange={onMotorReceivedAtChange}
        onSetupChange={onSetupDraftChange}
        onLoadCastingForm={onLoadCastingForm}
        schemaLoading={schemaLoading}
        theme={theme}
      />

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {castingFormLoaded ? (
        <CastingCuringSetupHeaderCard
          castingType={headerCastingType}
          castingStation={headerCastingStation}
          motorIds={headerMotorIds}
          motorReceivedAt={headerReceivedAt}
          setup={headerSetup}
          onRemove={() => setRemoveCastingConfirmOpen(true)}
          theme={theme}
        />
      ) : null}

      {showMotorWorkspace ? (
        <Stack spacing={1.25}>
          {motorCards.length > 1 ? (
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
                {S.MOTOR_CARD_TITLE}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {motorCards.map((entry, idx) => (
                  <Button
                    key={`cc-motor-tab-${entry.motorId}`}
                    size="small"
                    variant={idx === activeMotorIndex ? "contained" : "outlined"}
                    onClick={() => setActiveMotorIndex(idx)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
                  >
                    {entry.motorId}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeProcessTab}
            onChange={(_, value: MotorProcessTab | null) => value && setActiveProcessTab(value)}
            sx={sectionToggleSx}
          >
            <ToggleButton value="CASTING">{CASTING_CURING_FLOW_LABELS.sectionTabCasting}</ToggleButton>
            <ToggleButton value="CURING">{CASTING_CURING_FLOW_LABELS.sectionTabCuring}</ToggleButton>
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
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary, mb: 1 }}>
                {S.CASTING_SECTION_TITLE} — {activeMotorEntry.motorId}
              </Typography>
              <CastingCuringSchemaPanel
                schema={formData.castingSchema}
                formValues={activeMotorSession.formValues}
                savedSections={activeMotorSession.savedSections}
                subDepartmentId={subDepartmentId}
                batchId={batch?.batchId}
                setupContext={castingSetupContext}
                onChange={(values) =>
                  onMotorSessionChange(activeMotorEntry.motorId, {
                    ...activeMotorSession,
                    formValues: values,
                  })
                }
                loading={schemaLoading}
                error={castingSchemaError}
              />
              {isActiveMotorCastingComplete ? (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
                  <Button variant="contained" size="small" onClick={() => setActiveProcessTab("CURING")}>
                    {CASTING_CURING_FLOW_LABELS.saveCastingContinue}
                  </Button>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {activeProcessTab === "CURING" ? (
            <Stack spacing={1.25}>
              {!isCuringUnlocked ? (
                <Alert severity="info" sx={{ fontSize: "0.78rem" }}>
                  {S.CURING_LOCKED_HINT.replace("{motorId}", activeMotorEntry.motorId)}
                </Alert>
              ) : null}
              {isCuringUnlocked ? (
                <CuringProcessFlowBar
                  setup={curingSetupDraft ?? createDefaultCuringProcessSetup()}
                  curingFormLoaded={curingFormLoaded}
                  onChange={handleCuringSetupChange}
                  onLoadCuringForm={() => activeMotorEntry && onLoadCuringForm(activeMotorEntry.motorId)}
                  schemaLoading={schemaLoading}
                  theme={theme}
                />
              ) : null}
              {curingFormLoaded && activeMotorSession ? (
                <CuringSetupHeaderCard setup={activeMotorSession.curingSetup} theme={theme} />
              ) : null}
              {isCuringUnlocked && curingFormLoaded && formData.curingSchema ? (
                <Box
                  sx={{
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.border}`,
                    background: theme.palette.surface,
                    px: 1.5,
                    py: 1.25,
                  }}
                >
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary, mb: 1 }}>
                    {S.CURING_SECTION_TITLE} — {activeMotorEntry.motorId}
                  </Typography>
                  <Alert severity="info" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
                    {CASTING_CURING_FLOW_LABELS.curingNextStepHint}
                  </Alert>
                  <CastingCuringSchemaPanel
                    schema={formData.curingSchema}
                    formValues={activeMotorSession.curingFormValues ?? formData.curingFormValues ?? {}}
                    savedSections={formData.curingSavedSections}
                    subDepartmentId={subDepartmentId}
                    batchId={batch?.batchId}
                    onChange={(values) =>
                      onMotorSessionChange(activeMotorEntry.motorId, {
                        ...activeMotorSession,
                        curingFormValues: values,
                      })
                    }
                    loading={schemaLoading}
                    error={curingSchemaError}
                  />
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {!castingFormLoaded ? (
        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mt: 2 }}>
          Fill all casting process fields above, then load the casting form.
        </Typography>
      ) : null}

      <ConfirmAlertDialog
        open={removeCastingConfirmOpen}
        severity="warning"
        title={S.CONFIRM_REMOVE_CASTING_CARD_TITLE}
        message={S.CONFIRM_REMOVE_CASTING_CARD_MESSAGE}
        confirmLabel={S.CONFIRM_REMOVE_CASTING_CARD_ACTION}
        cancelLabel={S.CONFIRM_REMOVE_CASTING_CARD_CANCEL}
        onConfirm={() => {
          setRemoveCastingConfirmOpen(false);
          onRemoveLoadedCastingForm();
        }}
        onCancel={() => setRemoveCastingConfirmOpen(false)}
      />
    </Box>
  );
};

export default CastingAndCuringForm;

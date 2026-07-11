import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { StaticTestFacilityFormState } from "../../../../../data/models/user/StaticTestFacilityFormModel";
import { normalizeStfMotorSession } from "../../../../../data/models/user/StaticTestFacilityFormModel";
import type { StfSubType } from "../../../../../schema-engine";
import type { StfAddedMotor, StfMotorOption } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import STFFlowBar from "./STFFlowBar";
import STFMotorNavigation from "./STFMotorNavigation";
import STFSchemaPanel from "./STFSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.qualityControl.staticTestFacility.form;

type StaticTestFacilityFormProps = {
  batch?: { batchId?: string } | null;
  formData: StaticTestFacilityFormState;
  subDepartmentId?: number;
  selectedMotorType: StfSubType | "";
  motorCount: number | "";
  draftMotorIds: string[];
  draftBemNo: string;
  addedMotors: StfAddedMotor[];
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
  approvedMotorsLoading?: boolean;
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onMotorTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onDraftBemNoChange: (value: string) => void;
  onLoadStfForm: () => void;
  onAddMotors: () => void;
  onRemoveMotor: (motorId: string) => void;
  onFormValuesChange: (motorId: string, values: import("../../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
};

const StaticTestFacilityForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedMotorType,
  motorCount,
  draftMotorIds,
  draftBemNo,
  addedMotors,
  availableMotorOptions,
  maxMotorCount,
  approvedMotorsLoading = false,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onMotorTypeChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onDraftBemNoChange,
  onLoadStfForm,
  onAddMotors,
  onRemoveMotor,
  onFormValuesChange,
  theme,
}: StaticTestFacilityFormProps) => {
  const BRAND = STATIC_TEST_FACILITY_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const hasMotors = motorCards.length > 0;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}`;

  const activeMotorTypes = useMemo(() => {
    const types = new Set(motorCards.map((motor) => motor.subType));
    return Array.from(types);
  }, [motorCards]);

  const motorTypeLabel =
    activeMotorTypes.length > 1
      ? "Main Motor + BEM"
      : activeMotorTypes[0] === "MAIN_MOTOR"
        ? "Main Motor"
        : activeMotorTypes[0] === "BEM"
          ? "BEM"
          : selectedMotorType === "MAIN_MOTOR"
            ? "Main Motor"
            : selectedMotorType === "BEM"
              ? "BEM"
              : "";

  useEffect(() => {
    setActiveMotorIndex(0);
    prevMotorCountRef.current = 0;
  }, [formSessionKey]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;

    if (prevCount === 0) {
      setActiveMotorIndex(0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards.length]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    const found = (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId);
    return found ? normalizeStfMotorSession(found) : null;
  }, [activeMotorEntry, formData.motors]);

  const activeMotorSchema = useMemo(() => {
    if (!activeMotorSession) return null;
    return formData.schemasBySubType?.[activeMotorSession.subType] ?? formData.stfSchema ?? null;
  }, [activeMotorSession, formData.schemasBySubType, formData.stfSchema]);

  const navTabs = motorCards.map((motor) => ({ id: motor.motorId, label: motor.motorId }));

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(192,57,43,0.05)",
            border: "1.5px solid rgba(192,57,43,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, #fff 100%)`,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.primary}40`,
              }}
            >
              <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          {motorTypeLabel ? (
            <Chip
              label={motorTypeLabel}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                alignSelf: { xs: "flex-start", sm: "center" },
                background: "rgba(27,79,114,0.1)",
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <STFFlowBar
        key={`${motorCards.map((motor) => motor.motorId).join("|")}-${selectedMotorType}`}
        selectedMotorType={selectedMotorType}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        draftBemNo={draftBemNo}
        addedMotors={addedMotors}
        availableMotorOptions={availableMotorOptions}
        maxMotorCount={maxMotorCount}
        approvedMotorsLoading={approvedMotorsLoading}
        schemaLoading={schemaLoading}
        onMotorTypeChange={onMotorTypeChange}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onDraftBemNoChange={onDraftBemNoChange}
        onLoadForm={onLoadStfForm}
        onAddMotors={onAddMotors}
        theme={flowBarTheme}
      />

      {schemaLoading && !hasMotors ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {hasMotors && activeMotorSession && activeMotorSchema ? (
        <STFMotorNavigation
          tabs={navTabs}
          activeIndex={activeMotorIndex}
          onActiveIndexChange={setActiveMotorIndex}
          motorType={activeMotorSession.subType}
          theme={theme}
        >
          <Box sx={{ position: "relative" }}>
            {motorCards.length > 1 ? (
              <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
                <RemoveProcessButton
                  onClick={() => onRemoveMotor(activeMotorSession.motorId)}
                  dangerColor={BRAND.danger}
                  tooltip={
                    activeMotorSession.subType === "BEM" ? "Remove BEM motor" : "Remove motor"
                  }
                />
              </Box>
            ) : null}

            <STFSchemaPanel
              schema={activeMotorSchema}
              formValues={activeMotorSession.schemaFormValues}
              savedSections={activeMotorSession.savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onChange={(values) => onFormValuesChange(activeMotorSession.motorId, values)}
              loading={schemaLoading}
              error={schemaError}
            />
          </Box>
        </STFMotorNavigation>
      ) : null}
    </Box>
  );
};

export default StaticTestFacilityForm;

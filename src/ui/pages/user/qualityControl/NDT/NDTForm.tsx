import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography, alpha } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import {
  canAddNDTMotors,
  canLoadNDTForm,
  NDT_FLOW_LABELS,
  type NDTAddedMotor,
  type NDTMotorOption,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import type { NDTFormState, NDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import { normalizeNDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import type { NDTBatch } from "../../../../../hooks/user/qualityControl/useNDTHook";
import NDTFlowBar from "./NDTFlowBar";
import NDTMotorNavigation from "./NDTMotorNavigation";
import NDTMotorTables from "./NDTMotorTables";

const { warning: WarningAmberRoundedIcon, biotech: BiotechRoundedIcon } = icons.user.qualityControl.ndt.form;

type Props = {
  activeBatch?: NDTBatch | null;
  formData: NDTFormState;
  addedMotors: NDTAddedMotor[];
  motorCount: number | "";
  draftMotorIds: string[];
  availableMotorOptions: NDTMotorOption[];
  maxMotorCount: number;
  isEditMode?: boolean;
  theme: ReturnType<typeof getQualityControlTheme>;
  onSetupChange: (patch: Partial<NDTFormState>) => void;
  onMotorSessionChange: (motorId: string, patch: Partial<NDTMotorSession>) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onLoadNDTForm: () => void;
  onAddMotors: () => void;
  onRemoveMotor: (motorId: string) => void;
};

const NDTForm = ({
  activeBatch = null,
  formData,
  addedMotors,
  motorCount,
  draftMotorIds,
  availableMotorOptions,
  maxMotorCount,
  isEditMode = false,
  theme,
  onSetupChange,
  onMotorSessionChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onLoadNDTForm,
  onAddMotors,
  onRemoveMotor,
}: Props) => {
  const strings = STRINGS.QUALITY_CONTROL.NDT;
  const ndtTheme = theme.qualityControl.ndt;
  const brand = ndtTheme.brand;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${activeBatch?.batchId ?? ""}:${activeBatch?.formId ?? "new"}`;

  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const usedMotorIds = motorCards.map((motor) => motor.motorId);
  const safeBeamEnergies = Array.isArray(formData.beamEnergies) ? formData.beamEnergies : [];

  const canLoad = canLoadNDTForm({
    equipment: formData.equipment ?? "",
    beamEnergies: safeBeamEnergies,
    radiographyPlan: formData.radiographyPlan,
    motorCount,
    draftMotorIds,
    usedMotorIds,
    ndtFormLoaded: formData.formLoaded,
    availableMotorOptions,
    maxMotorCount,
  });

  const canAdd = canAddNDTMotors({
    equipment: formData.equipment ?? "",
    beamEnergies: safeBeamEnergies,
    radiographyPlan: formData.radiographyPlan,
    motorCount,
    draftMotorIds,
    usedMotorIds,
    ndtFormLoaded: formData.formLoaded,
    availableMotorOptions,
    maxMotorCount,
  });

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
    return found ? normalizeNDTMotorSession(found) : null;
  }, [activeMotorEntry, formData.motors]);

  const navTabs = motorCards.map((motor) => ({ id: motor.motorId, label: motor.motorId }));

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2,
            px: 1.75,
            py: 1.1,
            borderRadius: 2,
            background: alpha(brand.danger, 0.05),
            border: `1.5px solid ${alpha(brand.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: brand.danger }} />
          <Typography sx={{ fontSize: "0.8rem", color: brand.danger, fontWeight: 600 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box sx={ndtTheme.panel.header}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box sx={ndtTheme.panel.headerIcon}>
              <BiotechRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={ndtTheme.panel.headerTitle}>{strings.TITLE}</Typography>
              <Typography sx={ndtTheme.panel.headerSubtitle}>
                {strings.SUBTITLE}
                {activeBatch?.batchId ? ` · ${activeBatch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>

      <NDTFlowBar
        equipment={formData.equipment ?? ""}
        beamEnergies={safeBeamEnergies}
        radiographyPlan={formData.radiographyPlan ?? ""}
        motorCount={motorCount}
        draftMotorIds={draftMotorIds}
        availableMotorOptions={availableMotorOptions}
        usedMotorIds={usedMotorIds}
        ndtFormLoaded={formData.formLoaded}
        maxMotorCount={maxMotorCount}
        onEquipmentChange={(equipment) => onSetupChange({ equipment })}
        onBeamEnergiesChange={(beamEnergies) => onSetupChange({ beamEnergies })}
        onRadiographyPlanChange={(radiographyPlan) => onSetupChange({ radiographyPlan })}
        onMotorCountChange={onMotorCountChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onLoadNDTForm={onLoadNDTForm}
        onAddMotors={onAddMotors}
        canLoad={canLoad}
        canAdd={canAdd}
        theme={theme}
      />

      {formData.formLoaded && activeMotorEntry && activeMotorSession ? (
        <NDTMotorNavigation
          tabs={navTabs}
          activeIndex={activeMotorIndex}
          onActiveIndexChange={setActiveMotorIndex}
          theme={theme}
        >
          <Box sx={ndtTheme.panel.motorCard}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: brand.primary }}>
                {NDT_FLOW_LABELS.motorCardTitle} — {activeMotorEntry.motorId}
              </Typography>
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={brand.danger}
                tooltip={strings.DELETE_MOTOR_TOOLTIP}
              />
            </Stack>
            <NDTMotorTables
              motor={activeMotorSession}
              theme={theme}
              onChange={(patch) => onMotorSessionChange(activeMotorEntry.motorId, patch)}
            />
          </Box>
        </NDTMotorNavigation>
      ) : null}
    </Box>
  );
};

export default NDTForm;

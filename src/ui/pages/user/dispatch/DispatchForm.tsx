import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";
import type { DispatchFormState } from "../../../../data/models/user/DispatchFormModel";
import type { DispatchAddedMotor, DispatchMotorOption } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import { DISPATCH_FLOW_LABELS } from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import RemoveProcessButton from "../../../components/common/RemoveProcessButton";
import DispatchFlowBar from "./DispatchFlowBar";
import DispatchMotorNavigation from "./DispatchMotorNavigation";
import DispatchMotorDetailsCard from "./DispatchMotorDetailsCard";

const S = STRINGS.DISPATCH;
const { localShipping: LocalShippingRoundedIcon } = icons.user.dispatch.form;

type DispatchFormProps = {
  batch?: {
    batchId?: string;
    projectId?: string;
    projectName?: string;
  } | null;
  formData: DispatchFormState;
  draftMotorId: string;
  addedMotors: DispatchAddedMotor[];
  subDepartmentId?: number;
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  availableMotors?: DispatchMotorOption[];
  onSetupChange: <K extends keyof DispatchFormState>(
    field: K,
    value: DispatchFormState[K],
  ) => void;
  onDraftMotorIdChange: (value: string) => void;
  onLoadDispatchForm: () => void;
  onAddDispatchMotor: () => void;
  onRemoveMotor: (motorId: string) => void;
  onFormValuesChange: (motorId: string, values: import("../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
};

const DispatchForm = ({
  batch,
  formData,
  draftMotorId,
  addedMotors,
  subDepartmentId,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  availableMotors = [],
  onSetupChange,
  onDraftMotorIdChange,
  onLoadDispatchForm,
  onAddDispatchMotor,
  onRemoveMotor,
  onFormValuesChange,
  theme,
}: DispatchFormProps) => {
  const dispatchTheme = getDispatchTheme(theme);
  const panel = dispatchTheme.panel;
  const brand = dispatchTheme.brand;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const hasMotors = motorCards.length > 0;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${batch?.batchId ?? ""}`;

  const stageLabel = useMemo(() => {
    const activeMotor = (formData.motors ?? []).find(
      (motor) => motor.motorId === motorCards[activeMotorIndex]?.motorId,
    );
    const stage = activeMotor?.setup?.motorStage || formData.motorStage;
    if (!stage) return "";
    return stage.toLowerCase().startsWith("stage") ? stage : `Stage ${stage}`;
  }, [activeMotorIndex, formData.motorStage, formData.motors, motorCards]);

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

  const activeMotor = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

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
          <Typography sx={{ fontSize: "0.8rem", color: brand.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box sx={panel.header}>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box sx={panel.headerIcon}>
              <LocalShippingRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={panel.headerTitle}>{S.TITLE}</Typography>
              <Typography sx={panel.headerSubtitle}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          {stageLabel ? (
            <Chip
              label={stageLabel}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                alignSelf: { xs: "flex-start", sm: "center" },
                background: "rgba(27,79,114,0.1)",
                color: brand.primary,
                border: `1px solid ${brand.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <DispatchFlowBar
        key={`${motorCards.map((motor) => motor.motorId).join("|")}`}
        batchId={batch?.batchId}
        formData={formData}
        draftMotorId={draftMotorId}
        addedMotors={motorCards}
        availableMotors={availableMotors}
        schemaLoading={schemaLoading}
        onSetupChange={onSetupChange}
        onDraftMotorIdChange={onDraftMotorIdChange}
        onLoadForm={onLoadDispatchForm}
        onAddMotor={onAddDispatchMotor}
        theme={flowBarTheme}
        dispatchTheme={dispatchTheme}
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

      {hasMotors && activeMotorEntry && activeMotor && formData.dispatchSchema ? (
        <DispatchMotorNavigation
          tabs={navTabs}
          activeIndex={activeMotorIndex}
          onActiveIndexChange={setActiveMotorIndex}
          theme={theme}
        >
          <Box sx={panel.motorCard}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: brand.primary }}>
                {DISPATCH_FLOW_LABELS.motorCardTitle} — {activeMotorEntry.motorId}
              </Typography>
              <RemoveProcessButton
                onClick={() => onRemoveMotor(activeMotorEntry.motorId)}
                dangerColor={brand.danger}
                tooltip={S.DELETE_MOTOR_TOOLTIP}
              />
            </Stack>

            <DispatchMotorDetailsCard
              motor={activeMotor}
              schema={formData.dispatchSchema}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              schemaLoading={schemaLoading}
              schemaError={schemaError}
              theme={theme}
              onFormValuesChange={(values) => onFormValuesChange(activeMotor.motorId, values)}
            />
          </Box>
        </DispatchMotorNavigation>
      ) : null}
    </Box>
  );
};

export default DispatchForm;

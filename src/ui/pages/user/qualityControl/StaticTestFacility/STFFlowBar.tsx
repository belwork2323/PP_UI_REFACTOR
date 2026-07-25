import { Box, Button, CircularProgress, Typography } from "@mui/material";
import {
  STF_FLOW_LABELS,
  STF_MOTOR_TYPE_OPTIONS,
  canAddStfBemMotor,
  canAddStfMainMotors,
  canLoadStfBemForm,
  canLoadStfMainMotorForm,
  getStfMotorCountOptions,
  hasStfMotorsOfSubType,
  type StfAddedMotor,
  type StfMotorOption,
} from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import type { StfSubType } from "../../../../../schema-engine";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepTextField from "../../manufacturing/CasePreparation/CasePrepTextField";

type STFFlowBarProps = {
  selectedMotorType: StfSubType | "";
  motorCount: number | "";
  draftMotorIds: string[];
  draftBemNo: string;
  addedMotors: StfAddedMotor[];
  availableMotorOptions: StfMotorOption[];
  maxMotorCount: number;
  approvedMotorsLoading?: boolean;
  schemaLoading?: boolean;
  onMotorTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onDraftBemNoChange: (value: string) => void;
  onLoadForm: () => void;
  onAddMotors: () => void;
  theme: any;
};

const STFFlowBar = ({
  selectedMotorType,
  motorCount,
  draftMotorIds,
  draftBemNo,
  addedMotors,
  availableMotorOptions,
  maxMotorCount,
  approvedMotorsLoading = false,
  schemaLoading = false,
  onMotorTypeChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onDraftBemNoChange,
  onLoadForm,
  onAddMotors,
  theme,
}: STFFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = STF_FLOW_LABELS;
  const isMainMotor = selectedMotorType === "MAIN_MOTOR";
  const isBem = selectedMotorType === "BEM";
  const usedMotorIds = addedMotors.map((motor) => motor.motorId);
  const usedMainMotorIds = addedMotors
    .filter((motor) => motor.subType === "MAIN_MOTOR")
    .map((motor) => motor.motorId);
  const hasMainMotors = hasStfMotorsOfSubType(addedMotors, "MAIN_MOTOR");
  const hasBemMotors = hasStfMotorsOfSubType(addedMotors, "BEM");

  const count = motorCount === "" ? 0 : Number(motorCount);
  const countSelected = count > 0;
  const motorSlotCount = countSelected ? count : 1;
  const motorCountOptions = getStfMotorCountOptions(maxMotorCount);

  const canLoadMain = canLoadStfMainMotorForm({
    motorCount,
    draftMotorIds,
    usedMotorIds,
    hasMainMotors,
    availableMotorOptions,
    maxMotorCount,
  });

  const canAddMain = canAddStfMainMotors({
    motorCount,
    draftMotorIds,
    usedMotorIds,
    usedMainMotorIds,
    hasMainMotors,
    availableMotorOptions,
    maxMotorCount,
  });

  const canLoadBem = canLoadStfBemForm(draftBemNo, usedMotorIds, hasBemMotors);
  const canAddBem = canAddStfBemMotor(draftBemNo, usedMotorIds, hasBemMotors);

  const canLoad = isMainMotor ? canLoadMain : isBem ? canLoadBem : false;
  const canAdd = isMainMotor ? canAddMain : isBem ? canAddBem : false;
  const showLoad = canLoad;
  const showAdd = !canLoad && canAdd;

  const setupHint = isMainMotor
    ? hasMainMotors
      ? L.setupHintMainMotorLoaded
      : L.setupHintMainMotor
    : isBem
      ? hasBemMotors
        ? L.setupHintBemLoaded
        : L.setupHintBem
      : addedMotors.length === 0
        ? L.setupHint
        : "";

  const getMotorOptionsForSlot = (slotIndex: number) => {
    const currentValue = draftMotorIds[slotIndex] ?? "";
    return availableMotorOptions.map((option) => ({
      ...option,
      disabled: option.value !== currentValue && usedMotorIds.includes(option.value),
    }));
  };

  return (
    <Box sx={flowBar.container}>
      {setupHint ? (
        <Typography sx={{ fontSize: "0.78rem", color: "#5D6D7E", mb: 1.5 }}>{setupHint}</Typography>
      ) : null}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <CasePrepSelect
            label={L.motorType}
            value={selectedMotorType}
            placeholder={L.motorTypePlaceholder}
            options={STF_MOTOR_TYPE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            width={220}
            theme={theme}
            onChange={onMotorTypeChange}
          />

          {isMainMotor ? (
            <>
              <CasePrepSelect
                label={L.motorCount}
                value={countSelected ? String(motorCount) : ""}
                placeholder={L.motorCountPlaceholder}
                options={motorCountOptions}
                width={180}
                theme={theme}
                disabled={motorCountOptions.length === 0}
                onChange={(v) => onMotorCountChange(v === "" ? "" : Number(v))}
              />

              {Array.from({ length: motorSlotCount }, (_, idx) => (
                <CasePrepSelect
                  key={`stf-motor-slot-${idx}`}
                  label={`${L.motorId} ${motorSlotCount > 1 ? idx + 1 : ""}`.trim()}
                  value={draftMotorIds[idx] ?? ""}
                  placeholder={L.motorIdPlaceholder}
                  options={getMotorOptionsForSlot(idx)}
                  width={260}
                  theme={theme}
                  disabled={availableMotorOptions.length === 0 || approvedMotorsLoading}
                  onChange={(v) => onDraftMotorIdChange(idx, v)}
                />
              ))}

              {approvedMotorsLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pb: 0.5 }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: "0.74rem", color: "#5D6D7E" }}>
                    {L.approvedMotorsLoading}
                  </Typography>
                </Box>
              ) : null}
            </>
          ) : null}

          {isBem ? (
            <CasePrepTextField
              label={L.bemNo}
              value={draftBemNo}
              placeholder={L.bemNoPlaceholder}
              theme={theme}
              onChange={onDraftBemNoChange}
            />
          ) : null}
        </Box>

        {selectedMotorType ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            {showLoad ? (
              <Button
                variant="contained"
                size="small"
                disabled={schemaLoading}
                onClick={onLoadForm}
                startIcon={
                  schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined
                }
              >
                {schemaLoading ? L.loadingSchema : L.loadForm}
              </Button>
            ) : null}
            {showAdd ? (
              <Button
                variant="contained"
                size="small"
                disabled={schemaLoading}
                onClick={onAddMotors}
                startIcon={
                  schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined
                }
              >
                {isBem ? L.addBem : L.addMotors}
              </Button>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default STFFlowBar;

import { Box, Button, Typography } from "@mui/material";
import {
  NDT_BEAM_ENERGY_OPTIONS,
  NDT_EQUIPMENT_OPTIONS,
  NDT_FLOW_LABELS,
  NDT_RADIOGRAPHY_PLANS,
  getNDTMotorCountOptions,
  type NDTMotorOption,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import CasePrepMultiSelect from "../../manufacturing/CasePreparation/CasePrepMultiSelect";

type NDTFlowBarTheme = ReturnType<typeof getQualityControlTheme> & {
  manufacturing?: ReturnType<typeof getManufacturingTheme>["manufacturing"];
};

type NDTFlowBarProps = {
  equipment: string;
  beamEnergies: string[];
  radiographyPlan: string;
  motorCount: number | "";
  draftMotorIds: string[];
  availableMotorOptions: NDTMotorOption[];
  usedMotorIds: string[];
  ndtFormLoaded: boolean;
  maxMotorCount: number;
  onEquipmentChange: (value: string) => void;
  onBeamEnergiesChange: (values: string[]) => void;
  onRadiographyPlanChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onLoadNDTForm: () => void;
  onAddMotors: () => void;
  canLoad: boolean;
  canAdd: boolean;
  theme: NDTFlowBarTheme;
};

const L = NDT_FLOW_LABELS;

const NDTFlowBar = ({
  equipment,
  beamEnergies,
  radiographyPlan,
  motorCount,
  draftMotorIds,
  availableMotorOptions,
  usedMotorIds,
  ndtFormLoaded,
  maxMotorCount,
  onEquipmentChange,
  onBeamEnergiesChange,
  onRadiographyPlanChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onLoadNDTForm,
  onAddMotors,
  canLoad,
  canAdd,
  theme,
}: NDTFlowBarProps) => {
  const ndtTheme = theme.qualityControl.ndt;
  const flowBar = ndtTheme.flowBar;
  const casePrepFlowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const safeBeamEnergies = Array.isArray(beamEnergies) ? beamEnergies : [];
  const count = motorCount === "" ? 0 : Number(motorCount);
  const countSelected = count > 0;
  const motorSlotCount = countSelected ? count : 1;
  const motorCountOptions = getNDTMotorCountOptions(maxMotorCount);
  const selectTheme = { ...theme, manufacturing: theme.manufacturing ?? { casePreparation: { flowBar: casePrepFlowBar } } };

  const equipmentOptions = NDT_EQUIPMENT_OPTIONS.map((option) => ({ value: option, label: option }));
  const planOptions = Object.entries(NDT_RADIOGRAPHY_PLANS).map(([key, plan]) => ({
    value: key,
    label: plan.label,
  }));
  const beamOptions = NDT_BEAM_ENERGY_OPTIONS.map((option) => ({ value: option, label: option }));

  const getMotorOptionsForSlot = (slotIndex: number) => {
    const currentValue = draftMotorIds[slotIndex] ?? "";
    return availableMotorOptions.map((option) => ({
      ...option,
      disabled: option.value !== currentValue && usedMotorIds.includes(option.value),
    }));
  };

  return (
    <Box sx={flowBar.container}>
      <Typography sx={flowBar.setupHint}>{ndtFormLoaded ? L.setupHintLoaded : L.setupHint}</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.equipment}
            value={equipment}
            placeholder={L.equipmentPlaceholder}
            options={equipmentOptions}
            width={260}
            theme={selectTheme}
            onChange={onEquipmentChange}
          />

          <CasePrepMultiSelect
            label={L.beamEnergies}
            value={safeBeamEnergies}
            placeholder={L.beamEnergiesPlaceholder}
            options={beamOptions}
            width={280}
            theme={selectTheme}
            onChange={onBeamEnergiesChange}
          />

          <CasePrepSelect
            label={L.radiographyPlan}
            value={radiographyPlan}
            placeholder={L.radiographyPlanPlaceholder}
            options={planOptions}
            width={280}
            theme={selectTheme}
            onChange={onRadiographyPlanChange}
          />
        </Box>

        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.motorCount}
            value={countSelected ? String(motorCount) : ""}
            placeholder={L.motorCountPlaceholder}
            options={motorCountOptions}
            width={180}
            theme={selectTheme}
            disabled={motorCountOptions.length === 0}
            onChange={(v) => onMotorCountChange(v === "" ? "" : Number(v))}
          />

          {Array.from({ length: motorSlotCount }, (_, idx) => (
            <CasePrepSelect
              key={`ndt-motor-slot-${idx}`}
              label={`${L.motorId} ${motorSlotCount > 1 ? idx + 1 : ""}`.trim()}
              value={draftMotorIds[idx] ?? ""}
              placeholder={L.motorIdPlaceholder}
              options={getMotorOptionsForSlot(idx)}
              width={260}
              theme={selectTheme}
              disabled={availableMotorOptions.length === 0}
              onChange={(v) => onDraftMotorIdChange(idx, v)}
            />
          ))}

          <Box sx={{ ...flowBar.actionRow, ml: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
            {!ndtFormLoaded ? (
              <Button
                variant="contained"
                size="medium"
                onClick={onLoadNDTForm}
                disabled={!canLoad}
                sx={flowBar.primaryAction}
              >
                {L.loadForm}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="medium"
                onClick={onAddMotors}
                disabled={!canAdd}
                sx={flowBar.primaryAction}
              >
                {L.addMotors}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NDTFlowBar;

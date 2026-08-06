import { Box, Button, Typography } from "@mui/material";
import {
  NDT_BEAM_ENERGY_OPTIONS,
  NDT_EQUIPMENT_OPTIONS,
  NDT_FLOW_LABELS,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import MultiSelect from "@/ui/components/common/MultiSelectCheckbox";

type NDTFlowBarTheme = ReturnType<typeof getQualityControlTheme> & {
  manufacturing?: ReturnType<typeof getManufacturingTheme>["manufacturing"];
};

export type NDTEquipmentOption = string | { value: string; label: string };
export type NDTBeamEnergyOption = string | { value: string; label: string };

type NDTFlowBarProps = {
  equipment: string[];
  beamEnergies: string[];
  radiographyPlan: string;
  ndtFormLoaded: boolean;
  equipmentOptions?: NDTEquipmentOption[];
  equipmentLoading?: boolean;
  beamEnergyOptions?: NDTBeamEnergyOption[];
  beamEnergyLoading?: boolean;
  onEquipmentChange: (equipment: string[]) => void;
  onBeamEnergiesChange: (values: string[]) => void;
  onRadiographyPlanChange: (value: string) => void;
  onLoadNDTForm: () => void;
  canLoad: boolean;
  theme: NDTFlowBarTheme;
};

const L = NDT_FLOW_LABELS;

const NDTFlowBar = ({
  equipment,
  beamEnergies,
  radiographyPlan: _radiographyPlan,
  ndtFormLoaded,
  equipmentOptions,
  equipmentLoading = false,
  beamEnergyOptions,
  beamEnergyLoading = false,
  onEquipmentChange,
  onBeamEnergiesChange,
  onRadiographyPlanChange: _onRadiographyPlanChange,
  onLoadNDTForm,
  canLoad,
  theme,
}: NDTFlowBarProps) => {
  const ndtTheme = theme.qualityControl.ndt;
  const flowBar = ndtTheme.flowBar;
  const safeBeamEnergies = Array.isArray(beamEnergies) ? beamEnergies : [];
  const selectedEquipment = Array.isArray(equipment) ? equipment : [];
  const lookupsLoading = equipmentLoading || beamEnergyLoading;

  const resolvedEquipmentOptions =
    equipmentOptions && equipmentOptions.length > 0
      ? equipmentOptions
      : [...NDT_EQUIPMENT_OPTIONS];

  const resolvedBeamEnergyOptions =
    beamEnergyOptions && beamEnergyOptions.length > 0
      ? beamEnergyOptions
      : NDT_BEAM_ENERGY_OPTIONS.map((option) => ({ value: option, label: option }));

  return (
    <Box sx={flowBar.container}>
      <Typography sx={flowBar.setupHint}>
        {ndtFormLoaded ? L.setupHintLoaded : L.setupHint}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
        <Box sx={flowBar.topRow}>
          <MultiSelect
            label={L.equipment}
            placeholder={equipmentLoading ? "Loading equipment..." : L.equipmentPlaceholder}
            options={resolvedEquipmentOptions}
            value={selectedEquipment}
            onChange={(selected) => onEquipmentChange(selected)}
            showCheckbox
            disabled={equipmentLoading}
            sx={{ width: 260 }}
          />
          <MultiSelect
            label={L.beamEnergies}
            placeholder={beamEnergyLoading ? "Loading beam energies..." : L.beamEnergiesPlaceholder}
            options={[...resolvedBeamEnergyOptions]}
            value={safeBeamEnergies}
            onChange={(selected) => onBeamEnergiesChange(selected)}
            showCheckbox
            disabled={beamEnergyLoading}
            sx={{ width: 260 }}
          />

          <Box sx={{ ...flowBar.actionRow, ml: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              size="medium"
              onClick={onLoadNDTForm}
              disabled={!canLoad || lookupsLoading}
              sx={flowBar.primaryAction}
            >
              {L.loadForm}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NDTFlowBar;

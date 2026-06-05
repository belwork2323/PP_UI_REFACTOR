import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import {
  DEFAULT_SELECTED_PROCESSES,
  RAW_MATERIAL_PREP_PROCESSES,
  getPremixLabel,
  getPrepMaterialGrades,
  materialRequiresGradeSelection,
  type RawMaterialPrepMaterialGrade,
  type RawMaterialPrepMaterialOption,
  type RawMaterialPrepProcessKey,
  type RawMaterialPrepSelectedProcesses,
} from "../../../../../hooks/user/manufacturing/rawMaterialPrepFlowConfig";
import RawMaterialPrepSelect from "./RawMaterialPrepSelect";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const SF = STRINGS.SOURCING.SPECIFICATION_FORM;

type RawMaterialPrepFlowBarProps = {
  selectedPremix: number | "";
  selectedProcesses: RawMaterialPrepSelectedProcesses;
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
  availableSolidMaterials: RawMaterialPrepMaterialOption[];
  availableLiquidMaterials: RawMaterialPrepMaterialOption[];
  loadingMaterials: boolean;
  availablePremixOptions: number[];
  onPremixChange: (premix: number | "") => void;
  onProcessToggle: (process: RawMaterialPrepProcessKey, checked: boolean) => void;
  onSolidMaterialChange: (materialCode: string) => void;
  onSolidGradeChange: (gradeCode: string) => void;
  onLiquidMaterialChange: (materialCode: string) => void;
  onAddPremixSelection: () => void;
  canAddPremixSelection: boolean;
  theme: any;
};

const toMaterialSelectOptions = (materials: RawMaterialPrepMaterialOption[]) =>
  (Array.isArray(materials) ? materials : []).map((m) => ({
    value: m.materialCode,
    label: `${m.materialCode} - ${m.materialName}`,
    meta: `(${m.specCount ?? 0} ${SF.SPEC_COUNT_SUFFIX})`,
  }));

const toGradeSelectOptions = (grades: RawMaterialPrepMaterialGrade[]) =>
  grades.map((g) => ({
    value: g.gradeCode,
    label: g.gradeName || g.gradeCode,
  }));

const RawMaterialPrepFlowBar = ({
  selectedPremix,
  selectedProcesses,
  solidMaterialCode,
  solidGradeCode,
  liquidMaterialCode,
  availableSolidMaterials,
  availableLiquidMaterials,
  loadingMaterials,
  availablePremixOptions,
  onPremixChange,
  onProcessToggle,
  onSolidMaterialChange,
  onSolidGradeChange,
  onLiquidMaterialChange,
  onAddPremixSelection,
  canAddPremixSelection,
  theme,
}: RawMaterialPrepFlowBarProps) => {
  const rmTheme = theme.manufacturing.rawMaterialPrep;
  const flowBarTheme = rmTheme?.flowBar ?? {};
  const premixSelected = selectedPremix !== "";
  const safeProcesses = { ...DEFAULT_SELECTED_PROCESSES, ...(selectedProcesses ?? {}) };
  const hasProcessSelected = safeProcesses.solid || safeProcesses.liquid;
  const showMaterialRow = premixSelected && hasProcessSelected;
  const solidMaterials = Array.isArray(availableSolidMaterials) ? availableSolidMaterials : [];
  const liquidMaterials = Array.isArray(availableLiquidMaterials) ? availableLiquidMaterials : [];

  const premixSelectOptions = availablePremixOptions.map((n) => ({
    value: String(n),
    label: getPremixLabel(n),
  }));

  const solidMaterialSelectOptions = toMaterialSelectOptions(solidMaterials);
  const liquidMaterialSelectOptions = toMaterialSelectOptions(liquidMaterials);
  const showSolidGradeSelect =
    safeProcesses.solid &&
    Boolean(solidMaterialCode) &&
    materialRequiresGradeSelection(solidMaterials, solidMaterialCode);
  const solidGradeSelectOptions = showSolidGradeSelect
    ? toGradeSelectOptions(getPrepMaterialGrades(solidMaterials, solidMaterialCode))
    : [];
  const materialPlaceholder = loadingMaterials
    ? RM.LOADING_MATERIALS
    : RM.SELECT_RAW_MATERIAL_PLACEHOLDER;
  const rawMaterialLabel = "Raw Material";

  return (
    <Box sx={flowBarTheme.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBarTheme.topRow}>
          <RawMaterialPrepSelect
            label={RM.PREMIX_LABEL}
            value={premixSelected ? String(selectedPremix) : ""}
            placeholder={RM.PREMIX_PLACEHOLDER}
            options={premixSelectOptions}
            variant="premix"
            width={260}
            theme={theme}
            onChange={(v) => onPremixChange(v === "" ? "" : Number(v))}
          />

          <Box sx={flowBarTheme.processField}>
            <Typography component="label" sx={flowBarTheme.selectLabel}>
              {RM.PROCESS_LABEL}
            </Typography>
            <Box sx={flowBarTheme.processControlRow}>
              {RAW_MATERIAL_PREP_PROCESSES.map((p) => (
                <FormControlLabel
                  key={p.value}
                  sx={flowBarTheme.processCheckbox}
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(safeProcesses[p.value])}
                      disabled={!premixSelected}
                      onChange={(e) => onProcessToggle(p.value, e.target.checked)}
                    />
                  }
                  label={p.label}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {showMaterialRow && (
          <Box sx={flowBarTheme.materialSelectorBox}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: { sm: "flex-end" },
              }}
            >
              {safeProcesses.solid && (
                <Box sx={{ flex: "0 0 auto" }}>
                  <RawMaterialPrepSelect
                    label={`Select Solid ${rawMaterialLabel}`}
                    value={solidMaterialCode}
                    placeholder={materialPlaceholder}
                    options={solidMaterialSelectOptions}
                    variant="material"
                    disabled={loadingMaterials}
                    width={360}
                    theme={theme}
                    onChange={onSolidMaterialChange}
                  />
                </Box>
              )}
              {showSolidGradeSelect && (
                <Box sx={{ flex: "0 0 auto" }}>
                  <RawMaterialPrepSelect
                    label={RM.SELECT_GRADE_LABEL}
                    value={solidGradeCode}
                    placeholder={RM.SELECT_GRADE_PLACEHOLDER}
                    options={solidGradeSelectOptions}
                    variant="premix"
                    disabled={loadingMaterials}
                    width={280}
                    theme={theme}
                    onChange={onSolidGradeChange}
                  />
                </Box>
              )}
              {safeProcesses.liquid && (
                <Box sx={{ flex: "0 0 auto" }}>
                  <RawMaterialPrepSelect
                    label={`Select Liquid ${rawMaterialLabel}`}
                    value={liquidMaterialCode}
                    placeholder={materialPlaceholder}
                    options={liquidMaterialSelectOptions}
                    variant="material"
                    disabled={loadingMaterials}
                    width={360}
                    theme={theme}
                    onChange={onLiquidMaterialChange}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>
              <Button
                variant="contained"
                size="small"
                onClick={onAddPremixSelection}
                disabled={!canAddPremixSelection}
              >
                Add
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RawMaterialPrepFlowBar;

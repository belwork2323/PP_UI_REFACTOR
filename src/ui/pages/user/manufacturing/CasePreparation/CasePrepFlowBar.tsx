import { Box, Button, CircularProgress } from "@mui/material";
import {
  CASE_PREP_FLOW_LABELS,
  getCasePrepMotorCountOptions,
  isMainMotorBatch,
  isSubscaleBatch,
  type CasePrepMotorOption,
} from "../../../../../hooks/user/manufacturing/casePreparationFlowConfig";
import CasePrepSelect from "./CasePrepSelect";
import CasePrepDateField from "./CasePrepDateField";

type CasePrepFlowBarProps = {
  batchType?: string;
  motorCount: number | "";
  draftMotorIds: string[];
  prrcClearanceDate: string;
  availableMotorOptions: CasePrepMotorOption[];
  usedMotorIds: string[];
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onPrrcDateChange: (value: string) => void;
  onAddMotors: () => void;
  canAddMotors: boolean;
  schemaLoading?: boolean;
  theme: any;
};

const CasePrepFlowBar = ({
  batchType,
  motorCount,
  draftMotorIds,
  prrcClearanceDate,
  availableMotorOptions,
  usedMotorIds,
  onMotorCountChange,
  onDraftMotorIdChange,
  onPrrcDateChange,
  onAddMotors,
  canAddMotors,
  schemaLoading = false,
  theme,
}: CasePrepFlowBarProps) => {
  const cpTheme = theme.manufacturing.casePreparation;
  const flowBar = cpTheme?.flowBar ?? {};
  const isMain = isMainMotorBatch(batchType);
  const isSubscale = isSubscaleBatch(batchType);
  const count = motorCount === "" ? 0 : Number(motorCount);
  const countSelected = count > 0;

  const motorCountOptions = getCasePrepMotorCountOptions(availableMotorOptions);

  const getMotorOptionsForSlot = (slotIndex: number) => {
    const currentValue = draftMotorIds[slotIndex] ?? "";
    return availableMotorOptions.map((option) => ({
      ...option,
      disabled: option.value !== currentValue && usedMotorIds.includes(option.value),
    }));
  };

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {isMain && (
          <Box sx={flowBar.topRow}>
            <CasePrepSelect
              label={CASE_PREP_FLOW_LABELS.motorCount}
              value={countSelected ? String(motorCount) : ""}
              placeholder={CASE_PREP_FLOW_LABELS.motorCountPlaceholder}
              options={motorCountOptions}
              width={200}
              theme={theme}
              onChange={(v) => onMotorCountChange(v === "" ? "" : Number(v))}
            />

            <CasePrepDateField
              label={CASE_PREP_FLOW_LABELS.prrcDate}
              value={prrcClearanceDate}
              onChange={onPrrcDateChange}
              disabled={!countSelected}
              placeholder={CASE_PREP_FLOW_LABELS.prrcDatePlaceholder}
              theme={theme}
            />
          </Box>
        )}

        {(isMain && countSelected) || isSubscale ? (
          <Box sx={flowBar.motorSelectorBox}>
            {isMain && countSelected && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: { sm: "flex-end" },
                  mb: 1.25,
                }}
              >
                {Array.from({ length: count }, (_, idx) => (
                  <CasePrepSelect
                    key={`motor-slot-${idx}`}
                    label={`${CASE_PREP_FLOW_LABELS.motorId} ${count > 1 ? idx + 1 : ""}`.trim()}
                    value={draftMotorIds[idx] ?? ""}
                    placeholder={CASE_PREP_FLOW_LABELS.motorIdPlaceholder}
                    options={getMotorOptionsForSlot(idx)}
                    width={280}
                    theme={theme}
                    onChange={(v) => onDraftMotorIdChange(idx, v)}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                size="small"
                onClick={onAddMotors}
                disabled={!canAddMotors || schemaLoading}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {schemaLoading ? CASE_PREP_FLOW_LABELS.schemaLoading : CASE_PREP_FLOW_LABELS.addMotors}
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default CasePrepFlowBar;

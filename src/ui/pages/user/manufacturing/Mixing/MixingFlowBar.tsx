import { Box, Button } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import {
  MIXING_STAGE_OPTIONS,
  getFinalMixNoLabel,
  getPremixNoLabel,
  type MixingStageValue,
} from "../../../../../hooks/user/manufacturing/mixingConfig";
import { MixingSelectField } from "./MixingFormFields";

const S = STRINGS.MANUFACTURING.MIXING;

type MixingFlowBarProps = {
  selectedMixingStage: MixingStageValue | "";
  selectedStageNo: number | "";
  availableStageNumbers: number[];
  canAddStageCard: boolean;
  onMixingStageChange: (stage: MixingStageValue | "") => void;
  onStageNoChange: (stageNo: number | "") => void;
  onAddStageCard: () => void;
};

const MixingFlowBar = ({
  selectedMixingStage,
  selectedStageNo,
  availableStageNumbers,
  canAddStageCard,
  onMixingStageChange,
  onStageNoChange,
  onAddStageCard,
}: MixingFlowBarProps) => {
  const stageSelected = selectedMixingStage !== "";
  const stageNoLabel =
    selectedMixingStage === "FINAL_MIX" ? S.LABEL_FINAL_MIX_NO : S.LABEL_PREMIX_NO;

  const stageNoOptions = availableStageNumbers.map((number) => ({
    value: String(number),
    label:
      selectedMixingStage === "FINAL_MIX"
        ? getFinalMixNoLabel(number)
        : getPremixNoLabel(number),
  }));

  return (
    <Box
      sx={{
        border: `1px solid rgba(21,101,192,0.18)`,
        borderRadius: 2,
        p: 2,
        background: "linear-gradient(135deg, rgba(21,101,192,0.04), rgba(25,118,210,0.02))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          alignItems: { md: "flex-end" },
        }}
      >
        <Box sx={{ minWidth: { md: 240 }, flex: "0 0 auto" }}>
          <MixingSelectField
            label={S.MIXING_STAGE_LABEL}
            value={selectedMixingStage}
            placeholder={S.MIXING_STAGE_PLACEHOLDER}
            options={MIXING_STAGE_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            onChange={(value) => onMixingStageChange((value as MixingStageValue | "") || "")}
          />
        </Box>

        <Box sx={{ minWidth: { md: 240 }, flex: "0 0 auto" }}>
          <MixingSelectField
            label={stageNoLabel}
            value={selectedStageNo === "" ? "" : String(selectedStageNo)}
            placeholder={S.STAGE_NO_PLACEHOLDER}
            options={stageNoOptions}
            disabled={!stageSelected}
            onChange={(value) => onStageNoChange(value === "" ? "" : Number(value))}
          />
        </Box>

        <Box sx={{ flex: "1 1 auto", display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
          <Button variant="contained" size="small" disabled={!canAddStageCard} onClick={onAddStageCard}>
            {S.ADD_CARD}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MixingFlowBar;

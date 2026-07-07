import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import {
  TRIMMING_FLOW_LABELS,
  getTrimmingMotorCountOptions,
  type TrimmingMotorOption,
  type TrimmingMotorStageOption,
} from "../../../../../hooks/user/manufacturing/trimmingFlowConfig";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

type TrimmingFlowBarProps = {
  selectedMotorStage: string;
  motorStageOptions: TrimmingMotorStageOption[];
  motorStagesLoading?: boolean;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  availableMotorOptions: TrimmingMotorOption[];
  approvedMotorsLoading?: boolean;
  usedMotorIds: string[];
  trimmingFormLoaded: boolean;
  maxMotorCount: number;
  onMotorStageChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onLoadTrimmingForm: () => void;
  onAddMotors: () => void;
  canLoad: boolean;
  canAdd: boolean;
  schemaLoading?: boolean;
  theme: any;
};

const TrimmingFlowBar = ({
  selectedMotorStage,
  motorStageOptions,
  motorStagesLoading = false,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  availableMotorOptions,
  approvedMotorsLoading = false,
  usedMotorIds,
  trimmingFormLoaded,
  maxMotorCount,
  onMotorStageChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onLoadTrimmingForm,
  onAddMotors,
  canLoad,
  canAdd,
  schemaLoading = false,
  theme,
}: TrimmingFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = TRIMMING_FLOW_LABELS;
  const count = motorCount === "" ? 0 : Number(motorCount);
  const countSelected = count > 0;
  const hasMotorOptions = availableMotorOptions.length > 0;
  const motorCountOptions = getTrimmingMotorCountOptions(maxMotorCount);
  const stageSelected = String(selectedMotorStage ?? "").trim().length > 0;
  const setupFieldsEnabled = stageSelected && !motorStagesLoading;
  const motorSlotCount = countSelected ? count : 1;

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
        <Box
          sx={{
            ...flowBar.topRow,
            alignItems: "flex-end",
          }}
        >
          <CasePrepSelect
            label={L.motorStage}
            value={selectedMotorStage}
            placeholder={motorStagesLoading ? L.motorStagesLoading : L.motorStagePlaceholder}
            options={motorStageOptions.map((stage) => ({
              value: stage.value,
              label: stage.label,
            }))}
            width={200}
            theme={theme}
            disabled={motorStagesLoading}
            onChange={onMotorStageChange}
          />

          <CasePrepSelect
            label={L.motorCount}
            value={countSelected ? String(motorCount) : ""}
            placeholder={L.motorCountPlaceholder}
            options={motorCountOptions}
            width={200}
            theme={theme}
            disabled={!setupFieldsEnabled}
            onChange={(v) => onMotorCountChange(v === "" ? "" : Number(v))}
          />

          {stageSelected
            ? Array.from({ length: motorSlotCount }, (_, idx) => (
                <CasePrepSelect
                  key={`trimming-motor-slot-${idx}`}
                  label={`${L.motorId} ${motorSlotCount > 1 ? idx + 1 : ""}`.trim()}
                  value={draftMotorIds[idx] ?? ""}
                  placeholder={
                    approvedMotorsLoading ? L.approvedMotorsLoading : L.motorIdPlaceholder
                  }
                  options={getMotorOptionsForSlot(idx)}
                  width={220}
                  theme={theme}
                  disabled={approvedMotorsLoading || !hasMotorOptions}
                  onChange={(v) => onDraftMotorIdChange(idx, v)}
                />
              ))
            : null}

          <Box sx={flowBar.selectField?.(260)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {L.motorReceivedAt}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
              <DateTimePicker
                enableAccessibleFieldDOMStructure={false}
                format="DD-MM-YYYY HH:mm"
                disabled={!setupFieldsEnabled}
                value={motorReceivedAt ? dayjs(motorReceivedAt, "DD-MM-YYYY HH:mm") : null}
                onChange={(picked) =>
                  onMotorReceivedAtChange(picked?.format("DD-MM-YYYY HH:mm") || "")
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    variant: "outlined",
                    placeholder: L.motorReceivedAtPlaceholder,
                    sx: flowBar.selectInput?.(Boolean(motorReceivedAt.trim())),
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </Box>

        {stageSelected && approvedMotorsLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography sx={{ fontSize: "0.78rem", color: theme.palette.textSub }}>
              {L.approvedMotorsLoading}
            </Typography>
          </Box>
        ) : null}

        {stageSelected ? (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            {!trimmingFormLoaded ? (
              <Button
                variant="contained"
                size="small"
                onClick={onLoadTrimmingForm}
                disabled={!canLoad || schemaLoading}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {schemaLoading ? L.schemaLoading : L.loadForm}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={onAddMotors}
                disabled={!canAdd || schemaLoading}
                startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              >
                {schemaLoading ? L.schemaLoading : L.addMotors}
              </Button>
            )}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default TrimmingFlowBar;

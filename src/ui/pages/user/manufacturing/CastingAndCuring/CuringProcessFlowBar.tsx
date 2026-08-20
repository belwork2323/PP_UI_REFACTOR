import { useMemo } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { CuringCycleConfig } from "../../../../../data/models/user/CuringCycleConfigModel";
import type { CuringProcessSetup } from "../../../../../data/models/user/CastingCuringFormModel";
import {
  CASTING_CURING_FLOW_LABELS,
  buildCuringOvenNoOptions,
  canLoadCuringForm,
  formatCuringTypeLabel,
  formatMotorStageLabel,
  type CastingCuringBatchMotorSource,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

export type OvenSelectOption = {
  value: string;
  label: string;
  noOfOvenAvailable?: number;
};

type CuringProcessFlowBarProps = {
  setup: CuringProcessSetup;
  curingFormLoaded: boolean;
  curingCycleConfig?: CuringCycleConfig | null;
  batch?: CastingCuringBatchMotorSource | null;
  curingCyclesLoading?: boolean;
  ovenOptions: OvenSelectOption[];
  ovensLoading?: boolean;
  onChange: (field: keyof CuringProcessSetup, value: string | number | "") => void;
  onLoadCuringForm: () => void;
  schemaLoading?: boolean;
  theme: any;
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", mb: 0.25 }}>
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

const CuringProcessFlowBar = ({
  setup,
  curingFormLoaded,
  curingCycleConfig = null,
  batch = null,
  curingCyclesLoading = false,
  ovenOptions,
  ovensLoading = false,
  onChange,
  onLoadCuringForm,
  schemaLoading = false,
  theme,
}: CuringProcessFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = CASTING_CURING_FLOW_LABELS;

  const selectedOven = useMemo(
    () => ovenOptions.find((option) => option.value === setup.oven) ?? null,
    [ovenOptions, setup.oven],
  );

  const ovenNoOptions = useMemo(
    () => buildCuringOvenNoOptions(selectedOven?.noOfOvenAvailable),
    [selectedOven?.noOfOvenAvailable],
  );

  const canLoad = useMemo(
    () => canLoadCuringForm({ setup, curingFormLoaded }),
    [curingFormLoaded, setup],
  );

  const curingTypeLabel = useMemo(
    () => formatCuringTypeLabel(curingCycleConfig?.curingType ?? setup.curingType),
    [curingCycleConfig?.curingType, setup.curingType],
  );
  const motorStageLabel = useMemo(
    () => formatMotorStageLabel(curingCycleConfig, batch),
    [batch, curingCycleConfig],
  );

  if (curingFormLoaded) return null;

  return (
    <Box sx={flowBar.container}>
      <Typography
        sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1.5 }}
      >
        {L.curingProcessTitle}
      </Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={2} sx={{ mb: 1.5 }}>
        <DetailItem
          label={L.curingMotorStage}
          value={curingCyclesLoading ? L.curingCyclesLoading : motorStageLabel}
        />
        <DetailItem
          label={L.curingType}
          value={curingCyclesLoading ? L.curingCyclesLoading : curingTypeLabel}
        />
      </Stack>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.curingSelectOven}
            value={setup.oven}
            placeholder={ovensLoading ? L.schemaLoading : L.curingSelectOvenPlaceholder}
            options={ovenOptions}
            width={200}
            theme={theme}
            onChange={(value) => {
              onChange("oven", value);
              onChange("ovenNo", "");
            }}
          />

          {setup.oven ? (
            <CasePrepSelect
              label={L.curingSelectOvenNo}
              value={setup.ovenNo}
              placeholder={L.curingSelectOvenNoPlaceholder}
              options={ovenNoOptions}
              width={220}
              theme={theme}
              onChange={(value) => onChange("ovenNo", value)}
            />
          ) : null}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={onLoadCuringForm}
            disabled={!canLoad || schemaLoading || ovensLoading || curingCyclesLoading}
            startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {schemaLoading ? L.schemaLoading : L.loadCuringForm}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CuringProcessFlowBar;

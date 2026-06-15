import { useMemo } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import type { CuringProcessSetup } from "../../../../../data/models/user/CastingCuringFormModel";
import {
  CASTING_CURING_FLOW_LABELS,
  CURING_CONFIGURATION_OPTIONS,
  CURING_MOTORS_TO_CURE_OPTIONS,
  CURING_OVEN_OPTIONS,
  CURING_OVENS_UTILIZED_OPTIONS,
  CURING_TYPE_OPTIONS,
  canLoadCuringForm,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

type CuringProcessFlowBarProps = {
  setup: CuringProcessSetup;
  curingFormLoaded: boolean;
  onChange: (field: keyof CuringProcessSetup, value: string | number | "") => void;
  onLoadCuringForm: () => void;
  schemaLoading?: boolean;
  theme: any;
};

const CuringProcessFlowBar = ({
  setup,
  curingFormLoaded,
  onChange,
  onLoadCuringForm,
  schemaLoading = false,
  theme,
}: CuringProcessFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = CASTING_CURING_FLOW_LABELS;
  const showMotorsToCure = String(setup.configuration).toLowerCase() === "multiple";
  const showOvensMatchHint =
    showMotorsToCure &&
    String(setup.ovensUtilized).toLowerCase() === "multiple" &&
    setup.motorsToCureCount !== "";

  const canLoad = useMemo(
    () => canLoadCuringForm({ setup, curingFormLoaded }),
    [curingFormLoaded, setup],
  );

  if (curingFormLoaded) return null;

  return (
    <Box sx={flowBar.container}>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1.5 }}>
        {L.curingProcessTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.curingSelectOven}
            value={setup.oven}
            placeholder={L.curingSelectOvenPlaceholder}
            options={[...CURING_OVEN_OPTIONS]}
            width={200}
            theme={theme}
            onChange={(value) => onChange("oven", value)}
          />

          <CasePrepSelect
            label={L.curingType}
            value={setup.curingType}
            placeholder={L.curingTypePlaceholder}
            options={[...CURING_TYPE_OPTIONS]}
            width={240}
            theme={theme}
            onChange={(value) => onChange("curingType", value)}
          />

          <CasePrepSelect
            label={L.curingConfiguration}
            value={setup.configuration}
            placeholder={L.curingConfigurationPlaceholder}
            options={[...CURING_CONFIGURATION_OPTIONS]}
            width={200}
            theme={theme}
            onChange={(value) => {
              onChange("configuration", value);
              if (String(value).toLowerCase() !== "multiple") {
                onChange("motorsToCureCount", "");
              }
            }}
          />

          {showMotorsToCure ? (
            <CasePrepSelect
              label={L.curingMotorsToCure}
              value={setup.motorsToCureCount === "" ? "" : String(setup.motorsToCureCount)}
              placeholder={L.curingMotorsToCurePlaceholder}
              options={CURING_MOTORS_TO_CURE_OPTIONS}
              width={260}
              theme={theme}
              onChange={(value) => onChange("motorsToCureCount", value === "" ? "" : Number(value))}
            />
          ) : null}

          <CasePrepSelect
            label={L.curingOvensUtilized}
            value={setup.ovensUtilized}
            placeholder={L.curingOvensUtilizedPlaceholder}
            options={[...CURING_OVENS_UTILIZED_OPTIONS]}
            width={240}
            theme={theme}
            onChange={(value) => onChange("ovensUtilized", value)}
          />
        </Box>

        {showOvensMatchHint ? (
          <Typography sx={{ fontSize: "0.74rem", color: theme.palette.textSub }}>
            {L.curingOvensMatchHint}
          </Typography>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={onLoadCuringForm}
            disabled={!canLoad || schemaLoading}
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

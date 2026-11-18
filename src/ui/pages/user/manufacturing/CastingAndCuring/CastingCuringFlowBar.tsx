import { useEffect, useMemo, useState } from "react";
import { alpha, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import {
  CASTING_CURING_FLOW_LABELS,
  canLoadCastingFormForMotor,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import { DateTimeField } from "../../../../components/common/DateField";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import { getTodayInIstDate } from "@/utils/dateUtils";

type CastingCuringFlowBarProps = {
  motorId: string;
  castingStation: string;
  motorReceivedAt: string;
  onCastingStationChange: (value: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onLoadCastingForm: () => void;
  schemaLoading?: boolean;
  disabled?: boolean;
  theme: any;
  stationOptions: Array<{ value: string; label: string }>;
  stationLoadError?: string | null;
};

const CastingCuringFlowBar = ({
  motorId,
  castingStation,
  motorReceivedAt,
  onCastingStationChange,
  onMotorReceivedAtChange,
  onLoadCastingForm,
  schemaLoading = false,
  disabled = false,
  theme,
  stationOptions,
  stationLoadError,
}: CastingCuringFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = CASTING_CURING_FLOW_LABELS;
  const primary = theme.palette.primary;

  const canLoad = useMemo(
    () =>
      canLoadCastingFormForMotor({
        motorId,
        castingStation,
        motorReceivedAt,
      }),
    [castingStation, motorId, motorReceivedAt],
  );

  return (
    <Box sx={flowBar.container}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mb={1.5}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: primary }}>
          {L.castingProcessTitle}
          {motorId ? ` — ${motorId}` : ""}
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            border: `1px solid ${theme.palette.border ?? alpha(primary, 0.14)}`,
            borderRadius: 2,
            px: 1.25,
            py: 1.1,
            background: theme.palette.surface ?? "#fff",
          }}
        >
          <Box sx={{ ...flowBar.topRow, alignItems: "flex-start" }}>
            <Box>
              <CasePrepSelect
                label={L.castingStation}
                value={castingStation}
                placeholder={L.castingStationPlaceholder}
                options={stationOptions}
                width={220}
                theme={theme}
                disabled={disabled}
                onChange={onCastingStationChange}
                required
              />
              {stationLoadError ? (
                <Typography
                  sx={{ fontSize: "0.72rem", color: theme.palette?.danger ?? "#C0392B", mt: 0.5 }}
                >
                  {stationLoadError}
                </Typography>
              ) : null}
            </Box>

            <Box sx={flowBar.selectField?.(260)}>
              <Typography component="label" sx={flowBar.selectLabel}>
                <FieldLabelWithAsterisk label={L.motorReceivedAt} required />
              </Typography>
              <DateTimeField
                value={motorReceivedAt}
                maxDate={getTodayInIstDate()}
                onChange={onMotorReceivedAtChange}
                disabled={disabled}
                placeholder={L.motorReceivedAtPlaceholder}
                sx={{
                  mb: 0,
                  ...(flowBar.selectInput?.(Boolean(motorReceivedAt)) as object),
                }}
                required
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={onLoadCastingForm}
            disabled={disabled || !canLoad || schemaLoading}
            startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {schemaLoading ? L.schemaLoading : L.loadCastingForm}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CastingCuringFlowBar;

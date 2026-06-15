import { useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import {
  CASTING_CURING_FLOW_LABELS,
  CASTING_TYPE_OPTIONS,
  FALLBACK_CASTING_STATION_OPTIONS,
  canLoadCastingForm,
  getCastingMotorCountOptions,
  resolveCastingMotorCount,
  type CastingCuringMotorOption,
  type CastingProcessSetupDraft,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

type CastingCuringFlowBarProps = {
  castingType: string;
  castingStation: string;
  motorCount: number | "";
  draftMotorIds: string[];
  motorReceivedAt: string;
  setup: CastingProcessSetupDraft;
  availableMotorOptions: CastingCuringMotorOption[];
  usedMotorIds: string[];
  castingFormLoaded: boolean;
  onCastingTypeChange: (value: string) => void;
  onCastingStationChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onMotorReceivedAtChange: (value: string) => void;
  onSetupChange: (field: keyof CastingProcessSetupDraft, value: string) => void;
  onLoadCastingForm: () => void;
  schemaLoading?: boolean;
  theme: any;
};

const CastingCuringFlowBar = ({
  castingType,
  castingStation,
  motorCount,
  draftMotorIds,
  motorReceivedAt,
  setup,
  availableMotorOptions,
  usedMotorIds,
  castingFormLoaded,
  onCastingTypeChange,
  onCastingStationChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onMotorReceivedAtChange,
  onSetupChange,
  onLoadCastingForm,
  schemaLoading = false,
  theme,
}: CastingCuringFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = CASTING_CURING_FLOW_LABELS;
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let active = true;
    void fetchCastingStationsApi().then((response: any) => {
      if (!active) return;
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const mapped = list
        .map((item: Record<string, unknown>) => {
          const value = String(item.stationCode ?? item.stationId ?? item.stationName ?? item.code ?? "");
          const label = String(item.stationName ?? item.stationCode ?? value);
          return { value, label };
        })
        .filter((item) => item.value);
      setStationOptions(mapped.length > 0 ? mapped : [...FALLBACK_CASTING_STATION_OPTIONS]);
    });
    return () => {
      active = false;
    };
  }, []);

  const resolvedMotorCount = resolveCastingMotorCount(castingType, motorCount);
  const showCustomMotorCount = String(castingType).toLowerCase() === "others";
  const showMotorFields = resolvedMotorCount > 0 && availableMotorOptions.length > 0;
  const motorCountOptions = getCastingMotorCountOptions(availableMotorOptions);
  const setupFieldsEnabled = Boolean(castingType && castingStation);

  const canLoad = useMemo(
    () =>
      canLoadCastingForm({
        castingType,
        castingStation,
        motorCount,
        draftMotorIds,
        motorReceivedAt,
        usedMotorIds,
        availableMotorOptions,
        setup,
        castingFormLoaded,
      }),
    [
      availableMotorOptions,
      castingFormLoaded,
      castingStation,
      castingType,
      draftMotorIds,
      motorCount,
      motorReceivedAt,
      setup,
      usedMotorIds,
    ],
  );

  const getMotorOptionsForSlot = (slotIndex: number) => {
    const currentValue = draftMotorIds[slotIndex] ?? "";
    return availableMotorOptions.map((option) => ({
      ...option,
      disabled: option.value !== currentValue && usedMotorIds.includes(option.value),
    }));
  };

  const renderSetupInput = (
    label: string,
    placeholder: string,
    value: string,
    field: keyof CastingProcessSetupDraft,
    width: number | string = 220,
  ) => (
    <Box sx={flowBar.selectField?.(width)}>
      <Typography component="label" sx={flowBar.selectLabel}>
        {label}
      </Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        disabled={!setupFieldsEnabled}
        placeholder={placeholder}
        onChange={(event) => onSetupChange(field, event.target.value)}
        sx={flowBar.selectInput?.(Boolean(String(value ?? "").trim()))}
        inputProps={{ inputMode: "decimal" }}
      />
    </Box>
  );

  if (castingFormLoaded) return null;

  return (
    <Box sx={flowBar.container}>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: theme.palette.primary, mb: 1.5 }}>
        {L.castingProcessTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.castingType}
            value={castingType}
            placeholder={L.castingTypePlaceholder}
            options={CASTING_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            width={200}
            theme={theme}
            onChange={onCastingTypeChange}
          />

          <CasePrepSelect
            label={L.castingStation}
            value={castingStation}
            placeholder={L.castingStationPlaceholder}
            options={stationOptions}
            width={200}
            theme={theme}
            onChange={onCastingStationChange}
          />

          {showCustomMotorCount ? (
            <CasePrepSelect
              label={L.motorCount}
              value={motorCount === "" ? "" : String(motorCount)}
              placeholder={L.motorCountPlaceholder}
              options={motorCountOptions}
              width={200}
              theme={theme}
              onChange={(value) => onMotorCountChange(value === "" ? "" : Number(value))}
            />
          ) : null}

          {showMotorFields ? (
            <>
              {Array.from({ length: resolvedMotorCount }, (_, idx) => (
                <CasePrepSelect
                  key={`cc-motor-slot-${idx}`}
                  label={`${L.motorId} ${resolvedMotorCount > 1 ? idx + 1 : ""}`.trim()}
                  value={draftMotorIds[idx] ?? ""}
                  placeholder={L.motorIdPlaceholder}
                  options={getMotorOptionsForSlot(idx)}
                  width={220}
                  theme={theme}
                  disabled={!setupFieldsEnabled}
                  onChange={(value) => onDraftMotorIdChange(idx, value)}
                />
              ))}
            </>
          ) : null}

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
                onChange={(picked) => onMotorReceivedAtChange(picked?.format("DD-MM-YYYY HH:mm") || "")}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    placeholder: L.motorReceivedAtPlaceholder,
                    sx: flowBar.selectInput?.(Boolean(motorReceivedAt)),
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </Box>

        <Box sx={flowBar.topRow}>
          {renderSetupInput(
            L.initialVacuum,
            L.initialVacuumPlaceholder,
            setup.initialVacuum,
            "initialVacuum",
          )}
          {renderSetupInput(
            L.castingVacuumPressure,
            L.castingVacuumPressurePlaceholder,
            setup.castingVacuumPressure,
            "castingVacuumPressure",
          )}
          {renderSetupInput(
            L.soakingVacuumPressure,
            L.soakingVacuumPressurePlaceholder,
            setup.soakingVacuumPressure,
            "soakingVacuumPressure",
          )}
          {renderSetupInput(
            L.finalMixCount,
            L.finalMixCountPlaceholder,
            setup.finalMixCount,
            "finalMixCount",
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={onLoadCastingForm}
            disabled={!canLoad || schemaLoading}
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

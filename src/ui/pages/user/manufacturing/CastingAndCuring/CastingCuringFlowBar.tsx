import { useEffect, useMemo, useState } from "react";
import { alpha, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import {
  CASTING_CURING_FLOW_LABELS,
  canAddCastingCuringMotors,
  canLoadCastingForm,
  filterUnusedCastingCuringMotorOptions,
  getCastingMotorCountOptions,
  resolveCastingCuringMotorOptionsForSlot,
  resolveCastingMotorCount,
  resolveCastingTypeOptionsForBatch,
  shouldShowMotorsToProcessField,
  type CastingCuringMotorOption,
  type CastingMotorDraftEntry,
} from "../../../../../hooks/user/manufacturing/castingCuringFlowConfig";
import { DateTimeField } from "../../../../components/common/DateField";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

type CastingMotorDraftField = keyof CastingMotorDraftEntry;

type CastingCuringFlowBarProps = {
  batchMotorCount: number;
  castingType: string;
  motorCount: number | "";
  castingMotorDrafts: CastingMotorDraftEntry[];
  availableMotorOptions: CastingCuringMotorOption[];
  usedMotorIds: string[];
  maxMotorCount: number;
  castingFormLoaded: boolean;
  onCastingTypeChange: (value: string) => void;
  onMotorCountChange: (count: number | "") => void;
  onCastingMotorDraftChange: (index: number, field: CastingMotorDraftField, value: string) => void;
  onLoadCastingForm: () => void;
  onAddMotors: () => void;
  canAddMotors: boolean;
  schemaLoading?: boolean;
  theme: any;
};

const CastingCuringFlowBar = ({
  batchMotorCount,
  castingType,
  motorCount,
  castingMotorDrafts,
  availableMotorOptions,
  usedMotorIds,
  maxMotorCount,
  castingFormLoaded,
  onCastingTypeChange,
  onMotorCountChange,
  onCastingMotorDraftChange,
  onLoadCastingForm,
  onAddMotors,
  canAddMotors,
  schemaLoading = false,
  theme,
}: CastingCuringFlowBarProps) => {
  const flowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = CASTING_CURING_FLOW_LABELS;
  const primary = theme.palette.primary;
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [stationLoadError, setStationLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setStationLoadError(null);
    void fetchCastingStationsApi()
      .then((response: any) => {
        if (!active) return;
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        const mapped = list
          .map((item: Record<string, unknown>) => {
            const value = String(item.stationCode ?? item.stationId ?? item.stationName ?? item.code ?? "");
            const label = String(item.stationName ?? item.stationCode ?? value);
            return { value, label };
          })
          .filter((item) => item.value);
        setStationOptions(mapped);
        if (mapped.length === 0) {
          setStationLoadError("Casting stations could not be loaded from the server.");
        }
      })
      .catch(() => {
        if (!active) return;
        setStationOptions([]);
        setStationLoadError("Casting stations could not be loaded from the server.");
      });
    return () => {
      active = false;
    };
  }, []);

  const unusedMotorOptions = useMemo(
    () => filterUnusedCastingCuringMotorOptions(availableMotorOptions, usedMotorIds),
    [availableMotorOptions, usedMotorIds],
  );
  const showAddSection =
    !castingFormLoaded || availableMotorOptions.length === 0 || unusedMotorOptions.length > 0;
  const castingTypeOptions = useMemo(
    () => resolveCastingTypeOptionsForBatch(batchMotorCount),
    [batchMotorCount],
  );
  const resolvedMotorCount = resolveCastingMotorCount(castingType, motorCount);
  const showMotorsToProcessField = shouldShowMotorsToProcessField(batchMotorCount, castingType);
  const showMotorRows =
    resolvedMotorCount > 0 && (availableMotorOptions.length === 0 || unusedMotorOptions.length > 0);
  const motorCountOptions = getCastingMotorCountOptions(maxMotorCount);

  const draftParams = useMemo(
    () => ({
      castingType,
      motorCount,
      castingMotorDrafts,
      usedMotorIds,
      availableMotorOptions,
      maxMotorCount,
    }),
    [availableMotorOptions, castingMotorDrafts, castingType, maxMotorCount, motorCount, usedMotorIds],
  );

  const canLoad = useMemo(
    () => canLoadCastingForm({ ...draftParams, castingFormLoaded }),
    [castingFormLoaded, draftParams],
  );
  const canAdd = useMemo(
    () => canAddCastingCuringMotors({ ...draftParams, castingFormLoaded }),
    [castingFormLoaded, draftParams],
  );

  const getMotorOptionsForSlot = (slotIndex: number) =>
    resolveCastingCuringMotorOptionsForSlot(
      availableMotorOptions,
      usedMotorIds,
      castingMotorDrafts,
      slotIndex,
    );

  const renderMotorRow = (row: CastingMotorDraftEntry, idx: number) => {
    const rowEnabled = Boolean(castingType);
    const rowLabel = resolvedMotorCount > 1 ? `${L.motorRowTitle} ${idx + 1}` : L.motorRowTitle;

    return (
      <Box
        key={`cc-motor-row-${idx}`}
        sx={{
          border: `1px solid ${theme.palette.border ?? alpha(primary, 0.14)}`,
          borderRadius: 2,
          px: 1.25,
          py: 1.1,
          background: theme.palette.surface ?? "#fff",
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: primary, mb: 1 }}>
          {rowLabel}
        </Typography>
        <Box sx={{ ...flowBar.topRow, alignItems: "flex-start" }}>
          <CasePrepSelect
            label={`${L.motorId}${resolvedMotorCount > 1 ? ` ${idx + 1}` : ""}`}
            value={row.motorId}
            placeholder={L.motorIdPlaceholder}
            options={getMotorOptionsForSlot(idx)}
            width={220}
            theme={theme}
            disabled={!rowEnabled}
            onChange={(value) => onCastingMotorDraftChange(idx, "motorId", value)}
          />

          <Box>
            <CasePrepSelect
              label={L.castingStation}
              value={row.castingStation}
              placeholder={L.castingStationPlaceholder}
              options={stationOptions}
              width={220}
              theme={theme}
              disabled={!rowEnabled}
              onChange={(value) => onCastingMotorDraftChange(idx, "castingStation", value)}
            />
            {idx === 0 && stationLoadError ? (
              <Typography sx={{ fontSize: "0.72rem", color: theme.palette?.danger ?? "#C0392B", mt: 0.5 }}>
                {stationLoadError}
              </Typography>
            ) : null}
          </Box>

          <Box sx={flowBar.selectField?.(260)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {L.motorReceivedAt}
            </Typography>
            <DateTimeField
              value={row.motorReceivedAt}
              onChange={(value) => onCastingMotorDraftChange(idx, "motorReceivedAt", value)}
              disabled={!rowEnabled}
              placeholder={L.motorReceivedAtPlaceholder}
              sx={{
                mb: 0,
                ...(flowBar.selectInput?.(Boolean(row.motorReceivedAt)) as object),
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  if (!showAddSection) return null;

  return (
    <Box sx={flowBar.container}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" mb={1.5}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: primary }}>
          {L.castingProcessTitle}
        </Typography>
        <Chip
          size="small"
          label={`${L.batchMotorsAvailable}: ${batchMotorCount}`}
          sx={{
            height: 24,
            fontWeight: 700,
            fontSize: "0.72rem",
            color: primary,
            background: alpha(primary, 0.08),
            border: `1px solid ${alpha(primary, 0.18)}`,
          }}
        />
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.castingType}
            value={castingType}
            placeholder={L.castingTypePlaceholder}
            options={castingTypeOptions}
            width={220}
            theme={theme}
            disabled={batchMotorCount <= 0}
            onChange={onCastingTypeChange}
          />

          {showMotorsToProcessField && maxMotorCount > 0 ? (
            <CasePrepSelect
              label={L.motorsToProcess}
              value={motorCount === "" ? "" : String(motorCount)}
              placeholder={L.motorsToProcessPlaceholder}
              options={motorCountOptions}
              width={220}
              theme={theme}
              disabled={!castingType}
              onChange={(value) => onMotorCountChange(value === "" ? "" : Number(value))}
            />
          ) : null}
        </Box>

        {showMotorRows ? (
          <Stack spacing={1.25}>
            {castingMotorDrafts.map((row, idx) => renderMotorRow(row, idx))}
          </Stack>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          {castingFormLoaded ? (
            <Button
              variant="contained"
              size="small"
              onClick={onAddMotors}
              disabled={!canAdd || schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading ? L.schemaLoading : L.addMotors}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={onLoadCastingForm}
              disabled={!canLoad || schemaLoading}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              {schemaLoading ? L.schemaLoading : L.loadCastingForm}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CastingCuringFlowBar;

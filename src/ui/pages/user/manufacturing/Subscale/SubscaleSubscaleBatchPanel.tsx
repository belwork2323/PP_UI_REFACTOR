import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Box,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FormInput from "../../../../components/common/FormInput";
import DateField from "../../../../components/common/DateField";
import {
  APP_CONTROL_FONT_SIZE,
  appDropdownMenuProps,
  appDropdownPlaceholderSx,
} from "../../../../components/common/fieldStyles";
import { STRINGS } from "../../../../../app/config/strings";
import { formatToUiDate } from "../../../../../utils/dateUtils";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import {
  SUBSCALE_BATCH_FIELDS,
  mergeSubscaleBatchFormValues,
  normalizeSubscaleMixingCycles,
  resolveMixingCycleOperations,
  mergeProcessParticularsWithOperations,
  type SubscaleMixingCycleEntry,
  type ProcessParticularRow,
} from "../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { sectionCardSx, sectionHeaderSx } from "./utils/subscaleHardwareTableStyles";
import { SubscaleProcessParticularRow } from "./components/SubscaleTableCells";
import {
  fetchMixingCycleDetailsApi,
  type MixingCycleMasterItem,
} from "@/data/api/common/generalAPI";
import { generalController } from "@/controllers/admin/common/generalController";
import { operationsController } from "@/controllers/user/operationsController";
import { isSubscaleProcessingBatch } from "@/hooks/user/manufacturing/subscaleHardwareConfig";

type MotorStageOption = {
  motorStage: string;
  noOfmotors: number;
};

/** Survives Strict Mode remounts — avoids duplicate network calls for the same lookup key. */
const motorStagesRequestByKey = new Map<string, Promise<MotorStageOption[]>>();
const mixingCyclesByStageCache = new Map<string, MixingCycleMasterItem[]>();
const mixingCyclesByStageRequest = new Map<string, Promise<MixingCycleMasterItem[]>>();
const mixingCycleDetailsRequest = new Map<string, Promise<unknown>>();

const hasMixingCycleParticulars = (cycle?: SubscaleMixingCycleEntry) =>
  (cycle?.premixParticulars?.length ?? 0) > 0 ||
  (cycle?.finalMixParticulars?.length ?? 0) > 0 ||
  (cycle?.processParticulars?.length ?? 0) > 0;

const fetchMotorStagesDeduped = async (projectId?: string): Promise<MotorStageOption[]> => {
  const key = projectId?.trim() || "__all__";
  let pending = motorStagesRequestByKey.get(key);
  if (!pending) {
    pending = (async () => {
      const response = await operationsController.fetchMotorsStageList(
        projectId ? { projectId } : undefined,
      );
      const stages = response?.success && response.data?.stages ? response.data.stages : [];
      return stages
        .map((stage) => ({
          motorStage: String(stage.motorStage ?? "").trim(),
          noOfmotors: Number(stage.noOfmotors ?? 0),
        }))
        .filter((stage) => stage.motorStage);
    })();
    motorStagesRequestByKey.set(key, pending);
  }
  return pending;
};

const fetchMixingCyclesForStageDeduped = async (
  motorStage: string,
): Promise<MixingCycleMasterItem[]> => {
  const stage = String(motorStage ?? "").trim();
  if (!stage) return [];

  const cached = mixingCyclesByStageCache.get(stage);
  if (cached) return cached;

  let pending = mixingCyclesByStageRequest.get(stage);
  if (!pending) {
    pending = (async () => {
      const response = await generalController.getMixingCycles(stage);
      return response?.success && Array.isArray(response.data)
        ? (response.data as MixingCycleMasterItem[])
        : [];
    })();
    mixingCyclesByStageRequest.set(stage, pending);
  }

  const list = await pending;
  mixingCyclesByStageCache.set(stage, list);
  return list;
};

const fetchMixingCycleDetailsDeduped = async (mixingCycleCode: string) => {
  const code = String(mixingCycleCode ?? "").trim();
  if (!code) return null;

  let pending = mixingCycleDetailsRequest.get(code);
  if (!pending) {
    pending = fetchMixingCycleDetailsApi(code);
    mixingCycleDetailsRequest.set(code, pending);
  }

  const response = await pending;
  return (response as { data?: unknown })?.data ?? response;
};

const S = STRINGS.MANUFACTURING.SUBSCALE.BATCH_SETUP;
const PROCESS_S = STRINGS.MANUFACTURING.MIXING;

type SubscaleSubscaleBatchPanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  batchDetails: any;
};

const normalizeSubBatchType = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const isExperimentalSubscaleBatch = (batchDetails: any) => {
  const batchType = batchDetails?.batchType ?? batchDetails?.batch_type;
  const subBatchType =
    batchDetails?.subBatchType ?? batchDetails?.sub_batch_type ?? batchDetails?.subBatchTypeCode;
  return (
    isSubscaleProcessingBatch(batchType) && normalizeSubBatchType(subBatchType) === "EXPERIMENTAL"
  );
};

const formatMixingCycleLabel = (cycle: { mixingCycleName?: string; mixingCycleCode?: string }) => {
  const name = String(cycle.mixingCycleName ?? "").trim();
  const code = String(cycle.mixingCycleCode ?? "").trim();
  if (name && code && name !== code) return `${name} (${code})`;
  return name || code || "";
};

const SubscaleSubscaleBatchPanel: React.FC<SubscaleSubscaleBatchPanelProps> = ({
  values,
  onChange,
  batchDetails,
}) => {
  const mixingCyclesRaw = values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES];
  const mixingCycles = useMemo(
    () => normalizeSubscaleMixingCycles(mixingCyclesRaw),
    [mixingCyclesRaw],
  );
  const isExperimental = isExperimentalSubscaleBatch(batchDetails);

  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);
  const [mixingCycleOptionsByStage, setMixingCycleOptionsByStage] = useState<
    Record<string, MixingCycleMasterItem[]>
  >({});
  const [mixingCyclesLoadingByStage, setMixingCyclesLoadingByStage] = useState<
    Record<string, boolean>
  >({});
  const [mixingCycleDetailsLoadingByIndex, setMixingCycleDetailsLoadingByIndex] = useState<
    Record<number, boolean>
  >({});

  const valuesRef = useRef(values);
  const mixingCycleDetailsRequestIdRef = useRef<Record<number, number>>({});
  const mixingCyclesRef = useRef(mixingCycles);
  valuesRef.current = values;
  mixingCyclesRef.current = mixingCycles;

  const patchValues = useCallback((patch: SchemaFormValues) => {
    const next = { ...valuesRef.current, ...patch };
    if (next.IS_PROCESS_FORM_LOADED) {
      onChange(next);
      return;
    }
    onChange(mergeSubscaleBatchFormValues(next));
  }, [onChange]);

  const updateMixingCycles = useCallback(
    (cycles: SubscaleMixingCycleEntry[]) => {
      patchValues({ [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: cycles });
    },
    [patchValues],
  );

  // Sync batchDetails defaults into values on initial load if not present
  useEffect(() => {
    if (!batchDetails?.identificationSheet) return;
    const sheet = batchDetails.identificationSheet;
    const batchSize = sheet.batchSize;
    const mixerType = sheet.mixerType;
    const bldgNo = sheet.BldgNo ?? sheet.bldgNo ?? "";

    const nextBatchSize = String(values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] ?? "").trim();
    const nextMixerType = String(values.mixerType ?? "").trim();
    const nextBldg = String(values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] ?? "").trim();

    patchValues({
      [SUBSCALE_BATCH_FIELDS.BATCH_SIZE]: nextBatchSize || batchSize || "",
      mixerType: nextMixerType || mixerType || "",
      [SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO]: nextBldg || bldgNo || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchDetails]);

  // Seed cycle stage/code from batch mixingCycle when empty (qualification + experimental prefill)
  useEffect(() => {
    const batchCycle = batchDetails?.mixingCycle;
    if (!batchCycle) return;

    const stageFromBatch = String(batchCycle.motorStage ?? "").trim();
    const codeFromBatch = String(batchCycle.mixingCycleCode ?? "").trim();
    const nameFromBatch = String(batchCycle.mixingCycleName ?? "").trim();
    if (!stageFromBatch && !codeFromBatch) return;

    const needsSeed = mixingCycles.some(
      (cycle) => !String(cycle.stage ?? "").trim() || !String(cycle.mixingCycleCode ?? "").trim(),
    );
    if (!needsSeed) return;

    updateMixingCycles(
      mixingCycles.map((cycle) => ({
        ...cycle,
        stage: String(cycle.stage ?? "").trim() || stageFromBatch,
        mixingCycleCode: String(cycle.mixingCycleCode ?? "").trim() || codeFromBatch,
        mixingCycleName: String(cycle.mixingCycleName ?? "").trim() || nameFromBatch,
        mixingCycleId: cycle.mixingCycleId ?? batchCycle.id ?? batchCycle.mixingCycleId ?? null,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchDetails?.mixingCycle?.mixingCycleCode, batchDetails?.mixingCycle?.motorStage]);

  // Load motor stages for Experimental dropdowns (once batchDetails is available)
  useEffect(() => {
    if (!isExperimental || !batchDetails) return;
    let cancelled = false;

    const loadStages = async () => {
      setMotorStagesLoading(true);
      try {
        const projectId = String(
          batchDetails?.projectId ?? batchDetails?.project?.projectId ?? "",
        ).trim();
        const stages = await fetchMotorStagesDeduped(projectId || undefined);
        if (!cancelled) setMotorStageOptions(stages);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch motor stages:", error);
          setMotorStageOptions([]);
        }
      } finally {
        if (!cancelled) setMotorStagesLoading(false);
      }
    };

    void loadStages();
    return () => {
      cancelled = true;
    };
  }, [isExperimental, batchDetails]);

  const fetchMixingCyclesForStage = useCallback(
    async (motorStage: string) => {
      const stage = String(motorStage ?? "").trim();
      if (!stage) return;

      if (mixingCycleOptionsByStage[stage]?.length || mixingCyclesLoadingByStage[stage]) return;

      setMixingCyclesLoadingByStage((prev) => ({ ...prev, [stage]: true }));
      try {
        const list = await fetchMixingCyclesForStageDeduped(stage);
        setMixingCycleOptionsByStage((prev) => ({ ...prev, [stage]: list }));
      } catch (error) {
        console.error("Failed to fetch mixing cycles:", error);
        setMixingCycleOptionsByStage((prev) => ({ ...prev, [stage]: [] }));
      } finally {
        setMixingCyclesLoadingByStage((prev) => ({ ...prev, [stage]: false }));
      }
    },
    [mixingCycleOptionsByStage, mixingCyclesLoadingByStage],
  );

  // Prefetch mixing cycles for stages already selected on Experimental cycles
  useEffect(() => {
    if (!isExperimental) return;
    const stages = Array.from(
      new Set(mixingCycles.map((cycle) => String(cycle.stage ?? "").trim()).filter(Boolean)),
    );
    stages.forEach((stage) => {
      if (mixingCycleOptionsByStage[stage]?.length || mixingCyclesLoadingByStage[stage]) return;

      const cached = mixingCyclesByStageCache.get(stage);
      if (cached) {
        setMixingCycleOptionsByStage((prev) =>
          prev[stage]?.length ? prev : { ...prev, [stage]: cached },
        );
        return;
      }

      void fetchMixingCyclesForStage(stage);
    });
  }, [
    isExperimental,
    mixingCycles,
    mixingCycleOptionsByStage,
    mixingCyclesLoadingByStage,
    fetchMixingCyclesForStage,
  ]);

  const applyMixingCycleDetails = useCallback(
    async (cycleIndex: number, mixingCycleCode: string, motorStage?: string) => {
      const code = String(mixingCycleCode ?? "").trim();
      if (!code) return;

      const currentCycles = normalizeSubscaleMixingCycles(
        valuesRef.current[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES],
      );
      const currentCycle = currentCycles[cycleIndex];
      if (hasMixingCycleParticulars(currentCycle)) return;

      const requestId = (mixingCycleDetailsRequestIdRef.current[cycleIndex] ?? 0) + 1;
      mixingCycleDetailsRequestIdRef.current[cycleIndex] = requestId;
      setMixingCycleDetailsLoadingByIndex((prev) => ({ ...prev, [cycleIndex]: true }));

      try {
        const resData = await fetchMixingCycleDetailsDeduped(code);
        if (mixingCycleDetailsRequestIdRef.current[cycleIndex] !== requestId) return;
        if (!resData || typeof resData !== "object") return;

        const { premixOperations, finalMixOperations } = resolveMixingCycleOperations(
          resData as Record<string, unknown>,
        );
        const next = currentCycles.map((cycle, index) => {
          if (index !== cycleIndex) return cycle;
          const currentPremix = cycle.premixParticulars || cycle.processParticulars || [];
          const currentFinal = cycle.finalMixParticulars || [];
          const cycleData = resData as Record<string, unknown>;
          return {
            ...cycle,
            stage:
              String(motorStage ?? cycle.stage ?? "").trim() ||
              String(cycleData.motorStage ?? "").trim(),
            mixingCycleCode: code,
            mixingCycleName:
              String(cycle.mixingCycleName ?? "").trim() ||
              String(cycleData.mixingCycleName ?? "").trim(),
            premixParticulars: mergeProcessParticularsWithOperations(
              premixOperations,
              currentPremix,
            ),
            finalMixParticulars: mergeProcessParticularsWithOperations(
              finalMixOperations,
              currentFinal,
            ),
          };
        });
        updateMixingCycles(next);
      } catch (error) {
        console.error("Failed to fetch mixing cycle details:", error);
      } finally {
        if (mixingCycleDetailsRequestIdRef.current[cycleIndex] === requestId) {
          setMixingCycleDetailsLoadingByIndex((prev) => ({ ...prev, [cycleIndex]: false }));
        }
      }
    },
    [updateMixingCycles],
  );

  // Qualification: load particulars from batch mixing cycle only when form has none yet
  useEffect(() => {
    if (isExperimental) return;

    const cycle = mixingCycles[0];
    if (hasMixingCycleParticulars(cycle)) return;

    const cycleCode = String(
      cycle?.mixingCycleCode ?? batchDetails?.mixingCycle?.mixingCycleCode ?? "",
    ).trim();
    if (!cycleCode) return;

    void applyMixingCycleDetails(
      0,
      cycleCode,
      String(cycle?.stage ?? batchDetails?.mixingCycle?.motorStage ?? ""),
    );
  }, [
    isExperimental,
    mixingCycles[0]?.mixingCycleCode,
    mixingCycles[0]?.premixParticulars?.length,
    mixingCycles[0]?.finalMixParticulars?.length,
    batchDetails?.mixingCycle?.mixingCycleCode,
    applyMixingCycleDetails,
  ]);

  // Experimental: load particulars when a cycle code is set but rows are still empty
  const mixingCycleFetchKey = mixingCycles
    .map(
      (cycle) =>
        `${cycle.mixingCycleCode ?? ""}:${hasMixingCycleParticulars(cycle) ? "loaded" : "pending"}`,
    )
    .join("|");

  useEffect(() => {
    if (!isExperimental) return;
    mixingCycles.forEach((cycle, index) => {
      const code = String(cycle.mixingCycleCode ?? "").trim();
      if (!code || hasMixingCycleParticulars(cycle)) return;
      void applyMixingCycleDetails(index, code, cycle.stage);
    });
  }, [isExperimental, mixingCycleFetchKey, applyMixingCycleDetails]);

  const handleMotorStageChange = (cycleIndex: number, motorStage: string) => {
    const stage = String(motorStage ?? "").trim();
    const next = mixingCycles.map((cycle, index) => {
      if (index !== cycleIndex) return cycle;
      return {
        ...cycle,
        stage,
        mixingCycleCode: "",
        mixingCycleName: "",
        mixingCycleId: null,
        premixParticulars: [],
        finalMixParticulars: [],
        processParticulars: [],
      };
    });
    updateMixingCycles(next);
    mixingCycleDetailsRequestIdRef.current[cycleIndex] =
      (mixingCycleDetailsRequestIdRef.current[cycleIndex] ?? 0) + 1;
    setMixingCycleDetailsLoadingByIndex((prev) => ({ ...prev, [cycleIndex]: false }));
    if (stage) void fetchMixingCyclesForStage(stage);
  };

  const handleMixingCycleChange = (cycleIndex: number, mixingCycleCode: string) => {
    const code = String(mixingCycleCode ?? "").trim();
    const stage = String(mixingCycles[cycleIndex]?.stage ?? "").trim();
    const options = mixingCycleOptionsByStage[stage] ?? [];
    const selected = options.find((item) => item.mixingCycleCode === code);

    const next = mixingCycles.map((cycle, index) => {
      if (index !== cycleIndex) return cycle;
      return {
        ...cycle,
        mixingCycleCode: code,
        mixingCycleName: selected?.mixingCycleName ?? "",
        mixingCycleId: selected?.mixingCycleId ?? null,
        premixParticulars: [],
        finalMixParticulars: [],
        processParticulars: [],
      };
    });
    updateMixingCycles(next);
    if (code) void applyMixingCycleDetails(cycleIndex, code, stage);
  };

  const updateProcessField = useCallback(
    (
      cycleIndex: number,
      sectionKey: "premixParticulars" | "finalMixParticulars",
      rowIndex: number,
      field: keyof ProcessParticularRow,
      raw: string,
    ) => {
      const currentCycles = mixingCyclesRef.current;
      const next = currentCycles.map((cycle, index) => {
        if (index !== cycleIndex) return cycle;
        const rows = (cycle[sectionKey] || []).map((row, rIndex) =>
          rIndex === rowIndex ? { ...row, [field]: raw } : row,
        );
        return { ...cycle, [sectionKey]: rows };
      });
      updateMixingCycles(next);
    },
    [updateMixingCycles],
  );

  const qualificationStageLabel = useMemo(() => {
    const stage = mixingCycles[0]?.stage || batchDetails?.mixingCycle?.motorStage;
    return stage !== undefined && stage !== null && String(stage).trim() !== ""
      ? `Motor Stage ${stage}`
      : "";
  }, [mixingCycles, batchDetails?.mixingCycle?.motorStage]);

  const qualificationCycleLabel = useMemo(() => {
    const fromCycle = mixingCycles[0];
    if (fromCycle?.mixingCycleCode || fromCycle?.mixingCycleName) {
      return formatMixingCycleLabel(fromCycle);
    }
    return formatMixingCycleLabel(batchDetails?.mixingCycle ?? {});
  }, [mixingCycles, batchDetails?.mixingCycle]);

  const renderParticularsTable = (
    title: string,
    rows: ProcessParticularRow[] = [],
    cycleIndex: number,
    sectionKey: "premixParticulars" | "finalMixParticulars",
  ) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.78rem",
          color: SUBSCALE_BRAND.text,
          mb: 1,
          letterSpacing: "0.01em",
        }}
      >
        {title}
      </Typography>
      <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 1.5, overflow: "hidden" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={uniformTableHeaderCellSx(SUBSCALE_BRAND.ssTable, SUBSCALE_BRAND.ssTableLight)}>
                {PROCESS_S.COL_OPERATION}
              </TableCell>
              <TableCell sx={{ ...uniformTableHeaderCellSx(SUBSCALE_BRAND.ssTable, SUBSCALE_BRAND.ssTableLight), width: "18%" }}>
                {PROCESS_S.COL_ROTATION}
              </TableCell>
              <TableCell sx={{ ...uniformTableHeaderCellSx(SUBSCALE_BRAND.ssTable, SUBSCALE_BRAND.ssTableLight), width: "18%" }}>
                {PROCESS_S.COL_TIME}
              </TableCell>
              <TableCell sx={{ ...uniformTableHeaderCellSx(SUBSCALE_BRAND.ssTable, SUBSCALE_BRAND.ssTableLight), width: "18%" }}>
                {PROCESS_S.COL_TEMP}
              </TableCell>
              <TableCell sx={{ ...uniformTableHeaderCellSx(SUBSCALE_BRAND.ssTable, SUBSCALE_BRAND.ssTableLight), width: "18%" }}>
                {PROCESS_S.COL_VACUUM}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={uniformTableBodyCellSx({ border: SUBSCALE_BRAND.border, text: SUBSCALE_BRAND.text })}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: SUBSCALE_BRAND.textSub,
                      py: 1.5,
                      textAlign: "center",
                    }}
                  >
                    {S.PROCESS_PARTICULARS_EMPTY}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <SubscaleProcessParticularRow
                  key={`${sectionKey}-${row.operationId}-${rowIndex}`}
                  row={row}
                  rowIndex={rowIndex}
                  cycleIndex={cycleIndex}
                  sectionKey={sectionKey}
                  onFieldChange={updateProcessField}
                  border={SUBSCALE_BRAND.border}
                  text={SUBSCALE_BRAND.text}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Stack spacing={3}>
      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{S.GENERAL_TITLE}</Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <FormInput
            disabled
            label={S.BATCH_SIZE}
            type="number"
            value={
              values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] ||
              batchDetails?.identificationSheet?.batchSize ||
              ""
            }
          />

          <FormInput
            disabled
            label="Mixer Type"
            value={values.mixerType || batchDetails?.identificationSheet?.mixerType || ""}
          />

          <FormInput
            disabled
            label={S.MIXER_BLDG_NO}
            value={
              values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] ||
              batchDetails?.identificationSheet?.BldgNo ||
              batchDetails?.identificationSheet?.bldgNo ||
              ""
            }
          />

          <DateField
            label={S.PREMIX_DATE}
            value={formatToUiDate(String(values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] ?? ""))}
            onChange={(next) => patchValues({ [SUBSCALE_BATCH_FIELDS.PREMIX_DATE]: next })}
            placeholder="DD-MM-YYYY"
          />

          <DateField
            label={S.FINAL_MIX_DATE}
            value={formatToUiDate(String(values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] ?? ""))}
            onChange={(next) => patchValues({ [SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE]: next })}
            placeholder="DD-MM-YYYY"
          />
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: SUBSCALE_BRAND.text }}>
                {S.MIXING_CYCLE_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: SUBSCALE_BRAND.textSub }}>
                {S.MIXING_CYCLE_HINT}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={2}>
            {mixingCycles.map((cycle, cycleIndex) => {
              const stage = String(cycle.stage ?? "").trim();
              const cycleOptions = mixingCycleOptionsByStage[stage] ?? [];
              const cyclesLoading = Boolean(mixingCyclesLoadingByStage[stage]);
              const particularsLoading = Boolean(mixingCycleDetailsLoadingByIndex[cycleIndex]);
              const mixingCyclePlaceholder = !stage
                ? S.MIXING_CYCLE_SELECT_STAGE_FIRST
                : cyclesLoading
                  ? S.MIXING_CYCLES_LOADING
                  : S.MIXING_CYCLE_SELECT_PLACEHOLDER;

              return (
                <Box
                  key={cycle._key || cycleIndex}
                  sx={{
                    border: `1px solid ${SUBSCALE_BRAND.border}`,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1.5, py: 1, background: "rgba(21,101,192,0.06)" }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, fontSize: "0.78rem", color: SUBSCALE_BRAND.text }}
                    >
                      {cycle.mixingCycleName
                        ? cycle.mixingCycleName
                        : batchDetails?.mixingCycle?.mixingCycleName
                          ? batchDetails.mixingCycle.mixingCycleName
                          : S.MIXING_CYCLE_TITLE}
                    </Typography>
                  </Stack>

                  <Box sx={{ p: 1.5 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                      {isExperimental ? (
                        <>
                          <FormInput
                            select
                            label={S.MIXING_CYCLE_STAGE}
                            value={stage}
                            onChange={(event) =>
                              handleMotorStageChange(cycleIndex, event.target.value)
                            }
                            SelectProps={{ displayEmpty: true, MenuProps: appDropdownMenuProps }}
                            sx={{ flex: 1 }}
                            disabled={motorStagesLoading}
                          >
                            <MenuItem value="">
                              <em
                                style={
                                  {
                                    ...appDropdownPlaceholderSx,
                                    fontStyle: "normal",
                                  } as CSSProperties
                                }
                              >
                                {motorStagesLoading
                                  ? S.MOTOR_STAGES_LOADING
                                  : S.MIXING_CYCLE_STAGE_PLACEHOLDER}
                              </em>
                            </MenuItem>
                            {motorStageOptions.map((option) => (
                              <MenuItem
                                key={option.motorStage}
                                value={option.motorStage}
                                sx={{ fontSize: APP_CONTROL_FONT_SIZE }}
                              >
                                Stage {option.motorStage}
                              </MenuItem>
                            ))}
                          </FormInput>

                          <FormInput
                            select
                            label={S.MIXING_CYCLE_SELECT_LABEL}
                            value={cycle.mixingCycleCode ?? ""}
                            onChange={(event) =>
                              handleMixingCycleChange(cycleIndex, event.target.value)
                            }
                            SelectProps={{ displayEmpty: true, MenuProps: appDropdownMenuProps }}
                            sx={{ flex: 1 }}
                            disabled={!stage || cyclesLoading || cycleOptions.length === 0}
                          >
                            <MenuItem value="">
                              <em
                                style={
                                  {
                                    ...appDropdownPlaceholderSx,
                                    fontStyle: "normal",
                                  } as CSSProperties
                                }
                              >
                                {mixingCyclePlaceholder}
                              </em>
                            </MenuItem>
                            {cycleOptions.map((option) => (
                              <MenuItem
                                key={`${option.mixingCycleId}-${option.mixingCycleCode}`}
                                value={option.mixingCycleCode}
                                sx={{ fontSize: APP_CONTROL_FONT_SIZE }}
                              >
                                {formatMixingCycleLabel(option)}
                              </MenuItem>
                            ))}
                          </FormInput>
                        </>
                      ) : (
                        <>
                          <FormInput
                            disabled
                            label={S.MIXING_CYCLE_STAGE}
                            value={
                              cycle.stage ? `Motor Stage ${cycle.stage}` : qualificationStageLabel
                            }
                            sx={{ flex: 1 }}
                          />
                          <FormInput
                            disabled
                            label={S.MIXING_CYCLE_SELECT_LABEL}
                            value={formatMixingCycleLabel(cycle) || qualificationCycleLabel}
                            sx={{ flex: 1 }}
                          />
                        </>
                      )}
                    </Stack>

                    {particularsLoading ? (
                      <Box
                        sx={{
                          minHeight: 220,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1.5,
                          borderRadius: 1.5,
                          border: `1px solid ${SUBSCALE_BRAND.border}`,
                          background: "rgba(21,101,192,0.04)",
                        }}
                      >
                        <CircularProgress size={36} sx={{ color: SUBSCALE_BRAND.ss }} />
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: SUBSCALE_BRAND.text,
                          }}
                        >
                          {S.PROCESS_PARTICULARS_LOADING}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {renderParticularsTable(
                          "Premix Cycle Process Particulars",
                          cycle.premixParticulars || cycle.processParticulars || [],
                          cycleIndex,
                          "premixParticulars",
                        )}

                        {renderParticularsTable(
                          "Final Mix Cycle Process Particulars",
                          cycle.finalMixParticulars || [],
                          cycleIndex,
                          "finalMixParticulars",
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
};

export default React.memo(SubscaleSubscaleBatchPanel);

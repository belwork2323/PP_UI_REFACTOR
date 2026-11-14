import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  applyMandrelFormulas,
  createEmptyBowlDetailRow,
  createEmptyCastingFromBowlRow,
  createEmptyFeedPipeDistanceRow,
  createEmptyMandrelMeasurementRow,
  createEmptyMotorCasingInstance,
  createEmptyPostCastTable,
  createEmptySlurryCastRow,
  syncSlurryCastTotalRow,
  type CastingBowlDetailRow,
  type CastingFromBowlRow,
  type CastingMotorCasingInstance,
  type CastingMotorData,
  type FeedPipeDistanceRow,
  type MandrelMeasurementRow,
  type PostCastRow,
  type SlurryCastRow,
} from "../../../../../data/models/user/CastingMotorDataModel";
import { DateTimeField } from "../../../../components/common/DateField";
import { toUiTime } from "../../../../../data/models/user/castingCuringFieldCodec";
import { isStartAfterEnd } from "../../../../../data/validation/dateRangeValidation";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import CasePrepTextField from "../CasePreparation/CasePrepTextField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  SubsectionHeading,
  TableSelectInput,
  TableTextInput,
  castingCuringTableCellSx,
  castingCuringTableContainerSx,
  castingCuringTableHeaderCellSx,
  castingCuringTableInputSx,
  castingCuringTableRowSx,
} from "./CastingCuringFormPrimitives";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

type BowlSeedRow = {
  premixNo?: string | number;
  bowlId?: string;
  label?: string;
};

type Props = {
  value: CastingMotorData;
  onChange: (next: CastingMotorData) => void;
  motorId: string;
  batchId?: string;
  /** Premix/bowl rows from identification sheet mixing metadata for FINAL_MIX stage */
  bowlSeedRows?: BowlSeedRow[];
  excludedBowlLabels?: string[];
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
};

const BRAND = CASTING_CURING_BRAND;

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const formatBowlLabel = (seed: BowlSeedRow): string => {
  const explicit = str(seed.label).trim();
  if (explicit) return explicit;
  const premixNo = str(seed.premixNo).trim();
  const bowlId = str(seed.bowlId).trim();
  if (!premixNo && !bowlId) return "";
  return `FINAL_MIX ${premixNo} / ${bowlId}`.replace(/\s*\/\s*$/, "").trim();
};

const parseBowlLabel = (label: string): { premixNo: string; bowlNo: string } => {
  const match = /^FINAL_MIX\s+(\S+)\s+\/\s*(.+)$/i.exec(str(label).trim());
  return {
    premixNo: match?.[1] ?? "",
    bowlNo: match?.[2] ?? "",
  };
};

const isSlurryTotalRow = (row: SlurryCastRow): boolean =>
  str(row.ROW_KEY).trim().toUpperCase() === "TOTAL" ||
  str(row.FM_MOTOR_LABEL).trim().toLowerCase() === "total slurry cast" ||
  row.readonly === true;

const BOWL_ID_PLACEHOLDER = "Select bowl id";

const CompactDateTime = ({
  value,
  onChange,
  minDate,
  requiresMinDateTime = false,
  disabled,
  readOnly,
  fieldPath,
  error,
  helperText,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  requiresMinDateTime?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  fieldPath?: string;
  error?: boolean;
  helperText?: string | null;
  required?: boolean;
}) => {
  const isTimeOnly = /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim());

  return (
    <Box {...(fieldPath ? { "data-cc-field": fieldPath } : {})}>
      {isTimeOnly && !readOnly ? (
        <TextField
          size="small"
          fullWidth
          value={toUiTime(value)}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required={required}
          error={error}
          helperText={helperText}
          placeholder="HH:mm"
          inputProps={{ readOnly }}
          sx={castingCuringTableInputSx}
        />
      ) : (
        <DateTimeField
          value={value}
          minDate={minDate}
          requiresMinDateTime={requiresMinDateTime}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          compact
          placeholder="DD-MM-YYYY HH:mm"
          inputSx={castingCuringTableInputSx}
          error={error}
          helperText={helperText}
          required={required}
        />
      )}
    </Box>
  );
};

const ValueByFieldType = ({
  value,
  fieldType,
  onChange,
  disabled,
  readOnly,
  fieldPath,
  error,
  helperText,
}: {
  value: string;
  fieldType?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fieldPath?: string;
  error?: boolean;
  helperText?: string | null;
}) => {
  const type = String(fieldType ?? "text").toLowerCase();
  if (type === "datetime") {
    return (
      <CompactDateTime
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        fieldPath={fieldPath}
        error={error}
        helperText={helperText}
      />
    );
  }
  if (type === "number") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        type="number"
        placeholder="0"
        fieldPath={fieldPath}
        error={error}
        helperText={helperText}
      />
    );
  }
  if (type === "textarea") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        multiline
        minRows={2}
        placeholder="Enter value"
        fieldPath={fieldPath}
        error={error}
        helperText={helperText}
      />
    );
  }
  return (
    <TableTextInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      placeholder="Enter value"
      fieldPath={fieldPath}
      error={error}
      helperText={helperText}
    />
  );
};

const groupHeaderSx = {
  ...castingCuringTableHeaderCellSx(false),
  textAlign: "center" as const,
  borderLeft: `1px solid ${BRAND.border}`,
};

const CastingMotorPanel = ({
  value,
  onChange,
  motorId,
  batchId: _batchId,
  bowlSeedRows,
  excludedBowlLabels,
  disabled = false,
  readOnly = false,
  theme,
  validationErrors,
  clearFieldError,
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  const patchRoot = (partial: Partial<CastingMotorData>) => {
    const current = valueRef.current;
    onChangeRef.current({ ...current, ...partial });
  };

  const patchCastingProcess = (partial: Partial<CastingMotorData["CASTING_PROCESS"]>) => {
    const current = valueRef.current;
    onChangeRef.current({
      ...current,
      CASTING_PROCESS: {
        ...current.CASTING_PROCESS,
        ...partial,
      },
    });
  };

  const bowlChoices = useMemo(() => {
    const seen = new Set<string>();
    return (bowlSeedRows ?? [])
      .map((seed) => formatBowlLabel(seed))
      .filter((label) => {
        const key = label.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((label) => ({ value: label, label }));
  }, [bowlSeedRows]);

  const bowlOptionsForRow = (selected: string, usedInTable: string[]) => {
    // Exclude bowls used elsewhere if needed, but allow re-selection of the current row's value
    const used = new Set(
      (usedInTable ?? []).map((label) => str(label).trim().toLowerCase()).filter(Boolean),
    );
    const selectedKey = str(selected).trim().toLowerCase();

    // Filter out options already used in *this same table*, except the one currently selected in this row
    const options = bowlChoices.filter(
      (option) =>
        option.value.toLowerCase() === selectedKey || !used.has(option.value.toLowerCase()),
    );

    if (selected && !options.some((option) => option.value.toLowerCase() === selectedKey)) {
      return [{ value: selected, label: selected }, ...options];
    }
    return options;
  };

  // Keep MOTOR_ID on casting-from-bowl rows in sync with prop
  useEffect(() => {
    const rows = valueRef.current.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? [];
    if (!rows.length) return;
    const needsSync = rows.some((row) => str(row.MOTOR_ID).trim() !== str(motorId).trim());
    if (!needsSync) return;
    onChangeRef.current({
      ...valueRef.current,
      CASTING_PROCESS: {
        ...valueRef.current.CASTING_PROCESS,
        CASTING_FROM_BOWL_DETAILS: rows.map((row) => ({ ...row, MOTOR_ID: motorId })),
      },
    });
  }, [motorId]);

  // Ensure post-cast presets exist
  useEffect(() => {
    const rows = valueRef.current.POST_CAST_OPERATIONS.POST_CAST_TABLE ?? [];
    if (rows.length) return;
    onChangeRef.current({
      ...valueRef.current,
      POST_CAST_OPERATIONS: {
        POST_CAST_TABLE: createEmptyPostCastTable(),
      },
    });
  }, []);

  const updateMotorCasing = (patch: Partial<CastingMotorCasingInstance>) => {
    const casing =
      value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    clearFieldError?.(
      `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.EMPTY_MOTOR_WEIGHT`,
    );
    clearFieldError?.(`FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.VACUUM_APPLIED`);

    patchRoot({
      FINAL_ASSEMBLY_DETAILS: {
        motorCasing: [{ ...casing, ...patch }],
      },
    });
  };

  const updateMandrelRow = (rowIndex: number, patch: Partial<MandrelMeasurementRow>) => {
    const casing =
      value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const rows = casing.MANDREL_MEASUREMENTS.map((row, i) => {
      if (i !== rowIndex) return row;
      return applyMandrelFormulas({ ...row, ...patch });
    });
    updateMotorCasing({ MANDREL_MEASUREMENTS: rows });
  };

  const addMandrelRow = () => {
    const casing =
      value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const nextNo = casing.MANDREL_MEASUREMENTS.length + 1;
    updateMotorCasing({
      MANDREL_MEASUREMENTS: [
        ...casing.MANDREL_MEASUREMENTS,
        createEmptyMandrelMeasurementRow(nextNo),
      ],
    });
  };

  const deleteMandrelRow = (rowIndex: number) => {
    const casing =
      value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    if (casing.MANDREL_MEASUREMENTS.length <= 1) return;
    updateMotorCasing({
      MANDREL_MEASUREMENTS: casing.MANDREL_MEASUREMENTS.filter((_, i) => i !== rowIndex).map(
        (row, i) => ({ ...row, srNo: String(i + 1) }),
      ),
    });
  };

  const updateFeedPipe = (patch: Partial<FeedPipeDistanceRow>) => {
    const casing =
      value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const existing = casing.FEED_PIPE_DISTANCE[0] ?? createEmptyFeedPipeDistanceRow();
    const next = { ...existing, ...patch };
    // clear validation for feed readings
    clearFieldError?.(`FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_1`);
    clearFieldError?.(`FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_2`);
    updateMotorCasing({ FEED_PIPE_DISTANCE: [next] });
  };

  const updateBowlDetail = (index: number, patch: Partial<CastingBowlDetailRow>) => {
    const rows = value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.map((row, i) => {
      if (i !== index) return row;
      const nextRow = { ...row, ...patch };
      if (
        patch.DC_OPEN_TIME !== undefined &&
        (!nextRow.DC_OPEN_TIME.trim() ||
          isStartAfterEnd(nextRow.DC_OPEN_TIME, nextRow.DC_CLOSE_TIME))
      ) {
        nextRow.DC_CLOSE_TIME = "";
        clearFieldError?.(`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_CLOSE_TIME`);
      }
      return nextRow;
    });
    patchCastingProcess({ FINAL_MIX_BOWL_DETAILS: rows });
  };

  const selectBowlDetail = (index: number, label: string) => {
    const parsed = parseBowlLabel(label);
    updateBowlDetail(index, {
      BOWL_ID: label,
      PREMIX_NO: parsed.premixNo,
      BOWL_NO: parsed.bowlNo,
    });
  };

  const addBowlDetailRow = () => {
    patchCastingProcess({
      FINAL_MIX_BOWL_DETAILS: [
        ...(value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? []),
        createEmptyBowlDetailRow(),
      ],
    });
  };

  const deleteBowlDetailRow = (index: number) => {
    const current = value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? [];
    if (current.length <= 1) return;
    patchCastingProcess({
      FINAL_MIX_BOWL_DETAILS: current.filter((_, i) => i !== index),
    });
  };

  const updateCastingFromBowl = (index: number, patch: Partial<CastingFromBowlRow>) => {
    const rows = value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchCastingProcess({ CASTING_FROM_BOWL_DETAILS: rows });
  };

  const selectCastingFromBowl = (index: number, label: string) => {
    const parsed = parseBowlLabel(label);
    updateCastingFromBowl(index, {
      BOWL_ID: label,
      PREMIX_NO: parsed.premixNo,
      BOWL_NO: parsed.bowlNo,
      MOTOR_ID: motorId,
    });
  };

  const addCastingFromBowlRow = () => {
    patchCastingProcess({
      CASTING_FROM_BOWL_DETAILS: [
        ...(value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? []),
        { ...createEmptyCastingFromBowlRow(), MOTOR_ID: motorId },
      ],
    });
  };

  const deleteCastingFromBowlRow = (index: number) => {
    const current = value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? [];
    if (current.length <= 1) return;
    patchCastingProcess({
      CASTING_FROM_BOWL_DETAILS: current.filter((_, i) => i !== index),
    });
  };

  const updateSlurryCast = (index: number, patch: Partial<SlurryCastRow>) => {
    const rows = value.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchRoot({
      SLURRY_CAST_DETAILS: {
        SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow(rows),
      },
    });
  };

  const selectSlurryBowl = (index: number, label: string) => {
    const parsed = parseBowlLabel(label);
    updateSlurryCast(index, {
      FM_MOTOR_LABEL: label,
      PREMIX_NO: parsed.premixNo,
      BOWL_NO: parsed.bowlNo,
      ROW_KEY: label ? `${parsed.premixNo}:${parsed.bowlNo}` : "",
    });
  };

  const addSlurryRow = () => {
    const rows = value.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? [];
    const dataRows = rows.filter((row) => !isSlurryTotalRow(row));
    patchRoot({
      SLURRY_CAST_DETAILS: {
        SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow([...dataRows, createEmptySlurryCastRow()]),
      },
    });
  };

  const deleteSlurryRow = (index: number) => {
    const rows = value.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? [];
    const target = rows[index];
    if (!target || isSlurryTotalRow(target)) return;
    const dataRows = rows.filter((row, i) => i !== index && !isSlurryTotalRow(row));
    if (!dataRows.length) return;
    patchRoot({
      SLURRY_CAST_DETAILS: {
        SLURRY_CAST_FROM_BOWLS: syncSlurryCastTotalRow(dataRows),
      },
    });
  };

  const updatePostCast = (index: number, patch: Partial<PostCastRow>) => {
    const rows = value.POST_CAST_OPERATIONS.POST_CAST_TABLE.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchRoot({
      POST_CAST_OPERATIONS: { POST_CAST_TABLE: rows },
    });
  };

  const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
  const feed = casing.FEED_PIPE_DISTANCE[0] ?? createEmptyFeedPipeDistanceRow();
  const mixBowlRows = value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? [];
  const castingBowlRows = value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? [];
  const slurryRows = value.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? [];
  const usedMixBowlIds = mixBowlRows.map((row) => row.BOWL_ID);
  const usedCastingBowlIds = castingBowlRows.map((row) => row.BOWL_ID);

  const addRowButton = (onClick: () => void) =>
    !disabled && !readOnly ? (
      <Typography
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          border: 0,
          background: "transparent",
          cursor: "pointer",
          color: BRAND.cc,
          fontSize: "0.72rem",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          p: 0,
        }}
      >
        <AddRoundedIcon sx={{ fontSize: 16 }} />
        Add row
      </Typography>
    ) : null;

  const renderMandrelTable = () => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <SubsectionHeading>Distance between centering top to mandrel top (mm)</SubsectionHeading>
        {!disabled && !readOnly ? (
          <Typography
            component="button"
            type="button"
            onClick={addMandrelRow}
            sx={{
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: BRAND.cc,
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              p: 0,
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 16 }} />
            Add row
          </Typography>
        ) : null}
      </Stack>
      <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{ ...castingCuringTableHeaderCellSx(true), verticalAlign: "middle" }}
              >
                Sr. No.
              </TableCell>
              <TableCell colSpan={1} sx={groupHeaderSx}>
                Mandrel rest on dome of motor (A)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Mandrel rest on bottom cup with required no of gaskets (B)
                {/* Mandrel rest on bottom cup (with Teflon sleeve) (B) */}
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Difference C=(A-B)
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ ...groupHeaderSx, verticalAlign: "middle", maxWidth: "auto" }}
              >
                <FieldLabelWithAsterisk
                  label="Bellow thickness (D)"
                  required
                  sx={castingCuringTableHeaderCellSx(false)}
                />
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Mandrel lift E=(C-D)
              </TableCell>
              <TableCell rowSpan={2} sx={{ ...castingCuringTableHeaderCellSx(false), width: 48 }} />
            </TableRow>
            <TableRow>
              {[
                "Mock assy.",
                "Mock assy.",
                "Final assy.",
                "Mock assy.",
                "Final assy.",
                "Mock assy.",
                "Final assy.",
              ].map((label, idx) => (
                <TableCell key={`sub-${idx}`} sx={castingCuringTableHeaderCellSx(false)}>
                  <FieldLabelWithAsterisk
                    label={label}
                    required
                    sx={castingCuringTableHeaderCellSx(false)}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {casing.MANDREL_MEASUREMENTS.map((row, rowIndex) => (
              <TableRow key={`mandrel-${rowIndex}`} sx={castingCuringTableRowSx(rowIndex)}>
                <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                  {row.srNo || rowIndex + 1}
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.A_MOCK}
                    onChange={(v) => {
                      clearFieldError?.(
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.A_MOCK`,
                      );
                      updateMandrelRow(rowIndex, { A_MOCK: v });
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number"
                    required
                    fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.A_MOCK`}
                    error={Boolean(
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.A_MOCK`
                      ],
                    )}
                    helperText={
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.A_MOCK`
                      ]
                    }
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_MOCK}
                    onChange={(v) => {
                      clearFieldError?.(
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_MOCK`,
                      );
                      updateMandrelRow(rowIndex, { B_MOCK: v });
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number"
                    required
                    fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_MOCK`}
                    error={Boolean(
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_MOCK`
                      ],
                    )}
                    helperText={
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_MOCK`
                      ]
                    }
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_FINAL}
                    onChange={(v) => {
                      clearFieldError?.(
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_FINAL`,
                      );
                      updateMandrelRow(rowIndex, { B_FINAL: v });
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number"
                    required
                    fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_FINAL`}
                    error={Boolean(
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_FINAL`
                      ],
                    )}
                    helperText={
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.B_FINAL`
                      ]
                    }
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                    {row.C_MOCK || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                    {row.C_FINAL || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.BELLOWS_THICKNESS_D}
                    onChange={(v) => {
                      clearFieldError?.(
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.BELLOWS_THICKNESS_D`,
                      );
                      updateMandrelRow(rowIndex, { BELLOWS_THICKNESS_D: v });
                    }}
                    disabled={disabled}
                    readOnly={readOnly}
                    type="number"
                    required
                    fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.BELLOWS_THICKNESS_D`}
                    error={Boolean(
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.BELLOWS_THICKNESS_D`
                      ],
                    )}
                    helperText={
                      validationErrors?.[
                        `FINAL_ASSEMBLY_DETAILS.motorCasing.0.MANDREL_MEASUREMENTS.${rowIndex}.BELLOWS_THICKNESS_D`
                      ]
                    }
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                    {row.E_MOCK || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                    {row.E_FINAL || "—"}
                  </Typography>
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  {!disabled && !readOnly && casing.MANDREL_MEASUREMENTS.length > 1 ? (
                    <IconButton
                      size="small"
                      onClick={() => deleteMandrelRow(rowIndex)}
                      aria-label="Delete mandrel row"
                      sx={{ color: BRAND.danger }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      {/* Section A */}
      <SectionCard title="Section A: Final Assembly Details" theme={theme}>
        {renderMandrelTable()}

        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>
            Observations / remarks between feed pipe & cone apex
            {/* Measurement of distance between feed pipe & cone apex */}
          </SubsectionHeading>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabelWithAsterisk label="Reading 1 (mm)" required />
              <TableTextInput
                value={feed.READING_1}
                onChange={(v) => updateFeedPipe({ READING_1: v })}
                disabled={disabled}
                readOnly={readOnly}
                type="number"
                placeholder="0"
                fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_1`}
                error={Boolean(
                  validationErrors?.[
                    `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_1`
                  ],
                )}
                helperText={
                  validationErrors?.[
                    `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_1`
                  ]
                }
              />
            </Box>
            <Box>
              <FieldLabelWithAsterisk label="Reading 2 (mm)" required />
              <TableTextInput
                value={feed.READING_2}
                onChange={(v) => updateFeedPipe({ READING_2: v })}
                disabled={disabled}
                readOnly={readOnly}
                type="number"
                placeholder="0"
                fieldPath={`FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_2`}
                error={Boolean(
                  validationErrors?.[
                    `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_2`
                  ],
                )}
                helperText={
                  validationErrors?.[
                    `FINAL_ASSEMBLY_DETAILS.motorCasing.0.FEED_PIPE_DISTANCE.0.READING_2`
                  ]
                }
              />
            </Box>
          </FieldGrid>
        </Box>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabelWithAsterisk label="Weight of assembled empty motor casing (kg)" required />
            <TableTextInput
              value={casing.EMPTY_MOTOR_WEIGHT}
              onChange={(v) => {
                clearFieldError?.(`FINAL_ASSEMBLY_DETAILS.motorCasing.0.EMPTY_MOTOR_WEIGHT`);
                updateMotorCasing({ EMPTY_MOTOR_WEIGHT: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="0"
              required
              error={Boolean(
                validationErrors?.[`FINAL_ASSEMBLY_DETAILS.motorCasing.0.EMPTY_MOTOR_WEIGHT`],
              )}
              helperText={
                validationErrors?.[`FINAL_ASSEMBLY_DETAILS.motorCasing.0.EMPTY_MOTOR_WEIGHT`]
              }
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Vacuum Applied (overnight)" required />
            <TableTextInput
              value={casing.VACUUM_APPLIED}
              onChange={(v) => {
                clearFieldError?.(`FINAL_ASSEMBLY_DETAILS.motorCasing.0.VACUUM_APPLIED`);
                updateMotorCasing({ VACUUM_APPLIED: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              required
              error={Boolean(
                validationErrors?.[`FINAL_ASSEMBLY_DETAILS.motorCasing.0.VACUUM_APPLIED`],
              )}
              helperText={validationErrors?.[`FINAL_ASSEMBLY_DETAILS.motorCasing.0.VACUUM_APPLIED`]}
            />
          </Box>
        </FieldGrid>
      </SectionCard>

      {/* Section B */}
      <SectionCard title="Section B: Casting Process" theme={theme}>
        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <SubsectionHeading>Final Mix Bowl Details</SubsectionHeading>
            {addRowButton(addBowlDetailRow)}
          </Stack>
          <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  {[
                    { label: "Bowl Id", required: true },
                    { label: "Bowl Receipt Date & Time", required: true },
                    { label: "Initial Weight", required: true },
                    { label: "Final Weight", required: true },
                    { label: "Initial Slurry Depth", required: false },
                    { label: "Bowl D/C Valve Opening Date & Time", required: true },
                    { label: "Bowl D/C Valve Closing Date & Time", required: true },
                    { label: "Depth of Slurry after Opening of D/C Valve", required: true },
                    { label: "Ball Valve Opening Date & Time", required: true },
                    { label: "", required: false },
                  ].map((col, idx) => (
                    <TableCell
                      key={`${col.label}-${idx}`}
                      sx={castingCuringTableHeaderCellSx(idx === 0)}
                    >
                      {col.required ? (
                        <FieldLabelWithAsterisk
                          label={col.label}
                          required
                          sx={castingCuringTableHeaderCellSx(idx === 0)}
                        />
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(mixBowlRows.length ? mixBowlRows : [createEmptyBowlDetailRow()]).map(
                  (row, index) => (
                    <TableRow key={`bowl-${index}`} sx={castingCuringTableRowSx(index)}>
                      <TableCell sx={{ ...castingCuringTableCellSx, minWidth: 240 }}>
                        <TableSelectInput
                          value={row.BOWL_ID}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_ID`,
                            );
                            selectBowlDetail(index, v);
                          }}
                          options={bowlOptionsForRow(
                            row.BOWL_ID,
                            usedMixBowlIds.filter((_, i) => i !== index),
                          )}
                          placeholder={BOWL_ID_PLACEHOLDER}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_ID`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_ID`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_ID`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactDateTime
                          value={row.BOWL_RECEIPT_TIME}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_RECEIPT_TIME`,
                            );
                            updateBowlDetail(index, { BOWL_RECEIPT_TIME: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_RECEIPT_TIME`}
                          required
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_RECEIPT_TIME`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BOWL_RECEIPT_TIME`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.INITIAL_WEIGHT}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_WEIGHT`,
                            );
                            updateBowlDetail(index, { INITIAL_WEIGHT: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_WEIGHT`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_WEIGHT`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_WEIGHT`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.FINAL_WEIGHT}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.FINAL_WEIGHT`,
                            );
                            updateBowlDetail(index, { FINAL_WEIGHT: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.FINAL_WEIGHT`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.FINAL_WEIGHT`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.FINAL_WEIGHT`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.INITIAL_SLURRY_DEPTH}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_SLURRY_DEPTH`,
                            );
                            updateBowlDetail(index, { INITIAL_SLURRY_DEPTH: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          // error={Boolean(
                          //   validationErrors?.[
                          //     `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_SLURRY_DEPTH`
                          //   ],
                          // )}
                          // helperText={
                          //   validationErrors?.[
                          //     `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.INITIAL_SLURRY_DEPTH`
                          //   ]
                          // }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactDateTime
                          value={row.DC_OPEN_TIME}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_OPEN_TIME`,
                            );
                            updateBowlDetail(index, { DC_OPEN_TIME: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_OPEN_TIME`}
                          required
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_OPEN_TIME`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_OPEN_TIME`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactDateTime
                          value={row.DC_CLOSE_TIME}
                          minDate={row.DC_OPEN_TIME}
                          requiresMinDateTime
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_CLOSE_TIME`,
                            );
                            updateBowlDetail(index, { DC_CLOSE_TIME: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_CLOSE_TIME`}
                          required
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_CLOSE_TIME`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.DC_CLOSE_TIME`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_DEPTH_AFTER_DC}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.SLURRY_DEPTH_AFTER_DC`,
                            );
                            updateBowlDetail(index, { SLURRY_DEPTH_AFTER_DC: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.SLURRY_DEPTH_AFTER_DC`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.SLURRY_DEPTH_AFTER_DC`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.SLURRY_DEPTH_AFTER_DC`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactDateTime
                          value={row.BALL_VALVE_OPEN_TIME}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BALL_VALVE_OPEN_TIME`,
                            );
                            updateBowlDetail(index, { BALL_VALVE_OPEN_TIME: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BALL_VALVE_OPEN_TIME`}
                          required
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BALL_VALVE_OPEN_TIME`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.${index}.BALL_VALVE_OPEN_TIME`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        {!disabled && !readOnly && mixBowlRows.length > 1 ? (
                          <IconButton
                            size="small"
                            onClick={() => deleteBowlDetailRow(index)}
                            aria-label="Delete bowl row"
                            sx={{ color: BRAND.danger }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <SubsectionHeading>Casting From Bowl Details</SubsectionHeading>
            {addRowButton(addCastingFromBowlRow)}
          </Stack>
          <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  {[
                    { label: "Bowl Id", required: true },
                    { label: "Time", required: true },
                    { label: "RH (%)", required: true },
                    { label: "Viscosity (Poise)", required: false },
                    { label: "Motor Id No.", required: true },
                    { label: "Slurry Depth (cm)", required: false },
                    { label: "Slurry Cast (kg)", required: true },
                    { label: "Flow Rate (kg/min)", required: true },
                    { label: "Valve Opening (%)", required: true },
                    { label: "Vacuum Level (torr)", required: true },
                    { label: "", required: false },
                  ].map((col, idx) => (
                    <TableCell
                      key={`${col.label}-${idx}`}
                      sx={castingCuringTableHeaderCellSx(idx === 0)}
                    >
                      {col.required ? (
                        <FieldLabelWithAsterisk
                          label={col.label}
                          required
                          sx={castingCuringTableHeaderCellSx(idx === 0)}
                        />
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(castingBowlRows.length ? castingBowlRows : [createEmptyCastingFromBowlRow()]).map(
                  (row, index) => (
                    <TableRow key={`cast-bowl-${index}`} sx={castingCuringTableRowSx(index)}>
                      <TableCell sx={{ ...castingCuringTableCellSx, minWidth: 240 }}>
                        <TableSelectInput
                          value={row.BOWL_ID}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.BOWL_ID`,
                            );
                            selectCastingFromBowl(index, v);
                          }}
                          options={bowlOptionsForRow(
                            row.BOWL_ID,
                            usedCastingBowlIds.filter((_, i) => i !== index),
                          )}
                          placeholder={BOWL_ID_PLACEHOLDER}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.BOWL_ID`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.BOWL_ID`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.BOWL_ID`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <DateTimeField
                          value={row.TIME_INTERVAL}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.TIME_INTERVAL`,
                            );
                            updateCastingFromBowl(index, { TIME_INTERVAL: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.TIME_INTERVAL`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.TIME_INTERVAL`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.RH}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.RH`,
                            );
                            updateCastingFromBowl(index, { RH: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.RH`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.RH`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.RH`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VISCOSITY}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VISCOSITY`,
                            );
                            updateCastingFromBowl(index, { VISCOSITY: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VISCOSITY`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VISCOSITY`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VISCOSITY`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                        {row.MOTOR_ID || motorId || "—"}
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_DEPTH}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_DEPTH`,
                            );
                            updateCastingFromBowl(index, { SLURRY_DEPTH: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_DEPTH`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_DEPTH`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_DEPTH`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_CAST}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_CAST`,
                            );
                            updateCastingFromBowl(index, { SLURRY_CAST: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_CAST`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_CAST`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.SLURRY_CAST`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.FLOW_RATE}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.FLOW_RATE`,
                            );
                            updateCastingFromBowl(index, { FLOW_RATE: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.FLOW_RATE`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.FLOW_RATE`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.FLOW_RATE`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VALVE_OPENING}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VALVE_OPENING`,
                            );
                            updateCastingFromBowl(index, { VALVE_OPENING: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VALVE_OPENING`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VALVE_OPENING`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VALVE_OPENING`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VACUUM_LEVEL}
                          onChange={(v) => {
                            clearFieldError?.(
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VACUUM_LEVEL`,
                            );
                            updateCastingFromBowl(index, { VACUUM_LEVEL: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VACUUM_LEVEL`}
                          error={Boolean(
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VACUUM_LEVEL`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.${index}.VACUUM_LEVEL`
                            ]
                          }
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        {!disabled && !readOnly && castingBowlRows.length > 1 ? (
                          <IconButton
                            size="small"
                            onClick={() => deleteCastingFromBowlRow(index)}
                            aria-label="Delete casting bowl row"
                            sx={{ color: BRAND.danger }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <FieldGrid columns={4}>
          <Box>
            <FieldLabelWithAsterisk label="Initial Vacuum" required />
            <TableTextInput
              value={value.CASTING_PROCESS.INITIAL_VACUUM}
              onChange={(e: any) => {
                const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                patchCastingProcess({ INITIAL_VACUUM: val });
                clearFieldError?.(`CASTING_PROCESS.INITIAL_VACUUM`);
              }}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="Enter value"
              error={Boolean(validationErrors?.[`CASTING_PROCESS.INITIAL_VACUUM`])}
              helperText={validationErrors?.[`CASTING_PROCESS.INITIAL_VACUUM`]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Vacuum Pressure Created for Casting" required />
            <TableTextInput
              value={value.CASTING_PROCESS.VACUUM_PRESSURE_CASTING}
              onChange={(e: any) => {
                const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                patchCastingProcess({ VACUUM_PRESSURE_CASTING: val });
                clearFieldError?.(`CASTING_PROCESS.VACUUM_PRESSURE_CASTING`);
              }}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="Enter value"
              error={Boolean(validationErrors?.[`CASTING_PROCESS.VACUUM_PRESSURE_CASTING`])}
              helperText={validationErrors?.[`CASTING_PROCESS.VACUUM_PRESSURE_CASTING`]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Vacuum Pressure Created for Soaking" required />
            <TableTextInput
              value={value.CASTING_PROCESS.VACUUM_PRESSURE_SOAKING}
              onChange={(e: any) => {
                const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                patchCastingProcess({ VACUUM_PRESSURE_SOAKING: val });
                clearFieldError?.(`CASTING_PROCESS.VACUUM_PRESSURE_SOAKING`);
              }}
              disabled={disabled}
              readOnly={readOnly}
              placeholder="Enter value"
              error={Boolean(validationErrors?.[`CASTING_PROCESS.VACUUM_PRESSURE_SOAKING`])}
              helperText={validationErrors?.[`CASTING_PROCESS.VACUUM_PRESSURE_SOAKING`]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="TDI Clearance after Vacuum trial" required />
            <DateTimeField
              value={value.CASTING_PROCESS.TDI_CLEARANCE_AFTER_VACUUM}
              onChange={(e: any) => {
                const val = typeof e === "string" ? e : (e?.target?.value ?? "");
                patchCastingProcess({ TDI_CLEARANCE_AFTER_VACUUM: val });
                clearFieldError?.(`CASTING_PROCESS.TDI_CLEARANCE_AFTER_VACUUM`);
              }}
              disabled={disabled}
              readOnly={readOnly}
              error={Boolean(validationErrors?.[`CASTING_PROCESS.TDI_CLEARANCE_AFTER_VACUUM`])}
              helperText={validationErrors?.[`CASTING_PROCESS.TDI_CLEARANCE_AFTER_VACUUM`]}
            />
          </Box>
        </FieldGrid>
      </SectionCard>

      {/* Section C */}
      <SectionCard title="Section C: Slurry Cast into motor from bowls" theme={theme}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box />
          {addRowButton(addSlurryRow)}
        </Stack>
        <TableContainer sx={castingCuringTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { label: "FM/Motor Id", required: true },
                  { label: "Slurry Cast (kg)", required: true },
                  { label: "", required: false },
                ].map((col, idx) => (
                  <TableCell
                    key={`${col.label}-${idx}`}
                    sx={castingCuringTableHeaderCellSx(idx === 0)}
                  >
                    {col.required ? (
                      <FieldLabelWithAsterisk label={col.label} required />
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {slurryRows.map((row, index) => {
                const isTotal = isSlurryTotalRow(row);
                return (
                  <TableRow key={`slurry-${index}`} sx={castingCuringTableRowSx(index)}>
                    <TableCell
                      sx={{
                        ...castingCuringTableCellSx,
                        fontWeight: isTotal ? 800 : 600,
                        minWidth: 240,
                      }}
                    >
                      {isTotal ? (
                        row.FM_MOTOR_LABEL || "—"
                      ) : (
                        <TableSelectInput
                          value={row.FM_MOTOR_LABEL}
                          onChange={(v) => {
                            clearFieldError?.(
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.FM_MOTOR_LABEL`,
                            );
                            selectSlurryBowl(index, v);
                          }}
                          options={bowlOptionsForRow(
                            row.FM_MOTOR_LABEL,
                            slurryRows
                              .filter((entry, i) => i !== index && !isSlurryTotalRow(entry))
                              .map((entry) => entry.FM_MOTOR_LABEL),
                          )}
                          placeholder={BOWL_ID_PLACEHOLDER}
                          disabled={disabled}
                          readOnly={readOnly}
                          fieldPath={`SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.FM_MOTOR_LABEL`}
                          error={Boolean(
                            validationErrors?.[
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.FM_MOTOR_LABEL`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.FM_MOTOR_LABEL`
                            ]
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      {isTotal ? (
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 800 }}>
                          {row.SLURRY_CAST || "—"}
                        </Typography>
                      ) : (
                        <TableTextInput
                          value={row.SLURRY_CAST}
                          onChange={(v) => {
                            clearFieldError?.(
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.SLURRY_CAST`,
                            );
                            updateSlurryCast(index, { SLURRY_CAST: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          fieldPath={`SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.SLURRY_CAST`}
                          error={Boolean(
                            validationErrors?.[
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.SLURRY_CAST`
                            ],
                          )}
                          helperText={
                            validationErrors?.[
                              `SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS.${index}.SLURRY_CAST`
                            ]
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      {!disabled &&
                      !readOnly &&
                      !isTotal &&
                      slurryRows.filter((entry) => !isSlurryTotalRow(entry)).length > 1 ? (
                        <IconButton
                          size="small"
                          onClick={() => deleteSlurryRow(index)}
                          aria-label="Delete slurry row"
                          sx={{ color: BRAND.danger }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      {/* Section D */}
      <SectionCard title="Section D: Post Cast Operations" theme={theme} mb={0}>
        <TableContainer sx={castingCuringTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  { label: "Activity", required: false },
                  { label: "Post Cast Operation Details", required: true },
                ].map((col, idx) => (
                  <TableCell key={col.label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {col.required ? (
                      <FieldLabelWithAsterisk label={col.label} required />
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(value.POST_CAST_OPERATIONS.POST_CAST_TABLE?.length
                ? value.POST_CAST_OPERATIONS.POST_CAST_TABLE
                : createEmptyPostCastTable()
              ).map((row, index) => (
                <TableRow key={`post-${index}`} sx={castingCuringTableRowSx(index)}>
                  <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600, width: "40%" }}>
                    {row.detailsFieldType === "datetime"
                      ? row.ACTIVITY.replace(/\bTime\b/i, "Date & Time")
                      : row.ACTIVITY}
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <ValueByFieldType
                      value={row.DETAILS}
                      fieldType={row.detailsFieldType}
                      onChange={(v) => {
                        clearFieldError?.(`POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`);
                        updatePostCast(index, { DETAILS: v });
                      }}
                      disabled={disabled}
                      readOnly={readOnly}
                      fieldPath={`POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`}
                      error={Boolean(
                        validationErrors?.[`POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`],
                      )}
                      // helperText={
                      //   validationErrors?.[`POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`]
                      // }
                    />
                    {validationErrors?.[`POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`] ? (
                      <Typography sx={{ color: "#d32f2f", fontSize: "0.75rem", mt: 0.5 }}>
                        {
                          validationErrors?.[
                            `POST_CAST_OPERATIONS.POST_CAST_TABLE.${index}.DETAILS`
                          ]
                        }
                      </Typography>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Box>
  );
};

export default CastingMotorPanel;

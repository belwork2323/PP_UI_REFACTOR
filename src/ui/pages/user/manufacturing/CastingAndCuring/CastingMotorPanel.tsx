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
import { DateTimeField, TimeField } from "../../../../components/common/DateField";
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

const CompactTime = ({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <TimeField
    value={value}
    onChange={onChange}
    disabled={disabled} readOnly={readOnly}
    compact
    inputSx={castingCuringTableInputSx}
  />
);

const CompactDateTime = ({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <DateTimeField
    value={value}
    onChange={onChange}
    disabled={disabled} readOnly={readOnly}
    compact
    placeholder="DD-MM-YYYY HH:mm"
    inputSx={castingCuringTableInputSx}
  />
);

const ValueByFieldType = ({
  value,
  fieldType,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  fieldType?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const type = String(fieldType ?? "text").toLowerCase();
  if (type === "time") {
    return <CompactTime value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} />;
  }
  if (type === "datetime") {
    return <CompactDateTime value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} />;
  }
  if (type === "number") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled} readOnly={readOnly}
        type="number"
        placeholder="0"
      />
    );
  }
  if (type === "textarea") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled} readOnly={readOnly}
        multiline
        minRows={2}
        placeholder="Enter value"
      />
    );
  }
  return (
    <TableTextInput
      value={value}
      onChange={onChange}
      disabled={disabled} readOnly={readOnly}
      placeholder="Enter value"
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
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  const patchRoot = (partial: Partial<CastingMotorData>) => {
    onChange({ ...value, ...partial });
  };

  const patchCastingProcess = (
    partial: Partial<CastingMotorData["CASTING_PROCESS"]>,
  ) => {
    onChange({
      ...value,
      CASTING_PROCESS: {
        ...value.CASTING_PROCESS,
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
    const used = new Set(
      [...usedInTable, ...(excludedBowlLabels ?? [])]
        .map((label) => str(label).trim().toLowerCase())
        .filter(Boolean),
    );
    const selectedKey = str(selected).trim().toLowerCase();
    const options = bowlChoices.filter(
      (option) => option.value.toLowerCase() === selectedKey || !used.has(option.value.toLowerCase()),
    );
    if (selected && !options.some((option) => option.value === selected)) {
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
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    patchRoot({
      FINAL_ASSEMBLY_DETAILS: {
        motorCasing: [{ ...casing, ...patch }],
      },
    });
  };

  const updateMandrelRow = (rowIndex: number, patch: Partial<MandrelMeasurementRow>) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const rows = casing.MANDREL_MEASUREMENTS.map((row, i) => {
      if (i !== rowIndex) return row;
      return applyMandrelFormulas({ ...row, ...patch });
    });
    updateMotorCasing({ MANDREL_MEASUREMENTS: rows });
  };

  const addMandrelRow = () => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const nextNo = casing.MANDREL_MEASUREMENTS.length + 1;
    updateMotorCasing({
      MANDREL_MEASUREMENTS: [
        ...casing.MANDREL_MEASUREMENTS,
        createEmptyMandrelMeasurementRow(nextNo),
      ],
    });
  };

  const deleteMandrelRow = (rowIndex: number) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    if (casing.MANDREL_MEASUREMENTS.length <= 1) return;
    updateMotorCasing({
      MANDREL_MEASUREMENTS: casing.MANDREL_MEASUREMENTS
        .filter((_, i) => i !== rowIndex)
        .map((row, i) => ({ ...row, srNo: String(i + 1) })),
    });
  };

  const updateFeedPipe = (patch: Partial<FeedPipeDistanceRow>) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.[0] ?? createEmptyMotorCasingInstance();
    const existing = casing.FEED_PIPE_DISTANCE[0] ?? createEmptyFeedPipeDistanceRow();
    updateMotorCasing({
      FEED_PIPE_DISTANCE: [{ ...existing, ...patch }],
    });
  };

  const updateBowlDetail = (index: number, patch: Partial<CastingBowlDetailRow>) => {
    const rows = value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
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
        <SubsectionHeading>
          Distance between centering top to mandrel top (mm)
        </SubsectionHeading>
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
                Mandrel rest on bottom cup (with Teflon sleeve) (B)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Difference C=(A-B)
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ ...groupHeaderSx, verticalAlign: "middle", maxWidth: 110 }}
              >
                Bellow thickness (D)
              </TableCell>
              <TableCell colSpan={2} sx={groupHeaderSx}>
                Mandrel lift E=(C-D)
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{ ...castingCuringTableHeaderCellSx(false), width: 48 }}
              />
            </TableRow>
            <TableRow>
              {["Mock assy.", "Mock assy.", "Final assy.", "Mock assy.", "Final assy.", "Mock assy.", "Final assy."].map(
                (label, idx) => (
                  <TableCell key={`sub-${idx}`} sx={castingCuringTableHeaderCellSx(false)}>
                    {label}
                  </TableCell>
                ),
              )}
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
                    onChange={(v) => updateMandrelRow(rowIndex, { A_MOCK: v })}
                    disabled={disabled} readOnly={readOnly}
                    type="number"
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_MOCK}
                    onChange={(v) => updateMandrelRow(rowIndex, { B_MOCK: v })}
                    disabled={disabled} readOnly={readOnly}
                    type="number"
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_FINAL}
                    onChange={(v) => updateMandrelRow(rowIndex, { B_FINAL: v })}
                    disabled={disabled} readOnly={readOnly}
                    type="number"
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
                    onChange={(v) => updateMandrelRow(rowIndex, { BELLOWS_THICKNESS_D: v })}
                    disabled={disabled} readOnly={readOnly}
                    type="number"
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
        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mb: 1.5 }}>
          Fill Assembly Details
        </Typography>

        {renderMandrelTable()}

        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>
            Measurement of distance between feed pipe & cone apex
          </SubsectionHeading>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabel>Reading 1 (mm)</FieldLabel>
              <TableTextInput
                value={feed.READING_1}
                onChange={(v) => updateFeedPipe({ READING_1: v })}
                disabled={disabled} readOnly={readOnly}
                type="number"
                placeholder="0"
              />
            </Box>
            <Box>
              <FieldLabel>Reading 2 (mm)</FieldLabel>
              <TableTextInput
                value={feed.READING_2}
                onChange={(v) => updateFeedPipe({ READING_2: v })}
                disabled={disabled} readOnly={readOnly}
                type="number"
                placeholder="0"
              />
            </Box>
          </FieldGrid>
        </Box>

        <CasePrepTextField
          label="Weight of assembled empty motor casing (kg)"
          value={casing.EMPTY_MOTOR_WEIGHT}
          onChange={(v) => updateMotorCasing({ EMPTY_MOTOR_WEIGHT: v })}
          disabled={disabled} readOnly={readOnly}
          theme={theme}
          width="100%"
          placeholder="0"
        />
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
                    "Bowl Id",
                    "Bowl Receipt Time",
                    "Initial Weight",
                    "Final Weight",
                    "Initial Slurry Depth",
                    "Bowl D/C Valve Opening Time",
                    "Bowl D/C Valve Closing Time",
                    "Depth of Slurry after Opening of D/C Valve",
                    "Ball Valve Opening Time",
                    "",
                  ].map((label, idx) => (
                    <TableCell key={`${label}-${idx}`} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(mixBowlRows.length ? mixBowlRows : [createEmptyBowlDetailRow()]).map((row, index) => (
                  <TableRow key={`bowl-${index}`} sx={castingCuringTableRowSx(index)}>
                    <TableCell sx={{ ...castingCuringTableCellSx, minWidth: 240 }}>
                      <TableSelectInput
                        value={row.BOWL_ID}
                        onChange={(v) => selectBowlDetail(index, v)}
                        options={bowlOptionsForRow(row.BOWL_ID, usedMixBowlIds.filter((_, i) => i !== index))}
                        placeholder={BOWL_ID_PLACEHOLDER}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.BOWL_RECEIPT_TIME}
                        onChange={(v) => updateBowlDetail(index, { BOWL_RECEIPT_TIME: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.INITIAL_WEIGHT}
                        onChange={(v) => updateBowlDetail(index, { INITIAL_WEIGHT: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.FINAL_WEIGHT}
                        onChange={(v) => updateBowlDetail(index, { FINAL_WEIGHT: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.INITIAL_SLURRY_DEPTH}
                        onChange={(v) => updateBowlDetail(index, { INITIAL_SLURRY_DEPTH: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.DC_OPEN_TIME}
                        onChange={(v) => updateBowlDetail(index, { DC_OPEN_TIME: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.DC_CLOSE_TIME}
                        onChange={(v) => updateBowlDetail(index, { DC_CLOSE_TIME: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.SLURRY_DEPTH_AFTER_DC}
                        onChange={(v) => updateBowlDetail(index, { SLURRY_DEPTH_AFTER_DC: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.BALL_VALVE_OPEN_TIME}
                        onChange={(v) => updateBowlDetail(index, { BALL_VALVE_OPEN_TIME: v })}
                        disabled={disabled} readOnly={readOnly}
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
                ))}
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
                    "Bowl Id",
                    "Time Interval (hrs)",
                    "RH (%)",
                    "Viscosity (Poise)",
                    "Motor Id No.",
                    "Slurry Depth (cm)",
                    "Slurry Cast (kg)",
                    "Flow Rate (kg/min)",
                    "Valve Opening (%)",
                    "Vacuum Level (torr)",
                    "",
                  ].map((label, idx) => (
                    <TableCell key={`${label}-${idx}`} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                      {label}
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
                          onChange={(v) => selectCastingFromBowl(index, v)}
                          options={bowlOptionsForRow(
                            row.BOWL_ID,
                            usedCastingBowlIds.filter((_, i) => i !== index),
                          )}
                          placeholder={BOWL_ID_PLACEHOLDER}
                          disabled={disabled} readOnly={readOnly}
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.TIME_INTERVAL}
                          onChange={(v) => updateCastingFromBowl(index, { TIME_INTERVAL: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.RH}
                          onChange={(v) => updateCastingFromBowl(index, { RH: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VISCOSITY}
                          onChange={(v) => updateCastingFromBowl(index, { VISCOSITY: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                        {row.MOTOR_ID || motorId || "—"}
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_DEPTH}
                          onChange={(v) => updateCastingFromBowl(index, { SLURRY_DEPTH: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_CAST}
                          onChange={(v) => updateCastingFromBowl(index, { SLURRY_CAST: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.FLOW_RATE}
                          onChange={(v) => updateCastingFromBowl(index, { FLOW_RATE: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VALVE_OPENING}
                          onChange={(v) => updateCastingFromBowl(index, { VALVE_OPENING: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VACUUM_LEVEL}
                          onChange={(v) => updateCastingFromBowl(index, { VACUUM_LEVEL: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
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

        <FieldGrid columns={3}>
          <CasePrepTextField
            label="Initial Vacuum"
            value={value.CASTING_PROCESS.INITIAL_VACUUM}
            onChange={(v) => patchCastingProcess({ INITIAL_VACUUM: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
          <CasePrepTextField
            label="Vacuum Pressure Created for Casting"
            value={value.CASTING_PROCESS.VACUUM_PRESSURE_CASTING}
            onChange={(v) => patchCastingProcess({ VACUUM_PRESSURE_CASTING: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
          <CasePrepTextField
            label="Vacuum Pressure Created for Soaking"
            value={value.CASTING_PROCESS.VACUUM_PRESSURE_SOAKING}
            onChange={(v) => patchCastingProcess({ VACUUM_PRESSURE_SOAKING: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
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
                {["FM/Motor Id", "Slurry Cast (kg)", ""].map((label, idx) => (
                  <TableCell key={`${label}-${idx}`} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {slurryRows.map((row, index) => {
                const isTotal = isSlurryTotalRow(row);
                return (
                  <TableRow key={`slurry-${index}`} sx={castingCuringTableRowSx(index)}>
                    <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: isTotal ? 800 : 600, minWidth: 240 }}>
                      {isTotal ? (
                        row.FM_MOTOR_LABEL || "—"
                      ) : (
                        <TableSelectInput
                          value={row.FM_MOTOR_LABEL}
                          onChange={(v) => selectSlurryBowl(index, v)}
                          options={bowlOptionsForRow(
                            row.FM_MOTOR_LABEL,
                            slurryRows
                              .filter((entry, i) => i !== index && !isSlurryTotalRow(entry))
                              .map((entry) => entry.FM_MOTOR_LABEL),
                          )}
                          placeholder={BOWL_ID_PLACEHOLDER}
                          disabled={disabled} readOnly={readOnly}
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
                          onChange={(v) => updateSlurryCast(index, { SLURRY_CAST: v })}
                          disabled={disabled} readOnly={readOnly}
                          type="number"
                        />
                      )}
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      {!disabled && !readOnly && !isTotal && slurryRows.filter((entry) => !isSlurryTotalRow(entry)).length > 1 ? (
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
                {["Activity", "Post Cast Operation Details"].map((label, idx) => (
                  <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {label}
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
                    {row.ACTIVITY}
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <ValueByFieldType
                      value={row.DETAILS}
                      fieldType={row.detailsFieldType}
                      onChange={(v) => updatePostCast(index, { DETAILS: v })}
                      disabled={disabled} readOnly={readOnly}
                    />
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

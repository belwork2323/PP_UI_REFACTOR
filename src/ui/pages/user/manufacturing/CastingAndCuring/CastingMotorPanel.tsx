import { useEffect, useRef } from "react";
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

const CompactTime = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <TimeField
    value={value}
    onChange={onChange}
    disabled={disabled}
    compact
    inputSx={castingCuringTableInputSx}
  />
);

const CompactDateTime = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <DateTimeField
    value={value}
    onChange={onChange}
    disabled={disabled}
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
}: {
  value: string;
  fieldType?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const type = String(fieldType ?? "text").toLowerCase();
  if (type === "time") {
    return <CompactTime value={value} onChange={onChange} disabled={disabled} />;
  }
  if (type === "datetime") {
    return <CompactDateTime value={value} onChange={onChange} disabled={disabled} />;
  }
  if (type === "number") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled}
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
        disabled={disabled}
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
      disabled={disabled}
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
  theme,
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const seededBowlsRef = useRef(false);

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

  // Seed bowl tables from identification-sheet FINAL_MIX premixes when empty
  useEffect(() => {
    if (seededBowlsRef.current) return;
    if (!bowlSeedRows?.length) return;

    const excluded = new Set(
      (excludedBowlLabels ?? []).map((label) => str(label).trim().toLowerCase()).filter(Boolean),
    );
    const seeds = bowlSeedRows
      .map((seed) => {
        const label = formatBowlLabel(seed);
        const premixNo = str(seed.premixNo).trim();
        const bowlNo = str(seed.bowlId).trim();
        return { label, premixNo, bowlNo };
      })
      .filter((seed) => {
        if (!seed.label) return false;
        if (excluded.has(seed.label.toLowerCase())) return false;
        return true;
      });

    if (!seeds.length) {
      seededBowlsRef.current = true;
      return;
    }

    const current = valueRef.current;
    const bowlEmpty = !current.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS?.length;
    const castingEmpty = !current.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS?.length;
    const slurryDataRows = (current.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? []).filter(
      (row) =>
        str(row.ROW_KEY).trim().toUpperCase() !== "TOTAL" &&
        str(row.FM_MOTOR_LABEL).trim().toLowerCase() !== "total slurry cast",
    );
    const slurryEmpty = slurryDataRows.length === 0;

    if (!bowlEmpty && !castingEmpty && !slurryEmpty) {
      seededBowlsRef.current = true;
      return;
    }

    seededBowlsRef.current = true;

    const bowlRows: CastingBowlDetailRow[] = seeds.map((seed) => ({
      ...createEmptyBowlDetailRow(),
      BOWL_ID: seed.label,
      PREMIX_NO: seed.premixNo,
      BOWL_NO: seed.bowlNo,
    }));

    const castingRows: CastingFromBowlRow[] = seeds.map((seed) => ({
      ...createEmptyCastingFromBowlRow(),
      BOWL_ID: seed.label,
      PREMIX_NO: seed.premixNo,
      BOWL_NO: seed.bowlNo,
      MOTOR_ID: motorId,
    }));

    const slurryRows: SlurryCastRow[] = seeds.map((seed) => ({
      ...createEmptySlurryCastRow(),
      ROW_KEY: `${seed.premixNo}:${seed.bowlNo}` || seed.label,
      PREMIX_NO: seed.premixNo,
      BOWL_NO: seed.bowlNo,
      FM_MOTOR_LABEL: seed.label,
    }));

    onChangeRef.current({
      ...current,
      CASTING_PROCESS: {
        ...current.CASTING_PROCESS,
        FINAL_MIX_BOWL_DETAILS: bowlEmpty
          ? bowlRows
          : current.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS,
        CASTING_FROM_BOWL_DETAILS: castingEmpty
          ? castingRows
          : current.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS,
      },
      SLURRY_CAST_DETAILS: {
        SLURRY_CAST_FROM_BOWLS: slurryEmpty
          ? syncSlurryCastTotalRow(slurryRows)
          : current.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS,
      },
    });
  }, [bowlSeedRows, excludedBowlLabels, motorId]);

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

  const updateMotorCasing = (
    index: number,
    patch: Partial<CastingMotorCasingInstance>,
  ) => {
    const motorCasing = (value.FINAL_ASSEMBLY_DETAILS.motorCasing ?? []).map((instance, i) =>
      i === index ? { ...instance, ...patch } : instance,
    );
    patchRoot({
      FINAL_ASSEMBLY_DETAILS: { motorCasing },
    });
  };

  const addMotorCasing = () => {
    const motorCasing = [
      ...(value.FINAL_ASSEMBLY_DETAILS.motorCasing ?? []),
      createEmptyMotorCasingInstance(),
    ];
    patchRoot({ FINAL_ASSEMBLY_DETAILS: { motorCasing } });
  };

  const deleteMotorCasing = (index: number) => {
    const current = value.FINAL_ASSEMBLY_DETAILS.motorCasing ?? [];
    if (current.length <= 1) return;
    patchRoot({
      FINAL_ASSEMBLY_DETAILS: {
        motorCasing: current.filter((_, i) => i !== index),
      },
    });
  };

  const updateMandrelRow = (
    casingIndex: number,
    rowIndex: number,
    patch: Partial<MandrelMeasurementRow>,
  ) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing[casingIndex];
    if (!casing) return;
    const rows = casing.MANDREL_MEASUREMENTS.map((row, i) => {
      if (i !== rowIndex) return row;
      return applyMandrelFormulas({ ...row, ...patch });
    });
    updateMotorCasing(casingIndex, { MANDREL_MEASUREMENTS: rows });
  };

  const addMandrelRow = (casingIndex: number) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing[casingIndex];
    if (!casing) return;
    const nextNo = casing.MANDREL_MEASUREMENTS.length + 1;
    updateMotorCasing(casingIndex, {
      MANDREL_MEASUREMENTS: [
        ...casing.MANDREL_MEASUREMENTS,
        createEmptyMandrelMeasurementRow(nextNo),
      ],
    });
  };

  const deleteMandrelRow = (casingIndex: number, rowIndex: number) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing[casingIndex];
    if (!casing || casing.MANDREL_MEASUREMENTS.length <= 1) return;
    updateMotorCasing(casingIndex, {
      MANDREL_MEASUREMENTS: casing.MANDREL_MEASUREMENTS
        .filter((_, i) => i !== rowIndex)
        .map((row, i) => ({ ...row, srNo: String(i + 1) })),
    });
  };

  const updateFeedPipe = (
    casingIndex: number,
    patch: Partial<FeedPipeDistanceRow>,
  ) => {
    const casing = value.FINAL_ASSEMBLY_DETAILS.motorCasing[casingIndex];
    if (!casing) return;
    const existing = casing.FEED_PIPE_DISTANCE[0] ?? createEmptyFeedPipeDistanceRow();
    updateMotorCasing(casingIndex, {
      FEED_PIPE_DISTANCE: [{ ...existing, ...patch }],
    });
  };

  const updateBowlDetail = (index: number, patch: Partial<CastingBowlDetailRow>) => {
    const rows = value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchCastingProcess({ FINAL_MIX_BOWL_DETAILS: rows });
  };

  const updateCastingFromBowl = (index: number, patch: Partial<CastingFromBowlRow>) => {
    const rows = value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchCastingProcess({ CASTING_FROM_BOWL_DETAILS: rows });
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

  const updatePostCast = (index: number, patch: Partial<PostCastRow>) => {
    const rows = value.POST_CAST_OPERATIONS.POST_CAST_TABLE.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchRoot({
      POST_CAST_OPERATIONS: { POST_CAST_TABLE: rows },
    });
  };

  const motorCasings = value.FINAL_ASSEMBLY_DETAILS.motorCasing?.length
    ? value.FINAL_ASSEMBLY_DETAILS.motorCasing
    : [createEmptyMotorCasingInstance()];

  const renderMandrelTable = (casing: CastingMotorCasingInstance, casingIndex: number) => (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <SubsectionHeading>
          Distance between centering top to mandrel top (mm)
        </SubsectionHeading>
        {!disabled ? (
          <Typography
            component="button"
            type="button"
            onClick={() => addMandrelRow(casingIndex)}
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
              <TableRow key={`mandrel-${casingIndex}-${rowIndex}`} sx={castingCuringTableRowSx(rowIndex)}>
                <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                  {row.srNo || rowIndex + 1}
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.A_MOCK}
                    onChange={(v) => updateMandrelRow(casingIndex, rowIndex, { A_MOCK: v })}
                    disabled={disabled}
                    type="number"
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_MOCK}
                    onChange={(v) => updateMandrelRow(casingIndex, rowIndex, { B_MOCK: v })}
                    disabled={disabled}
                    type="number"
                  />
                </TableCell>
                <TableCell sx={castingCuringTableCellSx}>
                  <TableTextInput
                    value={row.B_FINAL}
                    onChange={(v) => updateMandrelRow(casingIndex, rowIndex, { B_FINAL: v })}
                    disabled={disabled}
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
                    onChange={(v) =>
                      updateMandrelRow(casingIndex, rowIndex, { BELLOWS_THICKNESS_D: v })
                    }
                    disabled={disabled}
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
                  {!disabled && casing.MANDREL_MEASUREMENTS.length > 1 ? (
                    <IconButton
                      size="small"
                      onClick={() => deleteMandrelRow(casingIndex, rowIndex)}
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

        {motorCasings.map((casing, casingIndex) => {
          const feed = casing.FEED_PIPE_DISTANCE[0] ?? createEmptyFeedPipeDistanceRow();
          return (
            <Box
              key={`casing-${casingIndex}`}
              sx={{
                mb: casingIndex < motorCasings.length - 1 ? 2.5 : 0,
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <SubsectionHeading>
                  {`Rocket Motor Casing ${casingIndex + 1}`}
                </SubsectionHeading>
                {!disabled && motorCasings.length > 1 ? (
                  <IconButton
                    size="small"
                    onClick={() => deleteMotorCasing(casingIndex)}
                    aria-label="Delete casing"
                    sx={{ color: BRAND.danger }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>

              {renderMandrelTable(casing, casingIndex)}

              <Box sx={{ mb: 2 }}>
                <SubsectionHeading>
                  Measurement of distance between feed pipe & cone apex
                </SubsectionHeading>
                <FieldGrid columns={2}>
                  <Box>
                    <FieldLabel>Reading 1 (mm)</FieldLabel>
                    <TableTextInput
                      value={feed.READING_1}
                      onChange={(v) => updateFeedPipe(casingIndex, { READING_1: v })}
                      disabled={disabled}
                      type="number"
                      placeholder="0"
                    />
                  </Box>
                  <Box>
                    <FieldLabel>Reading 2 (mm)</FieldLabel>
                    <TableTextInput
                      value={feed.READING_2}
                      onChange={(v) => updateFeedPipe(casingIndex, { READING_2: v })}
                      disabled={disabled}
                      type="number"
                      placeholder="0"
                    />
                  </Box>
                </FieldGrid>
              </Box>

              <CasePrepTextField
                label="Weight of assembled empty motor casing (kg)"
                value={casing.EMPTY_MOTOR_WEIGHT}
                onChange={(v) => updateMotorCasing(casingIndex, { EMPTY_MOTOR_WEIGHT: v })}
                disabled={disabled}
                theme={theme}
                width="100%"
                placeholder="0"
              />
            </Box>
          );
        })}

        {!disabled ? (
          <Typography
            component="button"
            type="button"
            onClick={addMotorCasing}
            sx={{
              mt: 1.5,
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
            Add casing
          </Typography>
        ) : null}
      </SectionCard>

      {/* Section B */}
      <SectionCard title="Section B: Casting Process" theme={theme}>
        <Box sx={{ mb: 2.5 }}>
          <SubsectionHeading>Final Mix Bowl Details</SubsectionHeading>
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
                  ].map((label, idx) => (
                    <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      sx={{ ...castingCuringTableCellSx, color: BRAND.textSub, textAlign: "center" }}
                    >
                      No bowl rows — waiting for FINAL_MIX seed data
                    </TableCell>
                  </TableRow>
                ) : (
                  value.CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.map((row, index) => (
                    <TableRow key={`bowl-${index}`} sx={castingCuringTableRowSx(index)}>
                      <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {row.BOWL_ID || "—"}
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactTime
                          value={row.BOWL_RECEIPT_TIME}
                          onChange={(v) => updateBowlDetail(index, { BOWL_RECEIPT_TIME: v })}
                          disabled={disabled}
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.INITIAL_WEIGHT}
                          onChange={(v) => updateBowlDetail(index, { INITIAL_WEIGHT: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.FINAL_WEIGHT}
                          onChange={(v) => updateBowlDetail(index, { FINAL_WEIGHT: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.INITIAL_SLURRY_DEPTH}
                          onChange={(v) => updateBowlDetail(index, { INITIAL_SLURRY_DEPTH: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactTime
                          value={row.DC_OPEN_TIME}
                          onChange={(v) => updateBowlDetail(index, { DC_OPEN_TIME: v })}
                          disabled={disabled}
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactTime
                          value={row.DC_CLOSE_TIME}
                          onChange={(v) => updateBowlDetail(index, { DC_CLOSE_TIME: v })}
                          disabled={disabled}
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_DEPTH_AFTER_DC}
                          onChange={(v) => updateBowlDetail(index, { SLURRY_DEPTH_AFTER_DC: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <CompactTime
                          value={row.BALL_VALVE_OPEN_TIME}
                          onChange={(v) => updateBowlDetail(index, { BALL_VALVE_OPEN_TIME: v })}
                          disabled={disabled}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mb: 2.5 }}>
          <SubsectionHeading>Casting From Bowl Details</SubsectionHeading>
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
                  ].map((label, idx) => (
                    <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      sx={{ ...castingCuringTableCellSx, color: BRAND.textSub, textAlign: "center" }}
                    >
                      No casting bowl rows — waiting for FINAL_MIX seed data
                    </TableCell>
                  </TableRow>
                ) : (
                  value.CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.map((row, index) => (
                    <TableRow key={`cast-bowl-${index}`} sx={castingCuringTableRowSx(index)}>
                      <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {row.BOWL_ID || "—"}
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.TIME_INTERVAL}
                          onChange={(v) => updateCastingFromBowl(index, { TIME_INTERVAL: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.RH}
                          onChange={(v) => updateCastingFromBowl(index, { RH: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VISCOSITY}
                          onChange={(v) => updateCastingFromBowl(index, { VISCOSITY: v })}
                          disabled={disabled}
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
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.SLURRY_CAST}
                          onChange={(v) => updateCastingFromBowl(index, { SLURRY_CAST: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.FLOW_RATE}
                          onChange={(v) => updateCastingFromBowl(index, { FLOW_RATE: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VALVE_OPENING}
                          onChange={(v) => updateCastingFromBowl(index, { VALVE_OPENING: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.VACUUM_LEVEL}
                          onChange={(v) => updateCastingFromBowl(index, { VACUUM_LEVEL: v })}
                          disabled={disabled}
                          type="number"
                        />
                      </TableCell>
                    </TableRow>
                  ))
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
            disabled={disabled}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
          <CasePrepTextField
            label="Vacuum Pressure Created for Casting"
            value={value.CASTING_PROCESS.VACUUM_PRESSURE_CASTING}
            onChange={(v) => patchCastingProcess({ VACUUM_PRESSURE_CASTING: v })}
            disabled={disabled}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
          <CasePrepTextField
            label="Vacuum Pressure Created for Soaking"
            value={value.CASTING_PROCESS.VACUUM_PRESSURE_SOAKING}
            onChange={(v) => patchCastingProcess({ VACUUM_PRESSURE_SOAKING: v })}
            disabled={disabled}
            theme={theme}
            width="100%"
            placeholder="Enter value"
          />
        </FieldGrid>
      </SectionCard>

      {/* Section C */}
      <SectionCard title="Section C: Slurry Cast into motor from bowls" theme={theme}>
        <TableContainer sx={castingCuringTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["FM/Motor Id", "Slurry Cast (kg)"].map((label, idx) => (
                  <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(value.SLURRY_CAST_DETAILS.SLURRY_CAST_FROM_BOWLS ?? []).map((row, index) => {
                const isTotal =
                  str(row.ROW_KEY).trim().toUpperCase() === "TOTAL" ||
                  str(row.FM_MOTOR_LABEL).trim().toLowerCase() === "total slurry cast" ||
                  row.readonly === true;
                return (
                  <TableRow key={`slurry-${index}`} sx={castingCuringTableRowSx(index)}>
                    <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: isTotal ? 800 : 600 }}>
                      {row.FM_MOTOR_LABEL || "—"}
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
                          disabled={disabled}
                          type="number"
                        />
                      )}
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
                      disabled={disabled}
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

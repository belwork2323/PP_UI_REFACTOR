import { useEffect, useRef } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  HOT_WATER_STATUS_OPTIONS,
  type CuringCycleRow,
  type CuringMotorData,
} from "../../../../../data/models/user/CuringMotorDataModel";
import { DateField, DateTimeField, TimeField } from "../../../../components/common/DateField";
import CastingCuringFileField from "./CastingCuringFileField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  TableSelectInput,
  TableTextInput,
  castingCuringTableCellSx,
  castingCuringTableContainerSx,
  castingCuringTableHeaderCellSx,
  castingCuringTableInputSx,
  castingCuringTableRowSx,
} from "./CastingCuringFormPrimitives";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import { runValidation } from "@/data/validation/runValidation";
import validateCastingCuring from "@/data/validation/adapters/castingCuring.validation";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

type Props = {
  value: CuringMotorData;
  onChange: (next: CuringMotorData) => void;
  motorId: string;
  /** Building no from batch identification sheet (`BldgNo`). */
  buildingNo?: string;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  /** From curing-cycles API — same visibility rule the schema used. */
  showPropellantPressure?: boolean;
  validationErrors?: Record<string, string>;
  clearFieldError?: (path: string) => void;
};

const CompactTime = ({
  value,
  onChange,
  disabled,
  readOnly,
  required = false,
  error,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required: boolean;
  error?: boolean;
  helperText?: string;
}) => (
  <TimeField
    value={value}
    onChange={onChange}
    disabled={disabled}
    readOnly={readOnly}
    compact
    inputSx={castingCuringTableInputSx}
    required={required}
    error={error}
    helperText={helperText}
  />
);

const CompactDate = ({
  value,
  onChange,
  disabled,
  readOnly,
  required = false,
  error,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required: boolean;
  error?: boolean;
  helperText?: string;
}) => (
  <DateField
    value={value}
    onChange={onChange}
    disabled={disabled}
    readOnly={readOnly}
    compact
    required={required}
    inputSx={castingCuringTableInputSx}
    error={error}
    helperText={helperText}
  />
);

const CompactDateTime = ({
  value,
  onChange,
  disabled,
  readOnly,
  required = false,
  error,
  helperText,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}) => (
  <DateTimeField
    value={value}
    onChange={onChange}
    disabled={disabled}
    readOnly={readOnly}
    compact
    placeholder="DD-MM-YYYY HH:mm"
    inputSx={castingCuringTableInputSx}
    required={required}
    error={error}
    helperText={helperText}
  />
);

const CYCLE_HEADERS = [
  "S.No",
  "Temperature (°C)",
  "Time (min)",
  "Start Date",
  "Start Time",
  "End Date",
  "End Time",
] as const;

const CuringMotorPanel = ({
  value,
  onChange,
  motorId: _motorId,
  buildingNo = "",
  disabled = false,
  readOnly = false,
  theme,
  showPropellantPressure = true,
  validationErrors,
  clearFieldError,
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  console.log(validationErrors);

  // Seed Building No from batch identification sheet when empty
  useEffect(() => {
    const fromBatch = str(buildingNo).trim();
    if (!fromBatch) return;
    if (str(valueRef.current.DECORING_DETAILS.BUILDING_NO).trim()) return;
    onChangeRef.current({
      ...valueRef.current,
      DECORING_DETAILS: {
        ...valueRef.current.DECORING_DETAILS,
        BUILDING_NO: fromBatch,
      },
    });
  }, [buildingNo]);

  const patchSection = <K extends keyof CuringMotorData>(
    sectionKey: K,
    partial: Partial<CuringMotorData[K]>,
  ) => {
    onChange({
      ...value,
      [sectionKey]: {
        ...value[sectionKey],
        ...partial,
      },
    });
  };

  const updateCycleRow = (index: number, patch: Partial<CuringCycleRow>) => {
    const rows = (value.CURING_CYCLES.CURING_TABLE ?? []).map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("CURING_CYCLES", { CURING_TABLE: rows });
  };

  const cycles = value.CURING_CYCLES.CURING_TABLE ?? [];
  const post = value.POST_CURING_DETAILS;
  const decor = value.DECORING_DETAILS;

  const cycleHeaders = [
    ...CYCLE_HEADERS,
    ...(showPropellantPressure ? (["Propellant Pressure (bar)"] as const) : []),
    "Status Of Hot Water Circulation",
  ];
  useEffect(() => {
    if (cycles && cycles.length > 0) {
      validateCastingCuring(value, "SUBMIT");
    }
  }, [cycles]);
  return (
    <Box>
      <SectionCard title="Curing Cycles" theme={theme}>
        <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: showPropellantPressure ? 1080 : 960 }}>
            <TableHead>
              <TableRow>
                {cycleHeaders.map((label, idx) => (
                  <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    <FieldLabelWithAsterisk
                      label={label}
                      required={label !== "Propellant Pressure (bar)" && label !== "S.No"}
                      sx={castingCuringTableHeaderCellSx(idx === 0)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((row, index) => {
                // Define paths mapping for error checks inside the loop
                const tempPath = `CURING_CYCLES.CURING_TABLE.${index}.TEMPERATURE`;
                const timePath = `CURING_CYCLES.CURING_TABLE.${index}.TIME`;
                const startDatePath = `CURING_CYCLES.CURING_TABLE.${index}.START_DATE`;
                const startTimePath = `CURING_CYCLES.CURING_TABLE.${index}.START_TIME`;
                const endDatePath = `CURING_CYCLES.CURING_TABLE.${index}.END_DATE`;
                const endTimePath = `CURING_CYCLES.CURING_TABLE.${index}.END_TIME`;
                const pressurePath = `CURING_CYCLES.CURING_TABLE.${index}.PROPELLANT_PRESSURE`;
                const waterStatusPath = `CURING_CYCLES.CURING_TABLE.${index}.HOT_WATER_STATUS`;

                return (
                  <TableRow key={`cycle-${row.srNo || index}`} sx={castingCuringTableRowSx(index)}>
                    <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                      {row.srNo || index + 1}
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.TEMPERATURE}
                        onChange={(v) => {
                          clearFieldError?.(tempPath);
                          updateCycleRow(index, { TEMPERATURE: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                        required
                        error={Boolean(validationErrors?.[tempPath])}
                        helperText={validationErrors?.[tempPath]}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.TIME}
                        onChange={(v) => {
                          clearFieldError?.(timePath);
                          updateCycleRow(index, { TIME: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        type="number"
                        required
                        error={Boolean(validationErrors?.[timePath])}
                        helperText={validationErrors?.[timePath]}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactDate
                        value={row.START_DATE}
                        onChange={(v) => {
                          clearFieldError?.(startDatePath);
                          updateCycleRow(index, { START_DATE: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        error={Boolean(validationErrors?.[startDatePath])}
                        helperText={validationErrors?.[startDatePath]}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.START_TIME}
                        onChange={(v) => {
                          clearFieldError?.(startTimePath);
                          updateCycleRow(index, { START_TIME: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        error={Boolean(validationErrors?.[startTimePath])}
                        helperText={validationErrors?.[startTimePath]}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactDate
                        value={row.END_DATE}
                        onChange={(v) => {
                          clearFieldError?.(endDatePath);
                          updateCycleRow(index, { END_DATE: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        error={Boolean(validationErrors?.[endDatePath])}
                        helperText={validationErrors?.[endDatePath]}
                      />
                    </TableCell>
                    <TableCell sx={castingCuringTableCellSx}>
                      <CompactTime
                        value={row.END_TIME}
                        onChange={(v) => {
                          clearFieldError?.(endTimePath);
                          updateCycleRow(index, { END_TIME: v });
                        }}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        error={Boolean(validationErrors?.[endTimePath])}
                        helperText={validationErrors?.[endTimePath]}
                      />
                    </TableCell>
                    {showPropellantPressure ? (
                      <TableCell sx={castingCuringTableCellSx}>
                        <TableTextInput
                          value={row.PROPELLANT_PRESSURE}
                          onChange={(v) => {
                            clearFieldError?.(pressurePath);
                            updateCycleRow(index, { PROPELLANT_PRESSURE: v });
                          }}
                          disabled={disabled}
                          readOnly={readOnly}
                          type="number"
                          error={Boolean(validationErrors?.[pressurePath])}
                          helperText={validationErrors?.[pressurePath]}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableSelectInput
                        value={str(row.HOT_WATER_STATUS)}
                        onChange={(v) => {
                          clearFieldError?.(waterStatusPath);
                          updateCycleRow(index, { HOT_WATER_STATUS: v });
                        }}
                        options={[...HOT_WATER_STATUS_OPTIONS]}
                        disabled={disabled}
                        readOnly={readOnly}
                        required
                        error={Boolean(validationErrors?.[waterStatusPath])}
                        helperText={validationErrors?.[waterStatusPath]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard title="Section C: Post Curing Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabelWithAsterisk label="Any Other Observations" required />
            <TableTextInput
              value={post.OTHER_OBSERVATIONS}
              onChange={(v) => {
                clearFieldError?.("POST_CURING_DETAILS.OTHER_OBSERVATIONS");
                patchSection("POST_CURING_DETAILS", { OTHER_OBSERVATIONS: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Any other observations"
              required
              error={Boolean(validationErrors?.["POST_CURING_DETAILS.OTHER_OBSERVATIONS"])}
              helperText={validationErrors?.["POST_CURING_DETAILS.OTHER_OBSERVATIONS"]}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabelWithAsterisk label="Visual Observation Of Cured Motor" required />
            <TableTextInput
              value={post.VISUAL_OBSERVATION}
              onChange={(v) => {
                clearFieldError?.("POST_CURING_DETAILS.VISUAL_OBSERVATION");
                patchSection("POST_CURING_DETAILS", { VISUAL_OBSERVATION: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Visual observation"
              required
              error={Boolean(validationErrors?.["POST_CURING_DETAILS.VISUAL_OBSERVATION"])}
              helperText={validationErrors?.["POST_CURING_DETAILS.VISUAL_OBSERVATION"]}
            />
          </Box>
          <Box>
            <FieldLabel>Date/Time For Removal Of Pressure Plate</FieldLabel>
            <CompactDateTime
              value={post.PRESSURE_PLATE_REMOVAL_DATE_TIME}
              onChange={(v) => {
                clearFieldError?.("POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME");
                patchSection("POST_CURING_DETAILS", { PRESSURE_PLATE_REMOVAL_DATE_TIME: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              required
              error={Boolean(
                validationErrors?.["POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME"],
              )}
              helperText={
                validationErrors?.["POST_CURING_DETAILS.PRESSURE_PLATE_REMOVAL_DATE_TIME"]
              }
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Hardness (Shore A)" required />
            <TableTextInput
              value={post.SHORE_A_HARDNESS}
              onChange={(v) => {
                clearFieldError?.("POST_CURING_DETAILS.SHORE_A_HARDNESS");
                patchSection("POST_CURING_DETAILS", { SHORE_A_HARDNESS: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              type="number"
              placeholder="0"
              required
              error={Boolean(validationErrors?.["POST_CURING_DETAILS.SHORE_A_HARDNESS"])}
              helperText={validationErrors?.["POST_CURING_DETAILS.SHORE_A_HARDNESS"]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Date/Time Of Dispatch For De-coring" required />
            <CompactDateTime
              value={post.DE_CORING_DISPATCH_DATE_TIME}
              onChange={(v) => {
                clearFieldError?.("POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME");
                patchSection("POST_CURING_DETAILS", { DE_CORING_DISPATCH_DATE_TIME: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              required
              error={Boolean(
                validationErrors?.["POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME"],
              )}
              helperText={validationErrors?.["POST_CURING_DETAILS.DE_CORING_DISPATCH_DATE_TIME"]}
            />
          </Box>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Section D: De-coring Details" theme={theme} mb={0}>
        <FieldGrid columns={3}>
          <Box>
            <FieldLabelWithAsterisk label="Date Of De-coring" required />
            <CompactDate
              value={decor.DECORING_DATE}
              onChange={(v) => {
                clearFieldError?.("DECORING_DETAILS.DECORING_DATE");
                patchSection("DECORING_DETAILS", { DECORING_DATE: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              required
              error={Boolean(validationErrors?.["DECORING_DETAILS.DECORING_DATE"])}
              helperText={validationErrors?.["DECORING_DETAILS.DECORING_DATE"]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="Building No" required />
            <TableTextInput
              value={decor.BUILDING_NO}
              onChange={(v) => {
                clearFieldError?.("DECORING_DETAILS.BUILDING_NO");
                patchSection("DECORING_DETAILS", { BUILDING_NO: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              required
              error={Boolean(validationErrors?.["DECORING_DETAILS.BUILDING_NO"])}
              helperText={validationErrors?.["DECORING_DETAILS.BUILDING_NO"]}
            />
          </Box>
          <Box>
            <FieldLabelWithAsterisk label="De-coring Load (kg)" required />
            <TableTextInput
              value={decor.DECORING_LOAD}
              onChange={(v) => {
                clearFieldError?.("DECORING_DETAILS.DECORING_LOAD");
                patchSection("DECORING_DETAILS", { DECORING_LOAD: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              type="number"
              placeholder="0"
              required
              error={Boolean(validationErrors?.["DECORING_DETAILS.DECORING_LOAD"])}
              helperText={validationErrors?.["DECORING_DETAILS.DECORING_LOAD"]}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabelWithAsterisk label="Remarks" required />
            <TableTextInput
              value={decor.DECORING_REMARKS}
              onChange={(v) => {
                clearFieldError?.("DECORING_DETAILS.DECORING_REMARKS");
                patchSection("DECORING_DETAILS", { DECORING_REMARKS: v });
              }}
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Remarks"
              required
              error={Boolean(validationErrors?.["DECORING_DETAILS.DECORING_REMARKS"])}
              helperText={validationErrors?.["DECORING_DETAILS.DECORING_REMARKS"]}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <CastingCuringFileField
              label={(<FieldLabelWithAsterisk label="Visual Observations" required />) as any}
              files={decor.DECORING_VISUAL_OBSERVATION ?? []}
              onChange={(next) => {
                clearFieldError?.("DECORING_DETAILS.DECORING_VISUAL_OBSERVATION");
                patchSection("DECORING_DETAILS", { DECORING_VISUAL_OBSERVATION: next });
              }}
              disabled={disabled}
              readOnly={readOnly}
              multiple
              acceptMode="imageVideo"
              emptyLabel="Upload photos or videos"
              required
              error={Boolean(validationErrors?.["DECORING_DETAILS.DECORING_VISUAL_OBSERVATION"])}
              helperText={validationErrors?.["DECORING_DETAILS.DECORING_VISUAL_OBSERVATION"]}
            />
          </Box>
        </FieldGrid>
      </SectionCard>
    </Box>
  );
};

export default CuringMotorPanel;

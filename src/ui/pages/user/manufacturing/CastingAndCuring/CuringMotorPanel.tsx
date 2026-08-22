import { useEffect, useRef } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import {
  HOT_WATER_STATUS_OPTIONS,
  type CuringCycleRow,
  type CuringMotorData,
} from "../../../../../data/models/user/CuringMotorDataModel";
import { DateField, DateTimeField, TimeField } from "../../../../components/common/DateField";
import SchemaFileField from "../../../../components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
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
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const toFileFieldValue = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof File !== "undefined" && value instanceof File) return value.name;
  if (typeof value === "object" && value !== null) {
    const rec = value as Record<string, unknown>;
    return str(rec.name ?? rec.fileName ?? rec.fileUrl ?? rec.path ?? "");
  }
  return "";
};

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

const CompactDate = ({
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
  <DateField
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
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

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

  return (
    <Box>
      <SectionCard title="Curing Cycles" theme={theme}>
        <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: showPropellantPressure ? 1080 : 960 }}>
            <TableHead>
              <TableRow>
                {cycleHeaders.map((label, idx) => (
                  <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((row, index) => (
                <TableRow key={`cycle-${row.srNo || index}`} sx={castingCuringTableRowSx(index)}>
                  <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                    {row.srNo || index + 1}
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableTextInput
                      value={row.TEMPERATURE}
                      onChange={(v) => updateCycleRow(index, { TEMPERATURE: v })}
                      disabled={disabled} readOnly={readOnly}
                      type="number"
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableTextInput
                      value={row.TIME}
                      onChange={(v) => updateCycleRow(index, { TIME: v })}
                      disabled={disabled} readOnly={readOnly}
                      type="number"
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactDate
                      value={row.START_DATE}
                      onChange={(v) => updateCycleRow(index, { START_DATE: v })}
                      disabled={disabled} readOnly={readOnly}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactTime
                      value={row.START_TIME}
                      onChange={(v) => updateCycleRow(index, { START_TIME: v })}
                      disabled={disabled} readOnly={readOnly}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactDate
                      value={row.END_DATE}
                      onChange={(v) => updateCycleRow(index, { END_DATE: v })}
                      disabled={disabled} readOnly={readOnly}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactTime
                      value={row.END_TIME}
                      onChange={(v) => updateCycleRow(index, { END_TIME: v })}
                      disabled={disabled} readOnly={readOnly}
                    />
                  </TableCell>
                  {showPropellantPressure ? (
                    <TableCell sx={castingCuringTableCellSx}>
                      <TableTextInput
                        value={row.PROPELLANT_PRESSURE}
                        onChange={(v) => updateCycleRow(index, { PROPELLANT_PRESSURE: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                  ) : null}
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableSelectInput
                      value={str(row.HOT_WATER_STATUS)}
                      onChange={(v) => updateCycleRow(index, { HOT_WATER_STATUS: v })}
                      options={[...HOT_WATER_STATUS_OPTIONS]}
                      disabled={disabled} readOnly={readOnly}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard title="Section C: Post Curing Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabel>Any Other Observations</FieldLabel>
            <TableTextInput
              value={post.OTHER_OBSERVATIONS}
              onChange={(v) => patchSection("POST_CURING_DETAILS", { OTHER_OBSERVATIONS: v })}
              disabled={disabled} readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Any other observations"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabel>Visual Observation Of Cured Motor</FieldLabel>
            <TableTextInput
              value={post.VISUAL_OBSERVATION}
              onChange={(v) => patchSection("POST_CURING_DETAILS", { VISUAL_OBSERVATION: v })}
              disabled={disabled} readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Visual observation"
            />
          </Box>
          <Box>
            <FieldLabel>Date/Time For Removal Of Pressure Plate</FieldLabel>
            <CompactDateTime
              value={post.PRESSURE_PLATE_REMOVAL_DATE_TIME}
              onChange={(v) =>
                patchSection("POST_CURING_DETAILS", { PRESSURE_PLATE_REMOVAL_DATE_TIME: v })
              }
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <Box>
            <FieldLabel>Hardness (Shore A)</FieldLabel>
            <TableTextInput
              value={post.SHORE_A_HARDNESS}
              onChange={(v) => patchSection("POST_CURING_DETAILS", { SHORE_A_HARDNESS: v })}
              disabled={disabled} readOnly={readOnly}
              type="number"
              placeholder="0"
            />
          </Box>
          <Box>
            <FieldLabel>Date/Time Of Dispatch For De-coring</FieldLabel>
            <CompactDateTime
              value={post.DE_CORING_DISPATCH_DATE_TIME}
              onChange={(v) =>
                patchSection("POST_CURING_DETAILS", { DE_CORING_DISPATCH_DATE_TIME: v })
              }
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Section D: De-coring Details" theme={theme} mb={0}>
        <FieldGrid columns={3}>
          <Box>
            <FieldLabel>Date Of De-coring</FieldLabel>
            <CompactDate
              value={decor.DECORING_DATE}
              onChange={(v) => patchSection("DECORING_DETAILS", { DECORING_DATE: v })}
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <Box>
            <FieldLabel>Building No</FieldLabel>
            <TableTextInput
              value={decor.BUILDING_NO}
              onChange={(v) => patchSection("DECORING_DETAILS", { BUILDING_NO: v })}
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <Box>
            <FieldLabel>De-coring Load (kg)</FieldLabel>
            <TableTextInput
              value={decor.DECORING_LOAD}
              onChange={(v) => patchSection("DECORING_DETAILS", { DECORING_LOAD: v })}
              disabled={disabled} readOnly={readOnly}
              type="number"
              placeholder="0"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabel>Remarks</FieldLabel>
            <TableTextInput
              value={decor.DECORING_REMARKS}
              onChange={(v) => patchSection("DECORING_DETAILS", { DECORING_REMARKS: v })}
              disabled={disabled} readOnly={readOnly}
              multiline
              minRows={2}
              placeholder="Remarks"
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <SchemaFileField
              label="Visual Observations"
              value={toFileFieldValue(decor.DECORING_VISUAL_OBSERVATION)}
              onChange={(next) =>
                patchSection("DECORING_DETAILS", { DECORING_VISUAL_OBSERVATION: next })
              }
              disabled={disabled} readOnly={readOnly}
              multiple
              accept={FILE_PICKER_ACCEPT.IMAGE_VIDEO}
              emptyLabel="Upload photos or videos"
              helperText="Upload photos or videos of visual observations during de-coring. Supported: JPG, PNG, WEBP, MP4, WEBM."
            />
          </Box>
        </FieldGrid>
      </SectionCard>
    </Box>
  );
};

export default CuringMotorPanel;

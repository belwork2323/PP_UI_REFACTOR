import { useEffect, useRef } from "react";
import {
  Box,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  createEmptyCuringCycleRow,
  createEmptyCuringMotorData,
  HOT_WATER_STATUS_OPTIONS,
  type CuringCycleRow,
  type CuringMotorData,
} from "../../../../../data/models/user/CuringMotorDataModel";
import { DateTimeField, TimeField } from "../../../../components/common/DateField";
import SchemaFileField from "../../../../components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import CasePrepDateField from "../CasePreparation/CasePrepDateField";
import CasePrepTextField from "../CasePreparation/CasePrepTextField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
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
  disabled?: boolean;
  theme?: any;
};

const BRAND = CASTING_CURING_BRAND;

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

const CompactDate = ({
  value,
  onChange,
  disabled,
  theme,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  theme: any;
}) => (
  <Box sx={{ minWidth: 0, "& > .MuiBox-root": { minWidth: 0, maxWidth: "100%" } }}>
    <CasePrepDateField
      label=""
      value={value}
      onChange={onChange}
      disabled={disabled}
      theme={theme}
    />
  </Box>
);

const CuringMotorPanel = ({
  value,
  onChange,
  motorId: _motorId,
  disabled = false,
  theme,
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const seededCyclesRef = useRef(false);

  // Schema allowAdd is false — still seed 3 empty rows when table is empty
  useEffect(() => {
    if (seededCyclesRef.current) return;
    const rows = valueRef.current.CURING_CYCLES.CURING_TABLE ?? [];
    if (rows.length) {
      seededCyclesRef.current = true;
      return;
    }
    seededCyclesRef.current = true;
    onChangeRef.current({
      ...valueRef.current,
      CURING_CYCLES: {
        CURING_TABLE: [
          createEmptyCuringCycleRow(1),
          createEmptyCuringCycleRow(2),
          createEmptyCuringCycleRow(3),
        ],
      },
    });
  }, []);

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
    const rows = value.CURING_CYCLES.CURING_TABLE.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("CURING_CYCLES", { CURING_TABLE: rows });
  };

  const cycles =
    value.CURING_CYCLES.CURING_TABLE?.length > 0
      ? value.CURING_CYCLES.CURING_TABLE
      : createEmptyCuringMotorData().CURING_CYCLES.CURING_TABLE;

  const post = value.POST_CURING_DETAILS;
  const decor = value.DECORING_DETAILS;

  return (
    <Box>
      <SectionCard title="Curing Cycles" theme={theme}>
        <TableContainer sx={{ ...castingCuringTableContainerSx, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                {[
                  "S.No",
                  "Temperature (°C)",
                  "Time (min)",
                  "Start Date",
                  "Start Time",
                  "End Date",
                  "End Time",
                  "Propellant Pressure (bar)",
                  "Status Of Hot Water Circulation",
                ].map((label, idx) => (
                  <TableCell key={label} sx={castingCuringTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cycles.map((row, index) => (
                <TableRow key={`cycle-${index}`} sx={castingCuringTableRowSx(index)}>
                  <TableCell sx={{ ...castingCuringTableCellSx, fontWeight: 600 }}>
                    {row.srNo || index + 1}
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableTextInput
                      value={row.TEMPERATURE}
                      onChange={(v) => updateCycleRow(index, { TEMPERATURE: v })}
                      disabled={disabled}
                      type="number"
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableTextInput
                      value={row.TIME}
                      onChange={(v) => updateCycleRow(index, { TIME: v })}
                      disabled={disabled}
                      type="number"
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactDate
                      value={row.START_DATE}
                      onChange={(v) => updateCycleRow(index, { START_DATE: v })}
                      disabled={disabled}
                      theme={theme}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactTime
                      value={row.START_TIME}
                      onChange={(v) => updateCycleRow(index, { START_TIME: v })}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactDate
                      value={row.END_DATE}
                      onChange={(v) => updateCycleRow(index, { END_DATE: v })}
                      disabled={disabled}
                      theme={theme}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <CompactTime
                      value={row.END_TIME}
                      onChange={(v) => updateCycleRow(index, { END_TIME: v })}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TableTextInput
                      value={row.PROPELLANT_PRESSURE}
                      onChange={(v) => updateCycleRow(index, { PROPELLANT_PRESSURE: v })}
                      disabled={disabled}
                      type="number"
                    />
                  </TableCell>
                  <TableCell sx={castingCuringTableCellSx}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={row.HOT_WATER_STATUS ?? ""}
                      disabled={disabled}
                      onChange={(e) =>
                        updateCycleRow(index, { HOT_WATER_STATUS: e.target.value })
                      }
                      sx={castingCuringTableInputSx}
                      SelectProps={{ displayEmpty: true }}
                    >
                      <MenuItem value="">
                        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                          Select
                        </Typography>
                      </MenuItem>
                      {HOT_WATER_STATUS_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
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
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={post.OTHER_OBSERVATIONS}
              disabled={disabled}
              placeholder="Any other observations"
              onChange={(e) =>
                patchSection("POST_CURING_DETAILS", { OTHER_OBSERVATIONS: e.target.value })
              }
              sx={castingCuringTableInputSx}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabel>Visual Observation Of Cured Motor</FieldLabel>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={post.VISUAL_OBSERVATION}
              disabled={disabled}
              placeholder="Visual observation"
              onChange={(e) =>
                patchSection("POST_CURING_DETAILS", { VISUAL_OBSERVATION: e.target.value })
              }
              sx={castingCuringTableInputSx}
            />
          </Box>
          <Box>
            <FieldLabel>Date/Time For Removal Of Pressure Plate</FieldLabel>
            <CompactDateTime
              value={post.PRESSURE_PLATE_REMOVAL_DATE_TIME}
              onChange={(v) =>
                patchSection("POST_CURING_DETAILS", {
                  PRESSURE_PLATE_REMOVAL_DATE_TIME: v,
                })
              }
              disabled={disabled}
            />
          </Box>
          <CasePrepTextField
            label="Hardness (Shore A)"
            value={post.SHORE_A_HARDNESS}
            onChange={(v) => patchSection("POST_CURING_DETAILS", { SHORE_A_HARDNESS: v })}
            disabled={disabled}
            theme={theme}
            width="100%"
            placeholder="0"
          />
          <Box>
            <FieldLabel>Date/Time Of Dispatch For De-coring</FieldLabel>
            <CompactDateTime
              value={post.DE_CORING_DISPATCH_DATE_TIME}
              onChange={(v) =>
                patchSection("POST_CURING_DETAILS", {
                  DE_CORING_DISPATCH_DATE_TIME: v,
                })
              }
              disabled={disabled}
            />
          </Box>
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Section D: De-coring Details" theme={theme} mb={0}>
        <FieldGrid columns={3}>
          <CasePrepDateField
            label="Date Of De-coring"
            value={decor.DECORING_DATE}
            onChange={(v) => patchSection("DECORING_DETAILS", { DECORING_DATE: v })}
            disabled={disabled}
            theme={theme}
          />
          <CasePrepTextField
            label="Building No"
            value={decor.BUILDING_NO}
            onChange={(v) => patchSection("DECORING_DETAILS", { BUILDING_NO: v })}
            disabled={disabled}
            theme={theme}
            width="100%"
          />
          <CasePrepTextField
            label="De-coring Load (kg)"
            value={decor.DECORING_LOAD}
            onChange={(v) => patchSection("DECORING_DETAILS", { DECORING_LOAD: v })}
            disabled={disabled}
            theme={theme}
            width="100%"
            placeholder="0"
          />
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <FieldLabel>Remarks</FieldLabel>
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={decor.DECORING_REMARKS}
              disabled={disabled}
              placeholder="Remarks"
              onChange={(e) =>
                patchSection("DECORING_DETAILS", { DECORING_REMARKS: e.target.value })
              }
              sx={castingCuringTableInputSx}
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
            <SchemaFileField
              label="Visual Observations"
              value={toFileFieldValue(decor.DECORING_VISUAL_OBSERVATION)}
              onChange={(next) =>
                patchSection("DECORING_DETAILS", { DECORING_VISUAL_OBSERVATION: next })
              }
              disabled={disabled}
              multiple
              accept={FILE_PICKER_ACCEPT.IMAGE_VIDEO}
              emptyLabel="Upload photos or videos"
            />
          </Box>
        </FieldGrid>
      </SectionCard>
    </Box>
  );
};

export default CuringMotorPanel;

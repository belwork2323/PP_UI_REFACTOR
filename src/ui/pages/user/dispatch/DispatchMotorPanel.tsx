import {
  Box,
  Button,
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
  DISPATCH_YES_NO_OPTIONS,
  nextFmColumnId,
  type DispatchCheckPointRow,
  type DispatchMotorData,
  type DispatchPackingRow,
  type DispatchParameterRow,
  type DispatchPropellantRow,
} from "../../../../data/models/user/DispatchMotorDataModel";
import DispatchFileField from "./DispatchFileField";
import { STRINGS } from "../../../../app/config/strings";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  TableSelectInput,
  TableTextInput,
  dispatchTableCellSx,
  dispatchTableContainerSx,
  dispatchTableHeaderCellSx,
  dispatchTableInputSx,
  dispatchTableRowSx,
} from "./DispatchFormPrimitives";

type Props = {
  value: DispatchMotorData;
  onChange: (next: DispatchMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
};

const patch = <K extends keyof DispatchMotorData>(
  value: DispatchMotorData,
  key: K,
  partial: Partial<DispatchMotorData[K]>,
): DispatchMotorData => ({
  ...value,
  [key]: { ...value[key], ...partial },
});

const PropellantTable = ({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: DispatchMotorData["PROPELLANT_PROPERTIES"];
  onChange: (next: DispatchMotorData["PROPELLANT_PROPERTIES"]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const updateRow = (index: number, partial: Partial<DispatchPropellantRow>) => {
    onChange({
      ...value,
      rows: value.rows.map((row, i) => (i === index ? { ...row, ...partial } : row)),
    });
  };

  const updateFm = (rowIndex: number, col: string, cell: string) => {
    onChange({
      ...value,
      rows: value.rows.map((row, i) =>
        i === rowIndex ? { ...row, fmValues: { ...row.fmValues, [col]: cell } } : row,
      ),
    });
  };

  const addColumn = () => {
    const col = nextFmColumnId(value.fmColumns);
    onChange({
      fmColumns: [...value.fmColumns, col],
      rows: value.rows.map((row) => ({
        ...row,
        fmValues: { ...row.fmValues, [col]: row.fmValues[col] ?? "" },
      })),
    });
  };

  const deleteColumn = (col: string) => {
    if (value.fmColumns.length <= 1) return;
    onChange({
      fmColumns: value.fmColumns.filter((entry) => entry !== col),
      rows: value.rows.map((row) => {
        const next = { ...row.fmValues };
        delete next[col];
        return { ...row, fmValues: next };
      }),
    });
  };

  let serial = 0;

  return (
    <Box>
      {!readOnly ? (
        <Stack direction="row" justifyContent="flex-end" gap={1} mb={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddRoundedIcon />}
            disabled={disabled}
            onClick={addColumn}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem" }}
          >
            Add Column
          </Button>
        </Stack>
      ) : null}
      <TableContainer sx={{ ...dispatchTableContainerSx, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={dispatchTableHeaderCellSx(true)}>Sr. No.</TableCell>
              <TableCell sx={dispatchTableHeaderCellSx(false)}>Properties</TableCell>
              <TableCell sx={dispatchTableHeaderCellSx(false)}>Specs</TableCell>
              {value.fmColumns.map((col, idx) => (
                <TableCell key={col} sx={dispatchTableHeaderCellSx(false)}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" gap={0.5}>
                    <span>{col.replace("_", " ")}</span>
                    {!readOnly && value.fmColumns.length > 1 ? (
                      <IconButton size="small" onClick={() => deleteColumn(col)} disabled={disabled}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    ) : null}
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {value.rows.map((row, index) => {
              if (row.rowType === "header") {
                return (
                  <TableRow key={`prop-header-${index}`}>
                    <TableCell
                      colSpan={3 + value.fmColumns.length}
                      sx={{ ...dispatchTableCellSx, fontWeight: 800, background: "rgba(27,79,114,0.06)" }}
                    >
                      {row.headerLabel}
                    </TableCell>
                  </TableRow>
                );
              }
              serial += 1;
              return (
                <TableRow key={`prop-${index}`} sx={dispatchTableRowSx(index)}>
                  <TableCell sx={{ ...dispatchTableCellSx, fontWeight: 600 }}>{serial}</TableCell>
                  <TableCell sx={{ ...dispatchTableCellSx, fontWeight: 600 }}>{row.PROPERTY}</TableCell>
                  <TableCell sx={dispatchTableCellSx}>
                    <TableTextInput
                      value={row.SPECIFICATION}
                      onChange={(next) => updateRow(index, { SPECIFICATION: next })}
                      disabled={disabled}
                      readOnly={readOnly}
                    />
                  </TableCell>
                  {value.fmColumns.map((col) => (
                    <TableCell key={`${index}-${col}`} sx={dispatchTableCellSx}>
                      <TableTextInput
                        value={row.fmValues[col] ?? ""}
                        onChange={(next) => updateFm(index, col, next)}
                        disabled={disabled}
                        readOnly={readOnly}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const ObservationTable = ({
  rows,
  labelKey,
  onChange,
  disabled,
  readOnly,
  labelHeader,
}: {
  rows: DispatchParameterRow[] | DispatchCheckPointRow[] | DispatchPackingRow[];
  labelKey: "PARAMETER" | "CHECK_POINT" | "NOMENCLATURE";
  onChange: (rows: DispatchParameterRow[] | DispatchCheckPointRow[] | DispatchPackingRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  labelHeader: string;
}) => {
  let serial = 0;
  return (
    <TableContainer sx={dispatchTableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={dispatchTableHeaderCellSx(true)}>Sr. No.</TableCell>
            <TableCell sx={dispatchTableHeaderCellSx(false)}>{labelHeader}</TableCell>
            <TableCell sx={dispatchTableHeaderCellSx(false)}>Observations</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            if ("rowType" in row && row.rowType === "header") {
              return (
                <TableRow key={`hdr-${index}`}>
                  <TableCell
                    colSpan={3}
                    sx={{ ...dispatchTableCellSx, fontWeight: 800, background: "rgba(27,79,114,0.06)" }}
                  >
                    {(row as DispatchParameterRow).headerLabel}
                  </TableCell>
                </TableRow>
              );
            }
            serial += 1;
            const label = String(row[labelKey as keyof typeof row] ?? "");
            return (
              <TableRow key={`row-${index}`} sx={dispatchTableRowSx(index)}>
                <TableCell sx={{ ...dispatchTableCellSx, fontWeight: 600 }}>{serial}</TableCell>
                <TableCell sx={{ ...dispatchTableCellSx, fontWeight: 600 }}>{label}</TableCell>
                <TableCell sx={dispatchTableCellSx}>
                  <TableTextInput
                    value={String(row.OBSERVATION ?? "")}
                    onChange={(next) =>
                      onChange(
                        rows.map((entry, i) =>
                          i === index ? { ...entry, OBSERVATION: next } : entry,
                        ),
                      )
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                    multiline
                    minRows={2}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DispatchMotorPanel = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  theme,
}: Props) => (
  <Box>
    <SectionCard title="Propellant Properties Details" theme={theme}>
      <PropellantTable
        value={value.PROPELLANT_PROPERTIES}
        onChange={(next) => onChange(patch(value, "PROPELLANT_PROPERTIES", next))}
        disabled={disabled}
        readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Waiver Details" theme={theme}>
      <FieldLabel>Waiver Details, if any</FieldLabel>
      <TableTextInput
        value={value.WAIVER_DETAILS.WAIVER_AVAILABLE}
        onChange={(next) =>
          onChange(patch(value, "WAIVER_DETAILS", { WAIVER_AVAILABLE: next }))
        }
        disabled={disabled}
        readOnly={readOnly}
        multiline
        minRows={3}
        placeholder="Enter waiver details"
      />
    </SectionCard>

    <SectionCard title="Rocket Motor Inspection" theme={theme}>
      <ObservationTable
        rows={value.ROCKET_MOTOR_INSPECTION.rows}
        labelKey="PARAMETER"
        labelHeader="Parameter"
        onChange={(rows) =>
          onChange(patch(value, "ROCKET_MOTOR_INSPECTION", { rows: rows as DispatchParameterRow[] }))
        }
        disabled={disabled}
        readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Vehicle Details" theme={theme}>
      <ObservationTable
        rows={value.VEHICLE_DETAILS.rows}
        labelKey="CHECK_POINT"
        labelHeader="Check Point"
        onChange={(rows) =>
          onChange(patch(value, "VEHICLE_DETAILS", { rows: rows as DispatchCheckPointRow[] }))
        }
        disabled={disabled}
        readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Rocket Motor Packing Details" theme={theme}>
      <ObservationTable
        rows={value.ROCKET_MOTOR_PACKING.tableRows}
        labelKey="NOMENCLATURE"
        labelHeader="Nomenclature"
        onChange={(rows) =>
          onChange(
            patch(value, "ROCKET_MOTOR_PACKING", {
              tableRows: rows as DispatchPackingRow[],
            }),
          )
        }
        disabled={disabled}
        readOnly={readOnly}
      />
      <FieldGrid columns={2}>
        <Box>
          <FieldLabel>Nitrogen gas purging</FieldLabel>
          <TableSelectInput
            value={value.ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING}
            onChange={(next) =>
              onChange(
                patch(value, "ROCKET_MOTOR_PACKING", {
                  NITROGEN_GAS_PURGING: next,
                  NITROGEN_PURGING_PRESSURE:
                    next === "YES" ? value.ROCKET_MOTOR_PACKING.NITROGEN_PURGING_PRESSURE : "",
                }),
              )
            }
            options={DISPATCH_YES_NO_OPTIONS}
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
        {value.ROCKET_MOTOR_PACKING.NITROGEN_GAS_PURGING === "YES" ? (
          <Box>
            <FieldLabel>If Yes — Enter Pressure</FieldLabel>
            <TableTextInput
              value={value.ROCKET_MOTOR_PACKING.NITROGEN_PURGING_PRESSURE}
              onChange={(next) =>
                onChange(patch(value, "ROCKET_MOTOR_PACKING", { NITROGEN_PURGING_PRESSURE: next }))
              }
              disabled={disabled}
              readOnly={readOnly}
            />
          </Box>
        ) : null}
        <Box>
          <FieldLabel>Labelling of motor</FieldLabel>
          <TableSelectInput
            value={value.ROCKET_MOTOR_PACKING.LABELLING_OF_MOTOR}
            onChange={(next) =>
              onChange(patch(value, "ROCKET_MOTOR_PACKING", { LABELLING_OF_MOTOR: next }))
            }
            options={DISPATCH_YES_NO_OPTIONS}
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
      </FieldGrid>
      <Box sx={{ mt: 1.5 }}>
        <DispatchFileField
          label="Upload Dispatch Photos"
          files={value.ROCKET_MOTOR_PACKING.DISPATCH_PHOTOS}
          onChange={(next) =>
            onChange(patch(value, "ROCKET_MOTOR_PACKING", { DISPATCH_PHOTOS: next }))
          }
          disabled={disabled}
          readOnly={readOnly}
          multiple
          acceptMode="imageVideo"
        />
      </Box>
    </SectionCard>

    <SectionCard title="Safety Clearance" theme={theme}>
      <FieldGrid columns={2}>
        <Box>
          <FieldLabel>Safety Clearance for Dispatch Accorded</FieldLabel>
          <TableSelectInput
            value={value.SAFETY_CLEARANCE.SAFETY_CLEARANCE_STATUS}
            onChange={(next) =>
              onChange(patch(value, "SAFETY_CLEARANCE", { SAFETY_CLEARANCE_STATUS: next }))
            }
            options={DISPATCH_YES_NO_OPTIONS}
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <DispatchFileField
            label="Upload Clearance Certificate"
            files={value.SAFETY_CLEARANCE.CLEARANCE_CERTIFICATE}
            onChange={(next) =>
              onChange(patch(value, "SAFETY_CLEARANCE", { CLEARANCE_CERTIFICATE: next }))
            }
            disabled={disabled}
            readOnly={readOnly}
            multiple={false}
            acceptMode="imageVideoPdf"
            emptyLabel={STRINGS.DISPATCH.FILE_EMPTY_CERTIFICATE}
          />
        </Box>
      </FieldGrid>
    </SectionCard>

    <SectionCard title="Dispatch Team" theme={theme} mb={0}>
      <FieldGrid columns={3}>
        <Box>
          <FieldLabel>QA Rep.</FieldLabel>
          <TableTextInput
            value={value.DISPATCH_TEAM.QA_REPRESENTATIVE}
            onChange={(next) =>
              onChange(patch(value, "DISPATCH_TEAM", { QA_REPRESENTATIVE: next }))
            }
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>Safety Rep.</FieldLabel>
          <TableTextInput
            value={value.DISPATCH_TEAM.SAFETY_REPRESENTATIVE}
            onChange={(next) =>
              onChange(patch(value, "DISPATCH_TEAM", { SAFETY_REPRESENTATIVE: next }))
            }
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>Project Rep.</FieldLabel>
          <TableTextInput
            value={value.DISPATCH_TEAM.PROJECT_REPRESENTATIVE}
            onChange={(next) =>
              onChange(patch(value, "DISPATCH_TEAM", { PROJECT_REPRESENTATIVE: next }))
            }
            disabled={disabled}
            readOnly={readOnly}
          />
        </Box>
      </FieldGrid>
    </SectionCard>
  </Box>
);

export default DispatchMotorPanel;

import { useCallback, useMemo, type ReactNode } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import DateField from "../../../../components/common/DateField";
import QCDivisionFileField from "./QCDivisionFileField";
import {
  QC_POST_CURE_FIELD_LABELS,
  QC_POST_CURE_GROUP_TITLES,
  QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
  QC_POST_CURE_IR1_QUALIFICATION_PRESET,
  QC_POST_CURE_LF_QUALIFICATION_PRESET,
  QC_POST_CURE_SECTION_IDS,
  QC_POST_CURE_SECTION_TITLES,
  QC_POST_CURE_SUB_TYPE_INHIBITION,
  QC_POST_CURE_SUB_TYPE_LOOSE_FLAP,
  QC_POST_CURE_TABLE_IDS,
  getQcPostCureMotorLabel,
  normalizeQcInhibitorType,
  type QcPostCureLocationRow,
  type QcPostCureQualificationRow,
} from "../../../../../hooks/user/qualityControl/qcPostCureConfig";
import {
  getPostCureField,
  getPostCureFileField,
  getPostCureLocationRows,
  getPostCureQualificationRows,
  setPostCureField,
  setPostCureFileField,
  setPostCureLocationRows,
  setPostCureQualificationRows,
} from "../../../../../hooks/user/qualityControl/qcPostCureTables";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";

const BRAND = QC_DIVISION_BRAND;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);
const HEADER_CELL_BORDER = alpha("#fff", 0.22);

const TH = {
  ...uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
    headerFontSize: "0.68rem",
    headerLetterSpacing: "0.06em",
    headerPaddingY: "10px",
    headerPaddingX: "12px",
  }),
  border: `1px solid ${HEADER_CELL_BORDER}`,
};

const cellSx = {
  fontSize: "0.72rem",
  py: 0.75,
  px: 0.75,
  verticalAlign: "middle",
  border: `1px solid ${TABLE_BORDER}`,
};

const tableFieldSx = { "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } };

const tableDateFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "32px",
    height: "32px",
  },
  "& .MuiOutlinedInput-input": {
    py: "4px",
    fontSize: "0.72rem",
  },
};

type FieldRowProps = {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
};

const FieldRow = ({ label, children, readOnly = false }: FieldRowProps) => (
  <Stack spacing={0.5} sx={{ width: "100%" }}>
    <Typography
      sx={{
        fontSize: readOnly ? "0.65rem" : "0.72rem",
        fontWeight: readOnly ? 800 : 700,
        letterSpacing: readOnly ? "0.02em" : undefined,
        textTransform: readOnly ? "uppercase" : undefined,
        color: readOnly ? BRAND.primary : BRAND.textSub,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ width: "100%", minWidth: 0 }}>{children}</Box>
  </Stack>
);

const SectionCard = ({
  title,
  children,
  readOnly = false,
}: {
  title: string;
  children: ReactNode;
  readOnly?: boolean;
}) =>
  readOnly ? (
    <Box
      sx={{
        border: `1px solid ${BRAND.border}`,
        borderRadius: 1,
        background: "#fff",
        p: 1.5,
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: BRAND.primary, mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  ) : (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${TABLE_BORDER}`,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 0.85,
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );

type LocationColumnId = "LOCATION" | "FROM_DATE" | "TO_DATE" | "QTY_FILLED" | "QTY_APPLIED" | "OBSERVATIONS";

const LocationTable = ({
  title,
  rows,
  onChange,
  columns,
  readOnly = false,
  disabled = false,
}: {
  title: string;
  rows: QcPostCureLocationRow[];
  onChange: (rows: QcPostCureLocationRow[]) => void;
  columns: Array<{ id: LocationColumnId; label: string }>;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;

  const updateCell = (index: number, field: LocationColumnId, value: string) => {
    onChange(
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  };

  return (
    <Box>
      {title ? (
        <Typography
          sx={{
            fontSize: readOnly ? "0.65rem" : "0.72rem",
            fontWeight: readOnly ? 800 : 700,
            letterSpacing: readOnly ? "0.02em" : undefined,
            textTransform: readOnly ? "uppercase" : undefined,
            color: readOnly ? BRAND.primary : BRAND.textSub,
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
      ) : null}
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 1,
                overflowX: "auto",
              }
        }
      >
        <Table size="small" sx={{ minWidth: 560, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>Sr No</TableCell>
              {columns.map((column) => (
                <TableCell key={column.id} sx={headerSx}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`${row.LOCATION}-${row.SR_NO}`}
                sx={{
                  background: readOnly
                    ? index % 2 === 0
                      ? "#fff"
                      : alpha(BRAND.primaryLight, 0.04)
                    : undefined,
                }}
              >
                <TableCell sx={bodyCellSx}>
                  {readOnly ? <QCDivisionReadOnlyValue value={row.SR_NO} /> : row.SR_NO}
                </TableCell>
                {columns.map((column) => {
                  const value = String(row[column.id] ?? "");
                  const isStatic = column.id === "LOCATION";
                  return (
                    <TableCell key={column.id} sx={bodyCellSx}>
                      {readOnly || isStatic ? (
                        <QCDivisionReadOnlyValue value={value} muted={!value.trim()} />
                      ) : column.id === "FROM_DATE" || column.id === "TO_DATE" ? (
                        <DateField
                          compact
                          value={value}
                          disabled={inputsDisabled}
                          onChange={(next) => updateCell(index, column.id, next)}
                          inputSx={tableDateFieldSx}
                        />
                      ) : column.id === "OBSERVATIONS" ? (
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          minRows={1}
                          value={value}
                          disabled={inputsDisabled}
                          onChange={(event) => updateCell(index, column.id, event.target.value)}
                          sx={tableFieldSx}
                        />
                      ) : (
                        <TextField
                          size="small"
                          fullWidth
                          type={
                            column.id === "QTY_FILLED" || column.id === "QTY_APPLIED"
                              ? "number"
                              : "text"
                          }
                          value={value}
                          disabled={inputsDisabled}
                          onChange={(event) => updateCell(index, column.id, event.target.value)}
                          sx={tableFieldSx}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const QualificationTable = ({
  title,
  rows,
  onChange,
  showQcReport = false,
  readOnly = false,
  disabled = false,
}: {
  title?: string;
  rows: QcPostCureQualificationRow[];
  onChange: (rows: QcPostCureQualificationRow[]) => void;
  showQcReport?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;

  const updateCell = (
    index: number,
    field: "RESULT" | "QC_REPORT",
    value: string | FileRef[],
  ) => {
    onChange(
      rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  };

  return (
    <Box>
      {title ? (
        <Typography
          sx={{
            fontSize: readOnly ? "0.65rem" : "0.72rem",
            fontWeight: readOnly ? 800 : 700,
            letterSpacing: readOnly ? "0.02em" : undefined,
            textTransform: readOnly ? "uppercase" : undefined,
            color: readOnly ? BRAND.primary : BRAND.textSub,
            mb: 0.75,
          }}
        >
          {title}
        </Typography>
      ) : null}
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : {
                border: `1px solid ${TABLE_BORDER}`,
                borderRadius: 1,
                overflowX: "auto",
              }
        }
      >
        <Table size="small" sx={{ minWidth: 520, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>Sr No</TableCell>
              <TableCell sx={headerSx}>Parameter</TableCell>
              <TableCell sx={headerSx}>Specification</TableCell>
              <TableCell sx={headerSx}>Result</TableCell>
              {showQcReport ? <TableCell sx={headerSx}>Upload QC Report</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={`${row.PARAMETER}-${row.SR_NO}`}
                sx={{
                  background: readOnly
                    ? index % 2 === 0
                      ? "#fff"
                      : alpha(BRAND.primaryLight, 0.04)
                    : undefined,
                }}
              >
                <TableCell sx={bodyCellSx}>
                  {readOnly ? <QCDivisionReadOnlyValue value={row.SR_NO} /> : row.SR_NO}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <QCDivisionReadOnlyValue value={row.PARAMETER} />
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <QCDivisionReadOnlyValue value={row.SPECIFICATION} />
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {readOnly ? (
                    <QCDivisionReadOnlyValue value={row.RESULT} muted={!row.RESULT.trim()} />
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      value={row.RESULT}
                      disabled={inputsDisabled}
                      onChange={(event) => updateCell(index, "RESULT", event.target.value)}
                      sx={tableFieldSx}
                    />
                  )}
                </TableCell>
                {showQcReport ? (
                  <TableCell sx={bodyCellSx}>
                    <QCDivisionFileField
                      files={Array.isArray(row.QC_REPORT) ? row.QC_REPORT : []}
                      onChange={(next) => updateCell(index, "QC_REPORT", next)}
                      disabled={inputsDisabled}
                      readOnly={readOnly}
                      multiple={false}
                      acceptMode="pdf"
                      compact
                      emptyLabel="Upload"
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const TextOrReadOnly = ({
  value,
  onChange,
  readOnly,
  disabled,
  multiline = false,
  type = "text",
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  disabled: boolean;
  multiline?: boolean;
  type?: string;
}) =>
  readOnly ? (
    <QCDivisionReadOnlyValue value={value} muted={!value.trim()} />
  ) : (
    <TextField
      size="small"
      fullWidth
      type={type}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      sx={tableFieldSx}
    />
  );

const DateOrReadOnly = ({
  value,
  onChange,
  readOnly,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  disabled: boolean;
}) =>
  readOnly ? (
    <QCDivisionReadOnlyValue value={value} muted={!value.trim()} />
  ) : (
    <DateField
      compact
      value={value}
      disabled={disabled}
      onChange={onChange}
      inputSx={tableDateFieldSx}
    />
  );

const FileOrReadOnly = ({
  files,
  onChange,
  readOnly,
  disabled,
}: {
  files: FileRef[];
  onChange: (next: FileRef[]) => void;
  readOnly: boolean;
  disabled: boolean;
}) => (
  <QCDivisionFileField
    files={files}
    onChange={onChange}
    disabled={disabled}
    readOnly={readOnly}
    multiple
    acceptMode="pdf"
    emptyLabel="Upload"
  />
);

type QCPostCureMotorPanelProps = {
  motorId?: string | null;
  subType?: string | null;
  inhibitorType?: string | null;
  values: SchemaFormValues;
  onChange: (
    values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues),
  ) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
};

const QCPostCureMotorPanel = ({
  motorId,
  subType,
  inhibitorType,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
}: QCPostCureMotorPanelProps) => {
  const inputsDisabled = disabled || readOnly;
  const isLooseFlap = subType === QC_POST_CURE_SUB_TYPE_LOOSE_FLAP;
  const isInhibition = subType === QC_POST_CURE_SUB_TYPE_INHIBITION;
  const normalizedInhibitor = normalizeQcInhibitorType(inhibitorType);
  const isIr1 = isInhibition && normalizedInhibitor === "IR1";
  const isHemcoat = isInhibition && normalizedInhibitor === "HEMCOAT-3K";
  const isNotApplicable = isInhibition && normalizedInhibitor === "NOT_APPLICABLE";

  const looseSection = QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING;
  const ir1Section = QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION;
  const hemcoatSection = QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION;
  const appSection = QC_POST_CURE_SECTION_IDS.APPLICATION;
  const naSection = QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE;

  const patchValues = useCallback(
    (patch: (prev: SchemaFormValues) => SchemaFormValues) => {
      onChange((prev) => patch(prev ?? {}));
    },
    [onChange],
  );

  const patchFileField = useCallback(
    (sectionId: string, field: string, next: FileRef[]) => {
      patchValues((prev) => setPostCureFileField(prev, sectionId, field, next));
    },
    [patchValues],
  );

  const bellowRows = useMemo(
    () => getPostCureLocationRows(values, looseSection, QC_POST_CURE_TABLE_IDS.BELLOW_BONDING),
    [looseSection, values],
  );
  const lfQualRows = useMemo(
    () =>
      getPostCureQualificationRows(
        values,
        looseSection,
        QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION,
        QC_POST_CURE_LF_QUALIFICATION_PRESET,
      ),
    [looseSection, values],
  );
  const lfFillingRows = useMemo(
    () =>
      getPostCureLocationRows(
        values,
        looseSection,
        QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING,
        "QTY_FILLED",
      ),
    [looseSection, values],
  );
  const ir1QualRows = useMemo(
    () =>
      getPostCureQualificationRows(
        values,
        ir1Section,
        QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION,
        QC_POST_CURE_IR1_QUALIFICATION_PRESET,
      ),
    [ir1Section, values],
  );
  const hemcoatQualRows = useMemo(
    () =>
      getPostCureQualificationRows(
        values,
        hemcoatSection,
        QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION,
        QC_POST_CURE_HEMCOAT_QUALIFICATION_PRESET,
      ),
    [hemcoatSection, values],
  );
  const applicationRows = useMemo(
    () =>
      getPostCureLocationRows(values, appSection, QC_POST_CURE_TABLE_IDS.APPLICATION, "QTY_APPLIED"),
    [appSection, values],
  );

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcPostCureMotorLabel(motorId, subType, inhibitorType)}
        </Typography>
        {headerActions}
      </Stack>

      <Stack spacing={1.5}>
        {isLooseFlap ? (
          <SectionCard
            title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.LOOSE_FLAP_FILLING]}
            readOnly={readOnly}
          >
            <Stack spacing={1.5}>
              <LocationTable
                title={QC_POST_CURE_GROUP_TITLES.BELLOW_BONDING}
                rows={bellowRows}
                onChange={(rows) =>
                  onChange(
                    setPostCureLocationRows(
                      values,
                      looseSection,
                      QC_POST_CURE_TABLE_IDS.BELLOW_BONDING,
                      rows,
                    ),
                  )
                }
                columns={[
                  { id: "LOCATION", label: "Location" },
                  { id: "FROM_DATE", label: "From Date" },
                  { id: "TO_DATE", label: "To Date" },
                  { id: "OBSERVATIONS", label: "Observations" },
                ]}
                readOnly={readOnly}
                disabled={inputsDisabled}
              />

              <Typography
                sx={{
                  fontSize: readOnly ? "0.65rem" : "0.72rem",
                  fontWeight: readOnly ? 800 : 700,
                  letterSpacing: readOnly ? "0.02em" : undefined,
                  textTransform: readOnly ? "uppercase" : undefined,
                  color: readOnly ? BRAND.primary : BRAND.textSub,
                }}
              >
                {QC_POST_CURE_GROUP_TITLES.LF_EPOXY_DETAILS}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Box sx={{ flex: 1 }}>
                  <FieldRow label={QC_POST_CURE_FIELD_LABELS.LF_EPOXY_BATCH_NO} readOnly={readOnly}>
                    <TextOrReadOnly
                      value={getPostCureField(values, looseSection, "LF_EPOXY_BATCH_NO")}
                      onChange={(next) =>
                        onChange(setPostCureField(values, looseSection, "LF_EPOXY_BATCH_NO", next))
                      }
                      readOnly={readOnly}
                      disabled={inputsDisabled}
                    />
                  </FieldRow>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldRow
                    label={QC_POST_CURE_FIELD_LABELS.LF_EPOXY_PREPARATION_DATE}
                    readOnly={readOnly}
                  >
                    <DateOrReadOnly
                      value={getPostCureField(values, looseSection, "LF_EPOXY_PREPARATION_DATE")}
                      onChange={(next) =>
                        onChange(
                          setPostCureField(values, looseSection, "LF_EPOXY_PREPARATION_DATE", next),
                        )
                      }
                      readOnly={readOnly}
                      disabled={inputsDisabled}
                    />
                  </FieldRow>
                </Box>
              </Stack>

              <QualificationTable
                title={QC_POST_CURE_GROUP_TITLES.LF_EPOXY_QUALIFICATION}
                rows={lfQualRows}
                onChange={(rows) =>
                  onChange(
                    setPostCureQualificationRows(
                      values,
                      looseSection,
                      QC_POST_CURE_TABLE_IDS.LF_EPOXY_QUALIFICATION,
                      rows,
                    ),
                  )
                }
                readOnly={readOnly}
                disabled={inputsDisabled}
              />

              <FieldRow label={QC_POST_CURE_FIELD_LABELS.LF_EPOXY_QC_REPORT} readOnly={readOnly}>
                <FileOrReadOnly
                  files={getPostCureFileField(values, looseSection, "LF_EPOXY_QC_REPORT")}
                  onChange={(next) => patchFileField(looseSection, "LF_EPOXY_QC_REPORT", next)}
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                />
              </FieldRow>

              <LocationTable
                title={QC_POST_CURE_GROUP_TITLES.LF_EPOXY_FILLING}
                rows={lfFillingRows}
                onChange={(rows) =>
                  onChange(
                    setPostCureLocationRows(
                      values,
                      looseSection,
                      QC_POST_CURE_TABLE_IDS.LF_EPOXY_FILLING,
                      rows,
                    ),
                  )
                }
                columns={[
                  { id: "LOCATION", label: "Location" },
                  { id: "FROM_DATE", label: "From Date" },
                  { id: "TO_DATE", label: "To Date" },
                  { id: "QTY_FILLED", label: "Qty Filled (g)" },
                  { id: "OBSERVATIONS", label: "Observations" },
                ]}
                readOnly={readOnly}
                disabled={inputsDisabled}
              />
            </Stack>
          </SectionCard>
        ) : null}

        {isIr1 ? (
          <>
            <SectionCard
              title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.IR1_QUALIFICATION]}
              readOnly={readOnly}
            >
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label={QC_POST_CURE_FIELD_LABELS.IR1_BATCH_NO} readOnly={readOnly}>
                      <TextOrReadOnly
                        value={getPostCureField(values, ir1Section, "IR1_BATCH_NO")}
                        onChange={(next) =>
                          onChange(setPostCureField(values, ir1Section, "IR1_BATCH_NO", next))
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow
                      label={QC_POST_CURE_FIELD_LABELS.IR1_PREPARATION_DATE}
                      readOnly={readOnly}
                    >
                      <DateOrReadOnly
                        value={getPostCureField(values, ir1Section, "IR1_PREPARATION_DATE")}
                        onChange={(next) =>
                          onChange(
                            setPostCureField(values, ir1Section, "IR1_PREPARATION_DATE", next),
                          )
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                </Stack>

                <QualificationTable
                  rows={ir1QualRows}
                  onChange={(rows) =>
                    onChange(
                      setPostCureQualificationRows(
                        values,
                        ir1Section,
                        QC_POST_CURE_TABLE_IDS.IR1_QUALIFICATION,
                        rows,
                      ),
                    )
                  }
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                />

                <FieldRow label={QC_POST_CURE_FIELD_LABELS.IR1_QC_REPORT} readOnly={readOnly}>
                  <FileOrReadOnly
                    files={getPostCureFileField(values, ir1Section, "IR1_QC_REPORT")}
                    onChange={(next) => patchFileField(ir1Section, "IR1_QC_REPORT", next)}
                    readOnly={readOnly}
                    disabled={inputsDisabled}
                  />
                </FieldRow>
              </Stack>
            </SectionCard>

            <SectionCard
              title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.APPLICATION]}
              readOnly={readOnly}
            >
              <Stack spacing={1.5}>
                <LocationTable
                  title=""
                  rows={applicationRows}
                  onChange={(rows) =>
                    onChange(
                      setPostCureLocationRows(
                        values,
                        appSection,
                        QC_POST_CURE_TABLE_IDS.APPLICATION,
                        rows,
                      ),
                    )
                  }
                  columns={[
                    { id: "LOCATION", label: "Location" },
                    { id: "FROM_DATE", label: "From Date" },
                    { id: "TO_DATE", label: "To Date" },
                    { id: "QTY_APPLIED", label: "Qty Applied (g)" },
                    { id: "OBSERVATIONS", label: "Observations" },
                  ]}
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_DATE} readOnly={readOnly}>
                      <DateOrReadOnly
                        value={getPostCureField(values, appSection, "DISPATCH_DATE")}
                        onChange={(next) =>
                          onChange(setPostCureField(values, appSection, "DISPATCH_DATE", next))
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_STATION} readOnly={readOnly}>
                      <TextOrReadOnly
                        value={getPostCureField(values, appSection, "DISPATCH_STATION")}
                        onChange={(next) =>
                          onChange(setPostCureField(values, appSection, "DISPATCH_STATION", next))
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                </Stack>
              </Stack>
            </SectionCard>
          </>
        ) : null}

        {isHemcoat ? (
          <>
            <SectionCard
              title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.HEMCOAT_QUALIFICATION]}
              readOnly={readOnly}
            >
              <Stack spacing={1.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow
                      label={QC_POST_CURE_FIELD_LABELS.HEMCOAT_3K_BATCH_NO}
                      readOnly={readOnly}
                    >
                      <TextOrReadOnly
                        value={getPostCureField(values, hemcoatSection, "HEMCOAT_3K_BATCH_NO")}
                        onChange={(next) =>
                          onChange(
                            setPostCureField(values, hemcoatSection, "HEMCOAT_3K_BATCH_NO", next),
                          )
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow
                      label={QC_POST_CURE_FIELD_LABELS.HEMCOAT_3K_PREPARATION_DATE}
                      readOnly={readOnly}
                    >
                      <DateOrReadOnly
                        value={getPostCureField(
                          values,
                          hemcoatSection,
                          "HEMCOAT_3K_PREPARATION_DATE",
                        )}
                        onChange={(next) =>
                          onChange(
                            setPostCureField(
                              values,
                              hemcoatSection,
                              "HEMCOAT_3K_PREPARATION_DATE",
                              next,
                            ),
                          )
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                </Stack>

                <QualificationTable
                  rows={hemcoatQualRows}
                  onChange={(rows) =>
                    onChange(
                      setPostCureQualificationRows(
                        values,
                        hemcoatSection,
                        QC_POST_CURE_TABLE_IDS.HEMCOAT_QUALIFICATION,
                        rows,
                      ),
                    )
                  }
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                />

                <FieldRow
                  label={QC_POST_CURE_FIELD_LABELS.HEMCOAT_3K_QC_REPORT}
                  readOnly={readOnly}
                >
                  <FileOrReadOnly
                    files={getPostCureFileField(values, hemcoatSection, "HEMCOAT_3K_QC_REPORT")}
                    onChange={(next) =>
                      patchFileField(hemcoatSection, "HEMCOAT_3K_QC_REPORT", next)
                    }
                    readOnly={readOnly}
                    disabled={inputsDisabled}
                  />
                </FieldRow>
              </Stack>
            </SectionCard>

            <SectionCard
              title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.APPLICATION]}
              readOnly={readOnly}
            >
              <Stack spacing={1.5}>
                <LocationTable
                  title=""
                  rows={applicationRows}
                  onChange={(rows) =>
                    onChange(
                      setPostCureLocationRows(
                        values,
                        appSection,
                        QC_POST_CURE_TABLE_IDS.APPLICATION,
                        rows,
                      ),
                    )
                  }
                  columns={[
                    { id: "LOCATION", label: "Location" },
                    { id: "FROM_DATE", label: "From Date" },
                    { id: "TO_DATE", label: "To Date" },
                    { id: "QTY_APPLIED", label: "Qty Applied (g)" },
                    { id: "OBSERVATIONS", label: "Observations" },
                  ]}
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_DATE} readOnly={readOnly}>
                      <DateOrReadOnly
                        value={getPostCureField(values, appSection, "DISPATCH_DATE")}
                        onChange={(next) =>
                          onChange(setPostCureField(values, appSection, "DISPATCH_DATE", next))
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_STATION} readOnly={readOnly}>
                      <TextOrReadOnly
                        value={getPostCureField(values, appSection, "DISPATCH_STATION")}
                        onChange={(next) =>
                          onChange(setPostCureField(values, appSection, "DISPATCH_STATION", next))
                        }
                        readOnly={readOnly}
                        disabled={inputsDisabled}
                      />
                    </FieldRow>
                  </Box>
                </Stack>
              </Stack>
            </SectionCard>
          </>
        ) : null}

        {isNotApplicable ? (
          <SectionCard
            title={QC_POST_CURE_SECTION_TITLES[QC_POST_CURE_SECTION_IDS.NOT_APPLICABLE]}
            readOnly={readOnly}
          >
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Box sx={{ flex: 1 }}>
                  <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_DATE} readOnly={readOnly}>
                    <DateOrReadOnly
                      value={getPostCureField(values, naSection, "DISPATCH_DATE")}
                      onChange={(next) =>
                        onChange(setPostCureField(values, naSection, "DISPATCH_DATE", next))
                      }
                      readOnly={readOnly}
                      disabled={inputsDisabled}
                    />
                  </FieldRow>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <FieldRow label={QC_POST_CURE_FIELD_LABELS.DISPATCH_STATION} readOnly={readOnly}>
                    <TextOrReadOnly
                      value={getPostCureField(values, naSection, "DISPATCH_STATION")}
                      onChange={(next) =>
                        onChange(setPostCureField(values, naSection, "DISPATCH_STATION", next))
                      }
                      readOnly={readOnly}
                      disabled={inputsDisabled}
                    />
                  </FieldRow>
                </Box>
              </Stack>
              <FieldRow label={QC_POST_CURE_FIELD_LABELS.REMARKS} readOnly={readOnly}>
                <TextOrReadOnly
                  value={getPostCureField(values, naSection, "REMARKS")}
                  onChange={(next) =>
                    onChange(setPostCureField(values, naSection, "REMARKS", next))
                  }
                  readOnly={readOnly}
                  disabled={inputsDisabled}
                  multiline
                />
              </FieldRow>
            </Stack>
          </SectionCard>
        ) : null}
      </Stack>
    </Box>
  );
};

export default QCPostCureMotorPanel;

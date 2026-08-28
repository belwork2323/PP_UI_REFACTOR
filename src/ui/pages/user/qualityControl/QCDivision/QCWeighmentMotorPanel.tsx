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
import DateField from "../../../../components/common/DateField";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import type { SchemaFormValues } from "../../../../../schema-engine";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import {
  QC_WEIGHMENT_FIELD_LABELS,
  QC_WEIGHMENT_PROPELLANT_FORMULA,
  QC_WEIGHMENT_PROPELLANT_FORMULA_NOTE,
  QC_WEIGHMENT_SECTION_TITLES,
  getQcWeighmentMotorLabel,
  type QcWeighmentWeightRow,
} from "../../../../../hooks/user/qualityControl/qcWeighmentConfig";
import {
  getWeighmentCalibrationDueDate,
  getWeighmentUploadReport,
  getWeighmentWeighscaleNo,
  getWeighmentWeightRows,
  setWeighmentCalibrationDueDate,
  setWeighmentUploadReport,
  setWeighmentWeighscaleNo,
  setWeighmentWeightRows,
} from "../../../../../hooks/user/qualityControl/qcWeighmentTables";
import QCDivisionFileField from "./QCDivisionFileField";
import {
  QCDivisionReadOnlyValue,
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import { uniformTableHeaderCellSx } from "@app/theme/custom_themes/shared/data_table_theme";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
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

const WeightDetailsTable = ({
  rows,
  onChange,
  readOnly = false,
  disabled = false,
}: {
  rows: QcWeighmentWeightRow[];
  onChange: (rows: QcWeighmentWeightRow[]) => void;
  readOnly?: boolean;
  disabled?: boolean;
}) => {
  const headerSx = readOnly ? qcReadOnlyTableHeaderCellSx : TH;
  const bodyCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const inputsDisabled = disabled || readOnly;

  const updateWeight = (index: number, value: string) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, WEIGHT_KG: value } : row)));
  };

  return (
    <Stack spacing={0.75}>
      <TableContainer
        sx={
          readOnly
            ? qcReadOnlyTableContainerSx
            : { border: `1px solid ${TABLE_BORDER}`, borderRadius: 1, overflowX: "auto" }
        }
      >
        <Table size="small" sx={{ minWidth: 520, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>{QC_WEIGHMENT_FIELD_LABELS.WEIGHT_PARAMETER}</TableCell>
              <TableCell sx={{ ...headerSx, width: 168 }}>{QC_WEIGHMENT_FIELD_LABELS.WEIGHT_KG}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const computed = Boolean(row.locked);
              return (
                <TableRow
                  key={row.SR_NO}
                  sx={{
                    background: readOnly
                      ? index % 2 === 0
                        ? "#fff"
                        : alpha(BRAND.primaryLight, 0.04)
                      : computed
                        ? alpha(BRAND.primaryLight, 0.06)
                        : undefined,
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: computed ? 700 : 600 }}>
                      {row.SR_NO}. {row.WEIGHT_PARAMETER}
                    </Typography>
                    {computed ? (
                      <Typography sx={{ fontSize: "0.64rem", color: BRAND.textSub, mt: 0.25 }}>
                        {QC_WEIGHMENT_PROPELLANT_FORMULA} ({QC_WEIGHMENT_PROPELLANT_FORMULA_NOTE})
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {readOnly || computed ? (
                      <QCDivisionReadOnlyValue value={row.WEIGHT_KG} muted={!row.WEIGHT_KG.trim()} />
                    ) : (
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={row.WEIGHT_KG}
                        disabled={inputsDisabled}
                        onChange={(event) => updateWeight(index, event.target.value)}
                        inputProps={{ step: "any" }}
                        sx={tableFieldSx}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

type QCWeighmentMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues)) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
};

const QCWeighmentMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
}: QCWeighmentMotorPanelProps) => {
  const inputsDisabled = disabled || readOnly;
  const weighscaleNo = getWeighmentWeighscaleNo(values);
  const calibrationDueDate = getWeighmentCalibrationDueDate(values);
  const rows = useMemo(() => getWeighmentWeightRows(values), [values]);
  const uploadReport = useMemo(() => getWeighmentUploadReport(values), [values]);

  const patchValues = useCallback(
    (updater: (prev: SchemaFormValues) => SchemaFormValues) => {
      onChange((prev) => updater(prev ?? {}));
    },
    [onChange],
  );

  const patchUploadReport = useCallback(
    (next: FileRef[]) => {
      patchValues((prev) => setWeighmentUploadReport(prev, next));
    },
    [patchValues],
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcWeighmentMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>
      <Stack spacing={1.5}>
      <SectionCard title={QC_WEIGHMENT_SECTION_TITLES.MOTOR_WEIGHT_DETAILS} readOnly={readOnly}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub, mb: 0.4 }}>
                {S.WEIGHMENT_WEIGHSCALE_NO_LABEL}
              </Typography>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={weighscaleNo} muted={!weighscaleNo.trim()} />
              ) : (
                <TextField
                  size="small"
                  fullWidth
                  value={weighscaleNo}
                  placeholder={S.WEIGHMENT_WEIGHSCALE_NO_PLACEHOLDER}
                  disabled={inputsDisabled}
                  onChange={(event) =>
                    patchValues((prev) => setWeighmentWeighscaleNo(prev, event.target.value))
                  }
                  sx={tableFieldSx}
                />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: BRAND.textSub, mb: 0.4 }}>
                {S.WEIGHMENT_CALIBRATION_DUE_DATE_LABEL}
              </Typography>
              {readOnly ? (
                <QCDivisionReadOnlyValue value={calibrationDueDate} muted={!calibrationDueDate.trim()} />
              ) : (
                <DateField
                  compact
                  value={calibrationDueDate}
                  disabled={inputsDisabled}
                  placeholder="DD-MM-YYYY"
                  onChange={(next) =>
                    patchValues((prev) => setWeighmentCalibrationDueDate(prev, next))
                  }
                  inputSx={tableDateFieldSx}
                />
              )}
            </Box>
          </Stack>
          <WeightDetailsTable
            rows={rows}
            onChange={(next) => patchValues((prev) => setWeighmentWeightRows(prev, next))}
            readOnly={readOnly}
            disabled={inputsDisabled}
          />
        </Stack>
      </SectionCard>
      <SectionCard title={QC_WEIGHMENT_SECTION_TITLES.ATTACHMENTS} readOnly={readOnly}>
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.primary, mb: 0.75 }}>
            {QC_WEIGHMENT_FIELD_LABELS.UPLOAD_REPORT}
          </Typography>
          <QCDivisionFileField
            files={uploadReport}
            onChange={patchUploadReport}
            disabled={inputsDisabled}
            readOnly={readOnly}
            multiple
            acceptMode="imageVideoPdf"
            emptyLabel="Upload"
          />
        </Box>
      </SectionCard>
      </Stack>
    </Box>
  );
};

export default QCWeighmentMotorPanel;

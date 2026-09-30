import type { HTMLAttributes, ReactNode } from "react";
import {
  Box,
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
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import { uniformTableHeaderCellSx, uniformTableBodyCellSx } from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

const BRAND = CASE_PREP_BRAND;

export const casePrepPlaceholderSx = {
  color: BRAND.textSub,
  opacity: 0.72,
  fontWeight: 400,
  fontSize: "0.68rem",
  lineHeight: 1.4,
};

export const casePrepFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    background: BRAND.surface,
    fontSize: "0.78rem",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.cpLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.cp, borderWidth: 2 },
    "&.Mui-focused": { background: "#fff" },
    "&.Mui-disabled": {
      background: alpha(BRAND.surface, 0.85),
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    fontSize: "0.78rem",
    "&::placeholder": casePrepPlaceholderSx,
  },
};

export const casePrepTableInputSx = {
  ...casePrepFieldSx,
  "& .MuiOutlinedInput-root": {
    ...casePrepFieldSx["& .MuiOutlinedInput-root"],
    background: "#fff",
    fontSize: "0.72rem",
    minHeight: 32,
  },
  "& .MuiInputBase-input": {
    fontWeight: 500,
    color: BRAND.text,
    fontSize: "0.72rem",
    py: "4px",
  },
};

export const casePrepTableContainerSx = {
  borderRadius: 1.5,
  border: `1px solid ${BRAND.border}`,
  overflow: "hidden",
};

export const casePrepTableHeaderCellSx = (_isLead = false) =>
  uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
    headerFontSize: "0.63rem",
    headerLetterSpacing: "0.05em",
  });

export const casePrepTableRowSx = (idx: number) => ({
  background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
});

export const casePrepTableCellSx = {
  ...uniformTableBodyCellSx(
    { border: BRAND.border, text: BRAND.text },
    { bodyFontSize: "0.82rem", bodyPaddingY: 1, bodyPaddingX: 1.25 },
  ),
};

export const casePrepHeaderRowSx = {
  background: alpha(BRAND.cp, 0.08),
};

type SectionCardProps = {
  title: string;
  children: ReactNode;
  theme?: any;
  mb?: number;
};

export const SectionCard = ({ title, children, theme, mb = 3 }: SectionCardProps) => {
  const details = theme?.manufacturing?.casePreparation?.details;
  return (
    <Box
      sx={{
        ...(details?.section ?? {
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(BRAND.border, 0.65)}`,
          background: "#fff",
        }),
        mb,
      }}
    >
      <Typography
        sx={
          details?.sectionTitle ?? {
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: BRAND.primaryLight,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }
        }
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export const SubsectionHeading = ({ children }: { children: ReactNode }) => (
  <Typography
    sx={{
      fontSize: "0.78rem",
      fontWeight: 800,
      color: BRAND.text,
      mb: 1.25,
      mt: 0.5,
    }}
  >
    {children}
  </Typography>
);

export const FieldLabel = ({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: 700,
      color: BRAND.cp,
      letterSpacing: "0.03em",
      mb: 0.65,
      display: "block",
    }}
  >
    {required && typeof children === "string" ? (
      <FieldLabelWithAsterisk label={children} required />
    ) : (
      children
    )}
  </Typography>
);

export const FieldGrid = ({
  children,
  columns = 3,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: columns >= 3 ? "1fr 1fr" : "1fr",
        md: `repeat(${columns}, 1fr)`,
      },
      gap: 1.5,
      mb: 1.5,
    }}
  >
    {children}
  </Box>
);

export const ReadOnlyField = ({
  label,
  value,
  error,
}: {
  label: string;
  value?: string | null;
  error?: string;
}) => (
  <Box>
    <FieldLabel>{label}</FieldLabel>
    <WorkflowReadOnlyText
      value={value}
      sx={{
        fontSize: "0.82rem",
        py: 0.75,
        ...(error
          ? {
              borderColor: "error.main",
              bgcolor: "rgba(211, 47, 47, 0.04)",
            }
          : null),
      }}
    />
    {error ? (
      <Typography sx={{ fontSize: "0.7rem", color: "error.main", mt: 0.5 }}>{error}</Typography>
    ) : null}
  </Box>
);

export const TableTextInput = ({
  value,
  onChange,
  placeholder = "",
  disabled = false,
  readOnly = false,
  type = "text",
  inputMode,
  multiline = false,
  minRows,
  dataCpField,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  multiline?: boolean;
  minRows?: number;
  /** Validation focus target (`data-cp-field`). */
  dataCpField?: string;
  /** Show invalid border (submit validation). */
  error?: boolean;
}) => {
  if (readOnly) {
    return (
      <Box {...(dataCpField ? { "data-cp-field": dataCpField } : {})}>
        <WorkflowReadOnlyText
          value={value}
          sx={
            error
              ? {
                  borderColor: "error.main",
                  bgcolor: "rgba(211, 47, 47, 0.04)",
                }
              : undefined
          }
        />
      </Box>
    );
  }

  return (
    <Box {...(dataCpField ? { "data-cp-field": dataCpField } : {})}>
      <TextField
        size="small"
        fullWidth
        type={type}
        inputMode={inputMode}
        multiline={multiline}
        minRows={minRows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        onChange={(event) => onChange(event.target.value)}
        sx={casePrepTableInputSx}
      />
    </Box>
  );
};

type ParameterTableColumn = {
  key: "parameter" | "value" | "remarks" | "observations";
  label: string;
  width?: string | number;
};

type ParameterTableRow = {
  parameter: string;
  value?: string;
  remarks?: string;
  observations?: string;
  valueFieldType?: string;
  readonly?: boolean;
};

type ParameterTableProps = {
  columns?: ParameterTableColumn[];
  rows: ParameterTableRow[];
  onChangeValue?: (index: number, value: string) => void;
  onChangeRemarks?: (index: number, value: string) => void;
  onChangeObservations?: (index: number, value: string) => void;
  renderValue?: (row: ParameterTableRow, index: number) => ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  emptyText?: string;
  requiredValue?: boolean;
  /** Focus path for default value inputs (`data-cp-field`). */
  getValueFieldPath?: (index: number) => string;
  getValueError?: (index: number) => string | undefined;
  /** Focus path for observations column. */
  getObservationsFieldPath?: (index: number) => string;
  getObservationsError?: (index: number) => string | undefined;
};

const DEFAULT_PARAM_COLUMNS: ParameterTableColumn[] = [
  { key: "parameter", label: "Parameter", width: "32%" },
  { key: "value", label: "Value" },
  { key: "remarks", label: "Remarks" },
];

const ParamFieldError = ({ message }: { message?: string }) =>
  message ? (
    <Typography sx={{ fontSize: "0.68rem", color: "error.main", mt: 0.35, lineHeight: 1.3 }}>
      {message}
    </Typography>
  ) : null;

export const ParameterTable = ({
  columns = DEFAULT_PARAM_COLUMNS,
  rows,
  onChangeValue,
  onChangeRemarks,
  onChangeObservations,
  renderValue,
  disabled = false,
  readOnly = false,
  emptyText = "No rows",
  requiredValue = false,
  getValueFieldPath,
  getValueError,
  getObservationsFieldPath,
  getObservationsError,
}: ParameterTableProps) => {
  if (!rows.length) {
    return (
      <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub, py: 2, textAlign: "center" }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <TableContainer sx={casePrepTableContainerSx}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell key={col.key} sx={{ ...casePrepTableHeaderCellSx(idx === 0), width: col.width }}>
                {col.label}
                {requiredValue && (col.key === "value" || col.key === "observations") ? " *" : ""}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.parameter}-${index}`} sx={casePrepTableRowSx(index)}>
              {columns.map((col) => {
                if (col.key === "parameter") {
                  return (
                    <TableCell key={col.key} sx={{ ...casePrepTableCellSx, fontWeight: 600 }}>
                      {row.parameter || "—"}
                    </TableCell>
                  );
                }
                if (col.key === "value") {
                  const valueError = getValueError?.(index);
                  return (
                    <TableCell key={col.key} sx={casePrepTableCellSx}>
                      {renderValue ? (
                        renderValue(row, index)
                      ) : (
                        <>
                          <TableTextInput
                            value={row.value ?? ""}
                            onChange={(next) => onChangeValue?.(index, next)}
                            disabled={disabled}
                            readOnly={readOnly || row.readonly}
                            type="text"
                            inputMode={row.valueFieldType === "number" ? "decimal" : undefined}
                            multiline={row.valueFieldType === "textarea"}
                            minRows={row.valueFieldType === "textarea" ? 2 : undefined}
                            placeholder="Enter value"
                            dataCpField={getValueFieldPath?.(index)}
                            error={Boolean(valueError)}
                          />
                          <ParamFieldError message={valueError} />
                        </>
                      )}
                    </TableCell>
                  );
                }
                if (col.key === "observations") {
                  const obsError = getObservationsError?.(index);
                  return (
                    <TableCell key={col.key} sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.observations ?? ""}
                        onChange={(next) => onChangeObservations?.(index, next)}
                        disabled={disabled}
                        readOnly={readOnly}
                        multiline
                        minRows={2}
                        placeholder="Observations"
                        dataCpField={getObservationsFieldPath?.(index)}
                        error={Boolean(obsError)}
                      />
                      <ParamFieldError message={obsError} />
                    </TableCell>
                  );
                }
                return (
                  <TableCell key={col.key} sx={casePrepTableCellSx}>
                    <TableTextInput
                      value={row.remarks ?? ""}
                      onChange={(next) => onChangeRemarks?.(index, next)}
                      disabled={disabled}
                      readOnly={readOnly}
                      placeholder="Remarks"
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

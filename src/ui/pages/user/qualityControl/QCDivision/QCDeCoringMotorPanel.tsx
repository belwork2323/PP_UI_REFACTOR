import { useMemo, type ReactNode } from "react";
import { Box, Stack, TextField, Typography, alpha } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { DateTimeField } from "../../../../components/common/DateField";
import {
  QC_DE_CORING_FIELD_LABELS,
  QC_DE_CORING_SECTION_IDS,
  QC_DE_CORING_SECTION_TITLES,
  getQcDeCoringMotorLabel,
} from "../../../../../hooks/user/qualityControl/qcDeCoringConfig";
import {
  getDeCoringField,
  setDeCoringField,
} from "../../../../../hooks/user/qualityControl/qcDeCoringTables";
import { QCDivisionReadOnlyValue } from "./components/QCDivisionReadOnlyValue";

const BRAND = QC_DIVISION_BRAND;
const TABLE_BORDER = alpha(BRAND.primary, 0.18);

const tableFieldSx = { "& .MuiOutlinedInput-root": { fontSize: "0.72rem" } };

const setupDateTimeFieldSx = {
  mb: 0,
  "& .MuiOutlinedInput-root": {
    fontSize: "0.72rem",
    minHeight: "36px",
  },
  "& .MuiOutlinedInput-input": {
    py: "6px",
    fontSize: "0.72rem",
  },
};

type FieldRowProps = {
  label: string;
  children: ReactNode;
  readOnly?: boolean;
};

const FieldRow = ({ label, children, readOnly = false }: FieldRowProps) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
    <Typography
      sx={{
        fontSize: readOnly ? "0.65rem" : "0.72rem",
        fontWeight: readOnly ? 800 : 700,
        letterSpacing: readOnly ? "0.02em" : undefined,
        textTransform: readOnly ? "uppercase" : undefined,
        color: readOnly ? BRAND.primary : BRAND.textSub,
        minWidth: { sm: 200 },
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
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

type QCDeCoringMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
};

const QCDeCoringMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
}: QCDeCoringMotorPanelProps) => {
  const load = useMemo(() => getDeCoringField(values, "DE_CORING_LOAD"), [values]);
  const dateTime = useMemo(() => getDeCoringField(values, "DE_CORING_DATE_TIME"), [values]);
  const observations = useMemo(() => getDeCoringField(values, "OBSERVATIONS"), [values]);
  const inputsDisabled = disabled || readOnly;

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
          {getQcDeCoringMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>

      <SectionCard
        title={QC_DE_CORING_SECTION_TITLES[QC_DE_CORING_SECTION_IDS.DETAILS]}
        readOnly={readOnly}
      >
        <Stack spacing={1.5}>
          <FieldRow label={QC_DE_CORING_FIELD_LABELS.DE_CORING_LOAD} readOnly={readOnly}>
            {readOnly ? (
              <QCDivisionReadOnlyValue value={load} muted={!load.trim()} />
            ) : (
              <TextField
                size="small"
                fullWidth
                type="number"
                value={load}
                disabled={inputsDisabled}
                onChange={(event) =>
                  onChange(setDeCoringField(values, "DE_CORING_LOAD", event.target.value))
                }
                sx={tableFieldSx}
              />
            )}
          </FieldRow>
          <FieldRow label={QC_DE_CORING_FIELD_LABELS.DE_CORING_DATE_TIME} readOnly={readOnly}>
            {readOnly ? (
              <QCDivisionReadOnlyValue value={dateTime} muted={!dateTime.trim()} />
            ) : (
              <DateTimeField
                compact
                value={dateTime}
                disabled={inputsDisabled}
                onChange={(next) => onChange(setDeCoringField(values, "DE_CORING_DATE_TIME", next))}
                placeholder="DD-MM-YYYY HH:mm"
                inputSx={setupDateTimeFieldSx}
              />
            )}
          </FieldRow>
          <FieldRow label={QC_DE_CORING_FIELD_LABELS.OBSERVATIONS} readOnly={readOnly}>
            {readOnly ? (
              <QCDivisionReadOnlyValue value={observations} muted={!observations.trim()} />
            ) : (
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={observations}
                disabled={inputsDisabled}
                onChange={(event) =>
                  onChange(setDeCoringField(values, "OBSERVATIONS", event.target.value))
                }
                sx={tableFieldSx}
              />
            )}
          </FieldRow>
        </Stack>
      </SectionCard>
    </Box>
  );
};

export default QCDeCoringMotorPanel;

import React from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import {
  createEmptyApOperationParameterRow,
  createEmptyApParticleSizeRow,
  createEmptyApTimedOperationParameterRow,
  type ApOperationParameterRow,
  type ApParticleSizeRow,
  type ApTimedOperationParameterRow,
} from "../../../../../../data/models/user/rmp/apCoarseProcessForm";

export const splitFieldErrors = (
  errors: Record<string, string> | undefined,
  prefix: string,
): Record<string, string> => {
  if (!errors) return {};
  const out: Record<string, string> = {};
  Object.entries(errors).forEach(([key, message]) => {
    if (key.startsWith(`${prefix}.`)) {
      out[key.slice(prefix.length + 1)] = message;
    }
  });
  return out;
};

export const ApSectionCard = ({
  title,
  children,
  onAdd,
  disabled,
}: {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  disabled?: boolean;
}) => (
  <Box sx={{ mb: 2 }}>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 1,
      }}
    >
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>{title}</Typography>
      {onAdd ? (
        <Button
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={onAdd}
          disabled={disabled}
          sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700 }}
        >
          Add row
        </Button>
      ) : null}
    </Box>
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1.25,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
      }}
    >
      {children}
    </Box>
  </Box>
);

type TableCommonProps = {
  disabled?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

type BlendingProps = TableCommonProps & {
  title?: string;
  rows: ApOperationParameterRow[];
  onChange: (rows: ApOperationParameterRow[]) => void;
};

export const ApBlendingTable = ({
  title = "Blending cum Drying Parameters",
  rows,
  onChange,
  disabled,
  theme,
  validationErrors,
}: BlendingProps) => (
  <ApSectionCard
    title={title}
    disabled={disabled}
    onAdd={() => onChange([...rows, createEmptyApOperationParameterRow()])}
  >
    {rows.map((row, index) => (
      <Box
        key={`blend-${index}`}
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "40px 1.4fr 1.2fr 1fr auto" },
          gap: 1,
          alignItems: "start",
        }}
      >
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mt: 2.4 }}>{index + 1}</Typography>
        <CasePrepTextField
          label="Operation"
          value={row.operation}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, operation: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Set Parameter"
          value={row.setParameter}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, setParameter: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Actual Parameter"
          value={row.actualParameter}
          disabled={disabled}
          width="100%"
          theme={theme}
          error={Boolean(validationErrors?.[`blendingDryingParameters.${index}.actualParameter`])}
          helperText={
            validationErrors?.[`blendingDryingParameters.${index}.actualParameter`] ?? null
          }
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, actualParameter: v };
            onChange(next);
          }}
        />
        <IconButton
          size="small"
          disabled={disabled || rows.length <= 1}
          onClick={() => onChange(rows.filter((_, i) => i !== index))}
          sx={{ mt: { md: 2.2 } }}
          aria-label="Remove blending row"
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    ))}
  </ApSectionCard>
);

type RvdProps = TableCommonProps & {
  rows: ApTimedOperationParameterRow[];
  onChange: (rows: ApTimedOperationParameterRow[]) => void;
};

export const ApRvdTable = ({
  rows,
  onChange,
  disabled,
  theme,
  validationErrors,
}: RvdProps) => (
  <ApSectionCard
    title="Drying Operation in RVD"
    disabled={disabled}
    onAdd={() => onChange([...rows, createEmptyApTimedOperationParameterRow()])}
  >
    {rows.map((row, index) => (
      <Box
        key={`rvd-${index}`}
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "40px 1.2fr 1.1fr 0.9fr 0.9fr 0.9fr auto",
          },
          gap: 1,
          alignItems: "start",
        }}
      >
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mt: 2.4 }}>{index + 1}</Typography>
        <CasePrepTextField
          label="Operation"
          value={row.operation}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, operation: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Set Parameter"
          value={row.setParameter}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, setParameter: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Actual Parameter"
          value={row.actualParameter}
          disabled={disabled}
          width="100%"
          theme={theme}
          error={Boolean(validationErrors?.[`dryingOperationRvd.${index}.actualParameter`])}
          helperText={validationErrors?.[`dryingOperationRvd.${index}.actualParameter`] ?? null}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, actualParameter: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="Start Time"
          value={row.startTime}
          disabled={disabled}
          width="100%"
          theme={theme}
          error={Boolean(validationErrors?.[`dryingOperationRvd.${index}.startTime`])}
          helperText={validationErrors?.[`dryingOperationRvd.${index}.startTime`] ?? null}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, startTime: v };
            onChange(next);
          }}
        />
        <CasePrepTextField
          label="End Time"
          value={row.endTime}
          disabled={disabled}
          width="100%"
          theme={theme}
          error={Boolean(validationErrors?.[`dryingOperationRvd.${index}.endTime`])}
          helperText={validationErrors?.[`dryingOperationRvd.${index}.endTime`] ?? null}
          onChange={(v) => {
            const next = [...rows];
            next[index] = { ...row, endTime: v };
            onChange(next);
          }}
        />
        <IconButton
          size="small"
          disabled={disabled || rows.length <= 1}
          onClick={() => onChange(rows.filter((_, i) => i !== index))}
          sx={{ mt: { md: 2.2 } }}
          aria-label="Remove RVD row"
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
    ))}
  </ApSectionCard>
);

type PsdProps = TableCommonProps & {
  title?: string;
  requirementLabel?: string;
  rows: ApParticleSizeRow[];
  onChange: (rows: ApParticleSizeRow[]) => void;
  /** When true, Add is an inline button inside the card (Fine grinding style). */
  inlineAdd?: boolean;
};

export const ApPsdTable = ({
  title = "Particle Size Distribution (PSD)",
  requirementLabel = "PSD/PS required",
  rows,
  onChange,
  disabled,
  theme,
  validationErrors,
  inlineAdd = false,
}: PsdProps) => {
  const body = (
    <>
      {rows.map((row, index) => (
        <Box
          key={`psd-${index}`}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr 1fr auto" },
            gap: 1,
            alignItems: "start",
          }}
        >
          <CasePrepTextField
            label={requirementLabel}
            value={row.psdRequirement}
            disabled={disabled}
            width="100%"
            theme={theme}
            onChange={(v) => {
              const next = [...rows];
              next[index] = { ...row, psdRequirement: v };
              onChange(next);
            }}
          />
          <CasePrepTextField
            label="Specification"
            value={row.specification}
            disabled={disabled}
            width="100%"
            theme={theme}
            onChange={(v) => {
              const next = [...rows];
              next[index] = { ...row, specification: v };
              onChange(next);
            }}
          />
          <CasePrepTextField
            label="Result"
            value={row.result}
            disabled={disabled}
            width="100%"
            theme={theme}
            error={Boolean(validationErrors?.[`particleSizeDistribution.${index}.result`])}
            helperText={validationErrors?.[`particleSizeDistribution.${index}.result`] ?? null}
            onChange={(v) => {
              const next = [...rows];
              next[index] = { ...row, result: v };
              onChange(next);
            }}
          />
          <IconButton
            size="small"
            disabled={disabled || rows.length <= 1}
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            sx={{ mt: { md: 2.2 } }}
            aria-label="Remove PSD row"
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      {inlineAdd && !disabled ? (
        <Button
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={() => onChange([...rows, createEmptyApParticleSizeRow()])}
          sx={{
            textTransform: "none",
            fontSize: "0.72rem",
            fontWeight: 700,
            alignSelf: "flex-start",
          }}
        >
          Add PSD row
        </Button>
      ) : null}
    </>
  );

  if (inlineAdd) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>{title}</Typography>
        {body}
      </Box>
    );
  }

  return (
    <ApSectionCard
      title={title}
      disabled={disabled}
      onAdd={() => onChange([...rows, createEmptyApParticleSizeRow()])}
    >
      {body}
    </ApSectionCard>
  );
};

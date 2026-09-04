import React, { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormInput from "../../../../../components/common/FormInput";
import AppDateField from "../../../../../components/common/DateField";
import { formatToIsoDateInput, formatToUiDate } from "../../../../../../utils/dateUtils";
import { useDebouncedCallback } from "../../../../../../hooks/useDebouncedCallback";
import { registerCasingPendingDraft } from "./casingPendingDrafts";
import { mandatoryAsteriskSx } from "../../../../../components/validation/ValidatedFormField";

const DEFERRED_COMMIT_MS = 120;

export const RequiredMark = ({ theme }: { theme: { palette: { danger: string } } }) => (
  <Box component="span" sx={mandatoryAsteriskSx(theme)}>
    {" "}
    *
  </Box>
);

export const FieldLabel = ({
  children,
  theme,
  required,
}: {
  children: React.ReactNode;
  theme: any;
  required?: boolean;
}) => (
  <Typography sx={theme.workflow.formElements.fieldLabel}>
    {children}
    {required ? <RequiredMark theme={theme} /> : null}
  </Typography>
);

export const Field = ({
  label,
  children,
  fullWidth = false,
  theme,
  required,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  theme: any;
  required?: boolean;
}) => (
  <Box sx={fullWidth ? { gridColumn: { xs: "1", md: "1 / -1" } } : undefined}>
    <FieldLabel theme={theme} required={required}>
      {label}
    </FieldLabel>
    {children}
  </Box>
);

type CasingDeferredInputProps = {
  value: string;
  onChange: (value: string) => void;
  deferred?: boolean;
  disabled?: boolean;
  error?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.ComponentProps<typeof FormInput>, "value" | "onChange" | "defaultValue">;

export const CasingDeferredInput = memo(function CasingDeferredInput({
  value,
  onChange,
  deferred = true,
  disabled,
  inputRef,
  ...rest
}: CasingDeferredInputProps) {
  const [draft, setDraft] = useState(value ?? "");
  const draftRef = useRef(draft);
  const committedRef = useRef(value ?? "");
  const localInputRef = useRef<HTMLInputElement | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    const active = document.activeElement === localInputRef.current;
    if (active) return;
    const next = value ?? "";
    setDraft(next);
    committedRef.current = next;
  }, [value]);

  const commit = useCallback(
    (nextValue: string) => {
      if (disabled) return;
      if (nextValue === committedRef.current) return;
      committedRef.current = nextValue;
      onChange(nextValue);
    },
    [disabled, onChange],
  );

  const debouncedCommit = useDebouncedCallback(
    (nextValue: string) => commit(nextValue),
    DEFERRED_COMMIT_MS,
  );

  useEffect(() => {
    if (!deferred) return;
    const flush = () => {
      debouncedCommit.cancel();
      commit(draftRef.current);
    };
    return registerCasingPendingDraft(flush);
  }, [commit, debouncedCommit, deferred]);

  if (!deferred) {
    return (
      <FormInput
        {...rest}
        inputRef={inputRef}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <FormInput
      {...rest}
      inputRef={(node) => {
        localInputRef.current = node;
        if (typeof inputRef === "function") inputRef(node);
        else if (inputRef) inputRef.current = node;
      }}
      value={draft}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const nextValue = event.target.value;
        setDraft(nextValue);
        debouncedCommit(nextValue);
      }}
      onBlur={() => {
        debouncedCommit.cancel();
        commit(draftRef.current);
      }}
    />
  );
});

export const ReadOnlyValue = ({
  label,
  value,
  secondary,
  theme,
}: {
  label: string;
  value: string;
  secondary?: string;
  theme: any;
}) => (
  <Field label={label} theme={theme}>
    <Box
      sx={{
        px: 1.25,
        py: 1,
        minHeight: 40,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border}`,
        bgcolor: theme.palette.surface,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: theme.palette.text }}>
        {value?.trim() || "—"}
      </Typography>
      {secondary ? (
        <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mt: 0.15 }}>
          {secondary}
        </Typography>
      ) : null}
    </Box>
  </Field>
);

export const TextFieldField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline,
  rows,
  fullWidth,
  disabled,
  error,
  theme,
  deferred = true,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: string;
  theme: any;
  deferred?: boolean;
  required?: boolean;
}) => (
  <Field label={label} fullWidth={fullWidth} theme={theme} required={required}>
    <CasingDeferredInput
      size="small"
      fullWidth
      type={type}
      multiline={multiline}
      rows={rows}
      value={value}
      onChange={onChange}
      deferred={deferred}
      placeholder={placeholder}
      label={undefined}
      disabled={disabled}
      error={Boolean(error)}
      sx={
        multiline
          ? theme.workflow.formElements.multilineField
          : theme.workflow.formElements.textField
      }
    />
    {error ? <FormHelperText error sx={{ mx: 0 }}>{error}</FormHelperText> : null}
  </Field>
);

export const DateField = ({
  label,
  value,
  onChange,
  theme,
  disabled,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: any;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}) => (
  <Field label={label} theme={theme} required={required}>
    <AppDateField
      value={formatToUiDate(value)}
      onChange={(next) => onChange(formatToIsoDateInput(next))}
      disabled={disabled}
      error={Boolean(error)}
      helperText={error}
      placeholder="DD-MM-YYYY"
      sx={{
        mb: 0,
        width: "100%",
        ...theme.workflow.formElements.metaRowTextField,
      }}
    />
  </Field>
);

export const ProjectSelectField = ({
  label,
  value,
  onChange,
  projects,
  loading = false,
  placeholder,
  disabled = false,
  error,
  theme,
  cf,
  required,
}: {
  label: string;
  value: string;
  onChange: (projectId: string) => void;
  projects: Array<{ projectId: string; projectName: string }>;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  theme: any;
  cf: any;
  required?: boolean;
}) => {
  const selectedProject = projects.find((p) => p.projectId === value);

  const renderProjectValue = (projectId: string) => {
    if (!projectId) {
      return (
        <Typography
          component="em"
          sx={{ color: theme.palette.textSub, fontSize: "0.84rem", fontStyle: "italic" }}
        >
          {loading ? "Loading projects..." : placeholder}
        </Typography>
      );
    }
    const project = projects.find((p) => p.projectId === projectId) ?? selectedProject;
    if (!project) return projectId;
    return (
      <Box sx={cf.projectOptionSelected}>
        <Typography component="span" sx={cf.projectOptionName} noWrap>
          {project.projectName}
        </Typography>
        <Typography component="span" sx={cf.projectOptionId} noWrap>
          {project.projectId}
        </Typography>
      </Box>
    );
  };

  return (
    <Field label={label} theme={theme} required={required}>
      <FormControl
        fullWidth
        size="small"
        disabled={disabled || loading}
        sx={theme.workflow.formElements.metaRowTextField}
        error={Boolean(error)}
      >
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          displayEmpty
          renderValue={renderProjectValue}
        >
          <MenuItem value="">
            <em>{loading ? "Loading projects..." : placeholder}</em>
          </MenuItem>
          {projects.map((project) => (
            <MenuItem key={project.projectId} value={project.projectId}>
              <Box sx={cf.projectOption}>
                <Typography sx={cf.projectOptionName}>{project.projectName}</Typography>
                <Typography sx={cf.projectOptionId}>{project.projectId}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error ? <FormHelperText error sx={{ mx: 0 }}>{error}</FormHelperText> : null}
    </Field>
  );
};

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  theme,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  theme: any;
  required?: boolean;
}) => (
  <Field label={label} theme={theme} required={required}>
    <FormControl
      fullWidth
      size="small"
      disabled={disabled}
      sx={theme.workflow.formElements.metaRowTextField}
      error={Boolean(error)}
    >
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return (
              <Typography sx={{ color: theme.palette.textSub, fontSize: "0.84rem" }}>
                {placeholder}
              </Typography>
            );
          }
          const opt = options.find((o) => o.value === selected);
          return opt?.label ?? selected;
        }}
      >
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
            {opt.meta ? (
              <Typography
                component="span"
                sx={{ ml: 1, fontSize: "0.72rem", color: theme.palette.textSub }}
              >
                {opt.meta}
              </Typography>
            ) : null}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    {error ? <FormHelperText error sx={{ mx: 0 }}>{error}</FormHelperText> : null}
  </Field>
);

export const ReceiptStatusField = ({
  label,
  value,
  onChange,
  theme,
  receivedLabel,
  notReceivedLabel,
  placeholder = "Select",
  required,
}: {
  label: string;
  value: "" | "RECEIVED" | "NOT_RECEIVED";
  onChange: (value: "" | "RECEIVED" | "NOT_RECEIVED") => void;
  theme: any;
  receivedLabel: string;
  notReceivedLabel: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <SelectField
    label={label}
    value={value}
    onChange={(v) => onChange(v as "" | "RECEIVED" | "NOT_RECEIVED")}
    placeholder={placeholder}
    theme={theme}
    required={required}
    options={[
      { value: "RECEIVED", label: receivedLabel },
      { value: "NOT_RECEIVED", label: notReceivedLabel },
    ]}
  />
);

export const SectionCard = ({
  number,
  title,
  subtitle,
  accentColor,
  index = 0,
  disabled = false,
  children,
  theme,
  cf,
}: {
  number: string;
  title: string;
  subtitle?: string;
  accentColor: string;
  index?: number;
  disabled?: boolean;
  children: React.ReactNode;
  theme: any;
  cf: any;
}) => (
  <Box sx={cf.sectionCard(index)} aria-disabled={disabled || undefined}>
    <Box sx={cf.sectionCardHeader(accentColor)}>
      <Stack direction="row" alignItems="center" spacing={1.5} flex={1} minWidth={0}>
        <Box sx={cf.sectionNumber}>{number}</Box>
        <Box minWidth={0}>
          <Typography sx={cf.sectionTitle}>{title}</Typography>
          {subtitle ? <Typography sx={cf.sectionSubtitle}>{subtitle}</Typography> : null}
        </Box>
      </Stack>
    </Box>
    <Box sx={{ ...cf.sectionCardBody, ...(disabled ? cf.sectionCardBodyDisabled : {}) }}>
      {children}
    </Box>
  </Box>
);

export const SubsectionTitle = ({ children, cf }: { children: React.ReactNode; cf: any }) => (
  <Typography sx={cf.subsectionTitle}>{children}</Typography>
);

export const FieldGrid = ({
  children,
  wide,
  theme,
  cf,
}: {
  children: React.ReactNode;
  wide?: boolean;
  theme: any;
  cf: any;
}) => <Box sx={wide ? cf.fieldGridWide : cf.fieldGrid}>{children}</Box>;

export const PropertiesTable = ({
  columns,
  rows,
  theme,
}: {
  columns: Array<string | { label: string; required?: boolean }>;
  rows: React.ReactNode[];
  theme: any;
}) => (
  <Box sx={theme.sourcing.rocketMotor.createForm.propertiesPanel}>
    <Box sx={{ overflowX: "auto" }}>
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          "& thead th": theme.workflow.formElements.tableHeader,
          "& tbody td": theme.workflow.formElements.tableCell,
        }}
      >
        <thead>
          <tr>
            {columns.map((col, index) => {
              const label = typeof col === "string" ? col : col.label;
              const required = typeof col === "string" ? false : col.required;
              return (
                <th key={`${label}-${index}`}>
                  {label}
                  {required ? <RequiredMark theme={theme} /> : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Box>
    </Box>
  </Box>
);

export const SpecRangeChip = ({
  min,
  max,
  unit,
  theme,
  cf,
}: {
  min: number | null;
  max: number | null;
  unit: string | null;
  theme: any;
  cf: any;
}) => {
  if (min == null || max == null)
    return <Typography sx={{ fontSize: "0.75rem", color: theme.palette.textSub }}>—</Typography>;
  return <Chip label={`${min}–${max} ${unit ?? "mm"}`} size="small" sx={cf.specChip} />;
};

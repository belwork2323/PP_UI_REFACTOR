import React from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormInput from "../../../../../components/common/FormInput";

export const FieldLabel = ({ children, theme }: { children: React.ReactNode; theme: any }) => (
  <Typography sx={theme.workflow.formElements.fieldLabel}>{children}</Typography>
);

export const Field = ({
  label,
  children,
  fullWidth = false,
  theme,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  theme: any;
}) => (
  <Box sx={fullWidth ? { gridColumn: { xs: "1", md: "1 / -1" } } : undefined}>
    <FieldLabel theme={theme}>{label}</FieldLabel>
    {children}
  </Box>
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
  theme,
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
  theme: any;
}) => (
  <Field label={label} fullWidth={fullWidth} theme={theme}>
    <FormInput
      size="small"
      fullWidth
      type={type}
      multiline={multiline}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      label={undefined}
      disabled={disabled}
      sx={multiline ? theme.workflow.formElements.multilineField : theme.workflow.formElements.textField}
    />
  </Field>
);

export const DateField = ({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: any;
}) => (
  <Field label={label} theme={theme}>
    <TextField
      type="date"
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={theme.workflow.formElements.metaRowTextField}
      InputLabelProps={{ shrink: true }}
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
  theme,
  cf,
}: {
  label: string;
  value: string;
  onChange: (projectId: string) => void;
  projects: Array<{ projectId: string; projectName: string }>;
  loading?: boolean;
  placeholder?: string;
  theme: any;
  cf: any;
}) => {
  const selectedProject = projects.find((p) => p.projectId === value);

  const renderProjectValue = (projectId: string) => {
    if (!projectId) {
      return (
        <Typography component="em" sx={{ color: theme.palette.textSub, fontSize: "0.84rem", fontStyle: "italic" }}>
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
    <Field label={label} theme={theme}>
      <FormControl fullWidth size="small" disabled={loading} sx={theme.workflow.formElements.metaRowTextField}>
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
  theme,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; meta?: string }>;
  placeholder?: string;
  disabled?: boolean;
  theme: any;
}) => (
  <Field label={label} theme={theme}>
    <FormControl fullWidth size="small" disabled={disabled} sx={theme.workflow.formElements.metaRowTextField}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return <Typography sx={{ color: theme.palette.textSub, fontSize: "0.84rem" }}>{placeholder}</Typography>;
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
              <Typography component="span" sx={{ ml: 1, fontSize: "0.72rem", color: theme.palette.textSub }}>
                {opt.meta}
              </Typography>
            ) : null}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Field>
);

export const ReceiptStatusField = ({
  label,
  value,
  onChange,
  theme,
  receivedLabel,
  notReceivedLabel,
}: {
  label: string;
  value: "RECEIVED" | "NOT_RECEIVED";
  onChange: (value: "RECEIVED" | "NOT_RECEIVED") => void;
  theme: any;
  receivedLabel: string;
  notReceivedLabel: string;
}) => (
  <SelectField
    label={label}
    value={value}
    onChange={(v) => onChange(v as "RECEIVED" | "NOT_RECEIVED")}
    placeholder={label}
    theme={theme}
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
    <Box sx={{ ...cf.sectionCardBody, ...(disabled ? cf.sectionCardBodyDisabled : {}) }}>{children}</Box>
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
}) => (
  <Box sx={wide ? cf.fieldGridWide : cf.fieldGrid}>{children}</Box>
);

export const PropertiesTable = ({
  columns,
  rows,
  theme,
}: {
  columns: string[];
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
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Box>
    </Box>
  </Box>
);

export const SpecRangeChip = ({ min, max, unit, theme, cf }: { min: number | null; max: number | null; unit: string | null; theme: any; cf: any }) => {
  if (min == null || max == null) return <Typography sx={{ fontSize: "0.75rem", color: theme.palette.textSub }}>—</Typography>;
  return <Chip label={`${min}–${max} ${unit ?? "mm"}`} size="small" sx={cf.specChip} />;
};

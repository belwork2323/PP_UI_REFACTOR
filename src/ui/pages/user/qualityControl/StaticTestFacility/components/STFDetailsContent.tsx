import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PremixStatusChip from "../../../manufacturing/RawMaterial/components/PremixStatusChip";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getQualityControlTheme from "../../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getStfTheme } from "../../../../../../app/theme/custom_themes/user/qualityControl/stf_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import { parseFileRefs, type FileRef } from "../../../../../../data/models/common/FileUploadModel";
import type {
  StfDetailView,
  StfMotorDetailView,
} from "../../../../../../data/models/user/StaticTestFacilityApiModel";
import { STF_FLOW_LABELS } from "../../../../../../hooks/user/qualityControl/stfFlowConfig";
import { OPERATION_STATUS_UI_TO_API } from "../../../../../../hooks/operationStatus";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import { useAuthStore } from "../../../../../../app/store/authStore";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../../components/custom/UserWorkflowStepPager";
import StfMotorPanel from "../StfMotorPanel";
import { stfMotorDataHasUserInput } from "../../../../../../data/models/user/StfMotorDataModel";

const API_OPERATION_STATUS_LABELS = Object.fromEntries(
  Object.entries(OPERATION_STATUS_UI_TO_API).map(([label, apiValue]) => [apiValue, label]),
);

const formatStatusLabel = (status?: string | null) => {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");
  return API_OPERATION_STATUS_LABELS[normalized] ?? raw;
};

const BL = STRINGS.SOURCING.BATCH_LIST;
const STF = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const L = STF_FLOW_LABELS;

export type STFDetailsTheme = ReturnType<typeof getStfTheme>["details"];

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STF_UPLOAD_FIELD_KEYS = new Set(["PT_CURVE_UPLOAD", "PT_CURVE_FILE", "PTCURVEFILE"]);

const normalizeStfFieldKey = (key?: string) => {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) return "";
  const parts = trimmed.split(".");
  return parts[parts.length - 1] ?? trimmed;
};

const isStfUploadFieldKey = (key?: string) => {
  const normalized = normalizeStfFieldKey(key).toUpperCase();
  if (!normalized) return false;
  if (STF_UPLOAD_FIELD_KEYS.has(normalized.replace(/[^A-Z0-9]/g, ""))) return true;
  const compact = normalized.replace(/[^A-Z0-9]/g, "");
  return compact.includes("PTCURVE") || compact === "PTCURVEFILE";
};

const looksLikeStfFiles = (value: unknown): boolean => {
  if (value == null || value === "") return false;
  if (typeof value === "string") return false;
  if (Array.isArray(value)) {
    return value.some(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        ("fileId" in entry || "fileName" in entry || "mimeType" in entry),
    );
  }
  return (
    typeof value === "object" &&
    ("fileId" in (value as object) ||
      "fileName" in (value as object) ||
      "mimeType" in (value as object))
  );
};

const StfFileLinks = ({
  refs,
  subDepartmentId,
  onOpen,
}: {
  refs: FileRef[];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (!refs.length) return <>{formatCasePrepCellValue(null)}</>;
  return (
    <Stack spacing={0.5}>
      {refs.map((ref, index) => {
        const fileId = String(ref.fileId ?? "").trim();
        const name = ref.fileName || "file";
        const canOpen = Boolean(fileId && subDepartmentId);
        return (
          <Stack
            key={ref.localId ?? `${fileId || name}-${index}`}
            direction="row"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography component="span" sx={{ fontSize: "0.75rem", fontWeight: 600 }}>
              {name}
            </Typography>
            {canOpen ? (
              <Link
                component="button"
                type="button"
                onClick={() => onOpen(fileId, name)}
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.25,
                  cursor: "pointer",
                }}
              >
                {STF.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const StfCellValue = ({
  value,
  fieldKey,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  fieldKey?: string;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (isStfUploadFieldKey(fieldKey) || looksLikeStfFiles(value)) {
    return (
      <StfFileLinks
        refs={parseFileRefs(value)}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    );
  }

  return <>{formatCasePrepCellValue(value)}</>;
};

const FieldsTable = ({
  fields,
  dt,
  subDepartmentId,
  onOpen,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: STFDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (!fields.length) return null;

  return (
    <TableContainer sx={{ ...dt.tableContainer, mb: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={dt.tableHeaderCell(true)}>Parameter</TableCell>
            <TableCell sx={dt.tableHeaderCell(false)}>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={`${field.key}-${index}`} sx={dt.tableRow(index)}>
              <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>{field.label}</TableCell>
              <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                <StfCellValue
                  value={field.value}
                  fieldKey={field.key}
                  subDepartmentId={subDepartmentId}
                  onOpen={onOpen}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const DataTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
}: {
  table: CasePrepDetailTable;
  dt: STFDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  // Prefer schema / mapper insertion order from columnLabels (do not A–Z re-sort).
  const columns = Object.keys(table.columnLabels ?? {}).filter(
    (column) => !column.startsWith("_") && !column.endsWith("__fieldType"),
  );
  if (!columns.length || !table.rows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {table.label || formatCasePrepSectionLabel(table.blockId)}
      </Typography>
      <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: Math.max(720, columns.length * 120) }}>
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {table.columnLabels[column] ?? formatCasePrepSectionLabel(column)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {table.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column} sx={dt.tableCell}>
                    <StfCellValue
                      value={row[column]}
                      fieldKey={column}
                      subDepartmentId={subDepartmentId}
                      onOpen={onOpen}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const SectionPanel = ({
  section,
  dt,
  subDepartmentId,
  onOpen,
}: {
  section: CasePrepDetailSection;
  dt: STFDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <FieldsTable
      fields={section.fields}
      dt={dt}
      subDepartmentId={subDepartmentId}
      onOpen={onOpen}
    />
    {section.tables.map((table) => (
      <DataTable
        key={table.blockId}
        table={table}
        dt={dt}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    ))}
  </Box>
);

const StfMotorDetailPanel = ({
  motor,
  dt,
  palette,
  statusConfig,
  theme,
  subDepartmentId,
  onOpen,
}: {
  motor: StfMotorDetailView;
  dt: STFDetailsTheme;
  palette: ReturnType<typeof getQualityControlTheme>["palette"];
  statusConfig: Record<string, { color: string; bg: string; border: string }>;
  theme: ReturnType<typeof getQualityControlTheme>;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip
        label={motor.subTypeLabel === "BEM" ? STF.BEM_CARD_TITLE : STF.MOTOR_CARD_TITLE}
        size="small"
        sx={dt.materialChip}
      />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
        {motor.motorId}
      </Typography>
      {motor.subTypeLabel ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          {motor.subTypeLabel}
        </Typography>
      ) : null}
      <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, fontWeight: 600 }}>
        {STF.STF_TEST_NO_LABEL}: {motor.stfTestNo?.trim() ? motor.stfTestNo : "—"}
      </Typography>
      {motor.motorSubmissionStatus ? (
        <PremixStatusChip
          status={motor.motorSubmissionStatus as any}
          statusConfig={statusConfig}
          variant="embedded"
        />
      ) : null}
    </Stack>

    {motor.sections.length > 0 ? (
      motor.sections.map((section) => (
        <SectionPanel
          key={section.sectionId}
          section={section}
          dt={dt}
          subDepartmentId={subDepartmentId}
          onOpen={onOpen}
        />
      ))
    ) : stfMotorDataHasUserInput(motor.stfData) ? (
      <StfMotorPanel
        value={motor.stfData}
        onChange={() => undefined}
        readOnly
        theme={theme}
        motorId={motor.motorId}
        subDepartmentId={subDepartmentId}
      />
    ) : (
      <Typography sx={dt.emptyText}>{STF.DETAILS_NO_MOTOR_DATA}</Typography>
    )}
  </Box>
);

export type STFDetailsContentProps = {
  detailView: StfDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getQualityControlTheme>;
  resetOnFormId?: string | null;
};

const STFDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: STFDetailsContentProps) => {
  const dt = getStfTheme(theme).details;
  const statusConfig = dt.bannerStatusConfig ?? {};
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const isBem = detailView?.batchType === "BEM";
  // Other BEM lives under the STF sub-department (same file-service id as ACEM).
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "static-test-facility")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();
  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe =
    motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;
  const motorNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motors.map((motor, index) => {
        const motorStatus = motor.motorSubmissionStatus ?? "TO_BE_INITIATED";
        return {
          id: motor.motorId,
          label: motor.motorId,
          endAdornment: (
            <PremixStatusChip
              status={motorStatus as any}
              statusConfig={statusConfig}
              showIcon={false}
              variant="embedded"
              onAccent={index === activeMotorIndexSafe}
            />
          ),
        };
      }),
    [activeMotorIndexSafe, motors, statusConfig],
  );

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetOnFormId]);

  const metaFields = [
    ...(isBem
      ? [
          { label: STF.OTHER_BEM_MOTOR_NO_LABEL, value: detailView?.bemNo || "—" },
          { label: STF.STF_TEST_NO_LABEL, value: detailView?.stfTestNo || "—" },
        ]
      : [
          { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
          { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
        ]),
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: "Status",
      value: formatStatusLabel(detailView?.status || String(row?.stfStatus ?? row?.status ?? "")),
    },
    { label: BL.COL_CREATED_BY, value: detailView?.createdBy || "—" },
    { label: BL.COL_CREATED_ON, value: formatDateTime(detailView?.createdAt) },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    { label: "Submitted On", value: formatDateTime(detailView?.submittedAt) },
    { label: "Last Updated By", value: detailView?.lastUpdatedBy || "—" },
    { label: "Last Updated On", value: formatDateTime(detailView?.lastUpdatedAt) },
  ];

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  const hasMotorData = motors.length > 0;

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {STF.DETAILS_BATCH_SECTION}
        </Typography>
        <Box sx={dt.metaGrid}>
          {metaFields.map((field) => (
            <Box key={field.label} sx={dt.metaItem}>
              <Typography sx={dt.metaLabel}>{field.label}</Typography>
              <Typography sx={dt.metaValue}>{String(field.value ?? "—")}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {hasMotorData ? (
        <Box sx={{ ...dt.section, mb: 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {STF.DETAILS_FORM_SECTION}
          </Typography>

          {motors.length > 1 ? (
            <Box
              sx={{
                mb: 2,
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${theme.palette.border}`,
                background: theme.palette.surface,
              }}
            >
              <UserWorkflowTabNav
                title={L.motorNavTitle}
                hint={STF.DETAILS_MOTOR_NAV_HINT}
                tabs={motorNavTabs}
                activeIndex={activeMotorIndexSafe}
                onActiveIndexChange={setActiveMotorIndex}
                palette={{
                  primary: theme.palette.primary,
                  primaryLight: theme.palette.primaryLight,
                  border: theme.palette.border,
                  surface: theme.palette.surface,
                  textSub: theme.palette.textSub,
                  text: theme.palette.text,
                }}
                showStepArrows
                wrapTabs
              />
            </Box>
          ) : null}

          {activeMotor ? (
            <StfMotorDetailPanel
              motor={activeMotor}
              dt={dt}
              palette={theme.palette}
              statusConfig={statusConfig}
              theme={theme}
              subDepartmentId={subDepartmentId}
              onOpen={onOpenFile}
            />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
      />
    </>
  );
};

export { StfMotorDetailPanel };
export default STFDetailsContent;

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
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useAuthStore } from "../../../../../../app/store/authStore";
import getQualityControlTheme from "../../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getNdtTheme } from "../../../../../../app/theme/custom_themes/user/qualityControl/ndt_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import { formatCasePrepCellValue } from "../../../../../../data/models/user/CasePreparationFormModel";
import {
  parseCasePrepFileRefs,
  type CasePrepFileRef,
} from "../../../../../../data/models/user/CasePrepMotorDataModel";
import type { NDTDetailView, NDTMotorDetailView } from "../../../../../../data/models/user/NDTFormModel";
import { NDT_FLOW_LABELS } from "../../../../../../hooks/user/qualityControl/ndtFlowConfig";
import { NDT_ORIENTATION_OPTIONS } from "../../../../../../hooks/user/qualityControl/ndtApiMappings";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import { OPERATION_STATUS_UI_TO_API } from "../../../../../../hooks/operationStatus";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../../components/custom/UserWorkflowStepPager";

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
const NDT = STRINGS.QUALITY_CONTROL.NDT;
const L = NDT_FLOW_LABELS;

export type NDTDetailsTheme = ReturnType<typeof getNdtTheme>["details"];

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

const formatOrientationLabel = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "—";
  return NDT_ORIENTATION_OPTIONS.find((option) => option.value === trimmed)?.label ?? trimmed;
};

const looksLikeNdtFiles = (value: unknown): boolean => {
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

const NdtFileLinks = ({
  refs,
  subDepartmentId,
  onOpen,
}: {
  refs: CasePrepFileRef[];
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
                {NDT.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const NdtCellValue = ({
  value,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (looksLikeNdtFiles(value)) {
    return (
      <NdtFileLinks
        refs={parseCasePrepFileRefs(value)}
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
}: {
  fields: { key: string; label: string; value: unknown }[];
  dt: NDTDetailsTheme;
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
                {formatCasePrepCellValue(field.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const SimpleDataTable = ({
  title,
  columns,
  rows,
  dt,
  subDepartmentId,
  onOpen,
}: {
  title: string;
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  dt: NDTDetailsTheme;
  subDepartmentId?: number;
  onOpen?: (fileId: string, fileName: string) => void;
}) => {
  const visibleRows = rows.filter((row) =>
    columns.some((column) => {
      const value = row[column.key];
      if (Array.isArray(value)) return value.length > 0;
      return String(value ?? "").trim().length > 0;
    }),
  );

  if (!visibleRows.length) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {title}
      </Typography>
      <TableContainer sx={{ ...dt.tableContainer, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: Math.max(480, columns.length * 120) }}>
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column.key} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={dt.tableCell}>
                    {onOpen ? (
                      <NdtCellValue
                        value={row[column.key]}
                        subDepartmentId={subDepartmentId}
                        onOpen={onOpen}
                      />
                    ) : (
                      formatCasePrepCellValue(row[column.key])
                    )}
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

export const MotorDetailPanel = ({
  motor,
  dt,
  palette,
  subDepartmentId,
  onOpen,
}: {
  motor: NDTMotorDetailView;
  dt: NDTDetailsTheme;
  palette: ReturnType<typeof getQualityControlTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  const setupFields = [
    { key: "equipment", label: L.equipment, value: motor.equipment },
    { key: "beamEnergies", label: L.beamEnergies, value: motor.beamEnergiesLabel },
    { key: "radiographyPlan", label: L.radiographyPlan, value: motor.radiographyPlanLabel },
  ];

  const planRows = (motor.radiographyPlanRows ?? []).map((row) => ({
    srNo: row.srNo,
    sections: row.sections,
    orientations: row.orientations,
    sfd: row.sfd,
    normalExposures: row.normalExposures,
    tangentialExposures: row.tangentialExposures,
    detectorType: row.detectorType,
  }));

  const exposureRows = (motor.additionalExposureRows ?? []).map((row) => ({
    sectionNumber: row.sectionNumber,
    orientation: formatOrientationLabel(row.orientation),
    exposureCount: row.exposureCount,
  }));

  const observationRows = (motor.radiographyObservationRows ?? []).map((row) => ({
    section: row.section,
    orientation: formatOrientationLabel(row.orientation),
    observations: row.observations,
    files: row.files ?? [],
  }));

  const visualRows = (motor.visualInspectionRows ?? [])
    .filter(
      (row) =>
        String(row.section ?? "").trim() ||
        String(row.orientation ?? "").trim() ||
        String(row.observationNotes ?? "").trim() ||
        (!row.isPreset && String(row.observation ?? "").trim()) ||
        (row.files?.length ?? 0) > 0,
    )
    .map((row) => ({
      observation: row.isPreset
        ? row.observationNotes
          ? `${row.observation}: ${row.observationNotes}`
          : row.observation
        : row.observation,
      section: row.section,
      orientation: formatOrientationLabel(row.orientation),
      files: row.files ?? [],
    }));

  const hasMotorData =
    setupFields.some((field) => String(field.value ?? "").trim()) ||
    planRows.length > 0 ||
    exposureRows.some((row) => Object.values(row).some((value) => String(value ?? "").trim())) ||
    observationRows.some(
      (row) =>
        String(row.section ?? "").trim() ||
        String(row.orientation ?? "").trim() ||
        String(row.observations ?? "").trim() ||
        (row.files?.length ?? 0) > 0,
    ) ||
    visualRows.length > 0 ||
    (motor.visualInspectionMedia?.length ?? 0) > 0 ||
    Boolean(motor.signedReport) ||
    String(motor.additionalRemarks ?? "").trim();

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
        <Chip label={NDT.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
          {motor.motorId}
        </Typography>
        {motor.equipment ? (
          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
            {L.equipment}: {motor.equipment}
          </Typography>
        ) : null}
        {motor.radiographyPlanLabel ? (
          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
            {L.radiographyPlan}: {motor.radiographyPlanLabel}
          </Typography>
        ) : null}
      </Stack>

      {!hasMotorData ? (
        <Typography sx={dt.emptyText}>{NDT.DETAILS_NO_MOTOR_DATA}</Typography>
      ) : (
        <>
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
              Radiography setup
            </Typography>
            <FieldsTable fields={setupFields} dt={dt} />
            <SimpleDataTable
              title="Radiography plan details"
              dt={dt}
              columns={[
                { key: "srNo", label: "Sr." },
                { key: "sections", label: "Sections" },
                { key: "orientations", label: "Orientations" },
                { key: "sfd", label: "SFD" },
                { key: "normalExposures", label: "Normal" },
                { key: "tangentialExposures", label: "Tangential" },
                { key: "detectorType", label: "Detector" },
              ]}
              rows={planRows}
            />
          </Box>

          <SimpleDataTable
            title="Additional exposure details"
            dt={dt}
            columns={[
              { key: "sectionNumber", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "exposureCount", label: "Exposures" },
            ]}
            rows={exposureRows}
          />

          <SimpleDataTable
            title="Observation in radiography"
            dt={dt}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
            columns={[
              { key: "section", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "observations", label: "Observations" },
              { key: "files", label: "Images" },
            ]}
            rows={observationRows}
          />

          <SimpleDataTable
            title="Visual inspection"
            dt={dt}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
            columns={[
              { key: "observation", label: "Observation" },
              { key: "section", label: "Section" },
              { key: "orientation", label: "Orientation" },
              { key: "files", label: "Images" },
            ]}
            rows={visualRows}
          />

          {(motor.visualInspectionMedia?.length ?? 0) > 0 ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Visual inspection media
              </Typography>
              <NdtFileLinks
                refs={motor.visualInspectionMedia ?? []}
                subDepartmentId={subDepartmentId}
                onOpen={onOpen}
              />
            </Box>
          ) : null}

          {motor.signedReport ? (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Signed NDT report
              </Typography>
              <NdtFileLinks
                refs={[motor.signedReport]}
                subDepartmentId={subDepartmentId}
                onOpen={onOpen}
              />
            </Box>
          ) : null}

          {String(motor.additionalRemarks ?? "").trim() ? (
            <Box>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
                Additional remarks
              </Typography>
              <Typography sx={dt.remarksText}>{motor.additionalRemarks}</Typography>
            </Box>
          ) : null}
        </>
      )}
    </Box>
  );
};

export type NDTDetailsContentProps = {
  detailView: NDTDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getQualityControlTheme>;
  resetOnFormId?: string | null;
};

const NDTDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetOnFormId,
}: NDTDetailsContentProps) => {
  const dt = getNdtTheme(theme).details;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const subDepartmentId = useAuthStore(
    (s) => s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "ndt")?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();
  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;
  const motorNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motors.map((motor) => ({
        id: motor.motorId,
        label: motor.motorId,
      })),
    [motors],
  );

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: "Status",
      value: formatStatusLabel(detailView?.status || String(row?.ndtStatus ?? row?.status ?? "")),
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
          {NDT.DETAILS_BATCH_SECTION}
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
            {NDT.DETAILS_FORM_SECTION}
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
                hint={NDT.DETAILS_MOTOR_NAV_HINT}
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
            <MotorDetailPanel
              motor={activeMotor}
              dt={dt}
              palette={theme.palette}
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

export default NDTDetailsContent;

import { Fragment, useEffect, useMemo, useState } from "react";
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
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import { useAuthStore } from "../../../../../../app/store/authStore";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  orderCasePrepDisplayColumns,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
  type CasePrepMotorDetailView,
  type CasePreparationDetailView,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import { parseFileRefs, type FileRef } from "../../../../../../data/models/common/FileUploadModel";
import { useFilePreview } from "../../../../../../hooks/useFilePreview";
import FilePreviewDialog from "../../../../../components/common/FilePreviewDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../../components/custom/UserWorkflowStepPager";
import PremixStatusChip from "../../RawMaterial/components/PremixStatusChip";
import { formatDisplayDateTime } from "../../../../../../utils/dateUtils";
import DetailsFixedColumnsTable, {
  type DetailsFixedColumn,
} from "../../../../../components/manufacturing/DetailsFixedColumnsTable";

const ABRADING_OBS_COLUMNS = new Set(["remarksObservations", "observations", "remarks"]);
const ABRADING_ATTACH_COLUMNS = new Set(["attachments"]);

const MOTOR_STATUS_CHIP_COLORS: Record<string, { bg: string; color: string }> = {
  TO_BE_INITIATED: { bg: "rgba(120,120,120,0.1)", color: "#757575" },
  IN_PROGRESS: { bg: "rgba(25,118,210,0.1)", color: "#1565C0" },
  WAITING_FOR_APPROVAL: { bg: "rgba(212,172,13,0.1)", color: "#7D6608" },
  APPROVED: { bg: "rgba(20,143,119,0.1)", color: "#0E6655" },
  REJECTED: { bg: "rgba(192,57,43,0.1)", color: "#922B21" },
  DISCARDED: { bg: "rgba(192,57,43,0.12)", color: "#C0392B" },
};

const isAbradingDetailsTable = (table: CasePrepDetailTable) =>
  table.blockId === "abradingDetails" ||
  (Object.keys(table.columnLabels).includes("operation") &&
    Object.keys(table.columnLabels).some((col) => ABRADING_OBS_COLUMNS.has(col)));

const resolveAbradingHeaderLabel = (row: Record<string, unknown>) =>
  String(row._headerLabel ?? row.label ?? "").trim();

const isAbradingHeaderDisplayRow = (row: Record<string, unknown>) =>
  row.type === "header" && Boolean(resolveAbradingHeaderLabel(row));

const isAbradingTotalDisplayRow = (row: Record<string, unknown>) =>
  /^Total Dust Weight/i.test(String(row.operation ?? "").trim());

const isAbradingStartDisplayRow = (row: Record<string, unknown>) =>
  /^Start Date & Time$/i.test(String(row.operation ?? "").trim());

type AbradingCutDisplayGroup = {
  headerIndex: number;
  headerLabel: string;
  dataIndices: number[];
  totalIndex: number | null;
};

const groupAbradingDisplayRows = (
  rows: Record<string, unknown>[],
): AbradingCutDisplayGroup[] => {
  const groups: AbradingCutDisplayGroup[] = [];
  let current: AbradingCutDisplayGroup | null = null;

  rows.forEach((row, index) => {
    if (isAbradingHeaderDisplayRow(row)) {
      current = {
        headerIndex: index,
        headerLabel: resolveAbradingHeaderLabel(row),
        dataIndices: [],
        totalIndex: null,
      };
      groups.push(current);
      return;
    }
    if (!current) return;
    if (isAbradingTotalDisplayRow(row)) {
      current.totalIndex = index;
      return;
    }
    current.dataIndices.push(index);
  });

  return groups;
};

const resolveAbradingCutObservationValue = (
  rows: Record<string, unknown>[],
  dataIndices: number[],
  columns: string[],
): unknown => {
  const obsColumn =
    columns.find((col) => ABRADING_OBS_COLUMNS.has(col)) ?? "remarksObservations";

  for (const index of dataIndices) {
    const row = rows[index];
    if (!row || !isAbradingStartDisplayRow(row)) continue;
    const value = row[obsColumn];
    if (value != null && String(value).trim()) return value;
  }
  for (const index of dataIndices) {
    const row = rows[index];
    if (!row) continue;
    const value = row[obsColumn];
    if (value != null && String(value).trim()) return value;
  }
  return null;
};

const resolveAbradingCutAttachmentsValue = (
  rows: Record<string, unknown>[],
  dataIndices: number[],
  columns: string[],
): unknown => {
  const attachColumn = columns.find((col) => ABRADING_ATTACH_COLUMNS.has(col)) ?? "attachments";
  const merged: FileRef[] = [];
  const seen = new Set<string>();

  const collect = (preferStart: boolean) => {
    for (const index of dataIndices) {
      const row = rows[index];
      if (!row) continue;
      if (preferStart !== isAbradingStartDisplayRow(row)) continue;
      for (const ref of parseFileRefs(row[attachColumn])) {
        const key = String(ref.fileId ?? ref.fileName ?? "").trim();
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        merged.push(ref);
      }
    }
  };

  collect(true);
  collect(false);
  return merged;
};

const BL = STRINGS.SOURCING.BATCH_LIST;
const CP = STRINGS.MANUFACTURING.CASE_PREP;

export type CasePrepDetailsTheme =
  ReturnType<typeof getManufacturingTheme>["manufacturing"]["casePreparation"]["details"];

const looksLikeCasePrepFiles = (value: unknown): boolean => {
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

const CasePrepFileLinks = ({
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
                {CP.FILE_OPEN}
                <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
              </Link>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
};

const CasePrepCellValue = ({
  value,
  subDepartmentId,
  onOpen,
}: {
  value: unknown;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  if (looksLikeCasePrepFiles(value)) {
    return (
      <CasePrepFileLinks
        refs={parseFileRefs(value)}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    );
  }
  return <>{formatCasePrepCellValue(value)}</>;
};

const CasePrepFieldsTable = ({
  fields,
  dt,
  subDepartmentId,
  onOpen,
}: {
  fields: CasePrepDetailSection["fields"];
  dt: CasePrepDetailsTheme;
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
                <CasePrepCellValue
                  value={field.value}
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

/** Create-form column structures for CP details tables (API data only). */
const QUALIFICATION_PARAMETER_COLUMNS: DetailsFixedColumn[] = [
  { key: "srNo", label: "Sr. No." },
  { key: "parameter", label: "Parameter" },
  { key: "specification", label: "Specification", emphasize: "spec" },
  { key: "result", label: "Result", emphasize: "result" },
];

const DISPATCH_VISUAL_OBSERVATIONS_COLUMNS: DetailsFixedColumn[] = [
  { key: "parameter", label: "Parameter" },
  { key: "observations", label: "Observations" },
  { key: "remarks", label: "Remarks", emphasize: "remarks" },
];

const DISPATCH_TO_CASTING_DETAILS_COLUMNS: DetailsFixedColumn[] = [
  { key: "parameter", label: "Parameter" },
  { key: "value", label: "Value" },
  { key: "remarks", label: "Remarks", emphasize: "remarks" },
];

const resolveCasePrepFixedTable = (
  table: CasePrepDetailTable,
): { columns: DetailsFixedColumn[]; fallbackLabel: string } | null => {
  switch (table.blockId) {
    case "qualificationParameters":
      return {
        columns: QUALIFICATION_PARAMETER_COLUMNS,
        fallbackLabel: "Qualification Parameters",
      };
    case "dispatchVisualObservations":
      return {
        columns: DISPATCH_VISUAL_OBSERVATIONS_COLUMNS,
        fallbackLabel: "Dispatch Visual Observations",
      };
    case "dispatchToCastingDetails":
      return {
        columns: DISPATCH_TO_CASTING_DETAILS_COLUMNS,
        fallbackLabel: "Dispatch To Casting",
      };
    default:
      return null;
  }
};

const CasePrepDataTable = ({
  table,
  dt,
  subDepartmentId,
  onOpen,
}: {
  table: CasePrepDetailTable;
  dt: CasePrepDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => {
  // UI-owned structure matching create form; values from API-backed detail rows only.
  const fixedTable = resolveCasePrepFixedTable(table);
  if (fixedTable) {
    return (
      <DetailsFixedColumnsTable
        title={table.label || fixedTable.fallbackLabel}
        rows={table.rows}
        columns={fixedTable.columns}
        theme={dt}
        renderCell={({ value }) => (
          <CasePrepCellValue
            value={value}
            subDepartmentId={subDepartmentId}
            onOpen={onOpen}
          />
        )}
      />
    );
  }

  const displayRows = table.rows;
  const columns = orderCasePrepDisplayColumns(Object.keys(table.columnLabels));
  const useAbradingCutLayout = isAbradingDetailsTable(table);

  if (!columns.length || !displayRows.length) return null;

  const renderCell = (row: Record<string, unknown>, column: string) => (
    <CasePrepCellValue
      value={row[column]}
      subDepartmentId={subDepartmentId}
      onOpen={onOpen}
    />
  );

  const renderAbradingBody = () => {
    const groups = groupAbradingDisplayRows(displayRows);
    if (!groups.length) {
      return displayRows.map((row, rowIndex) => {
        const headerLabel = resolveAbradingHeaderLabel(row);
        if (row.type === "header" && headerLabel) {
          return (
            <TableRow key={rowIndex} sx={{ background: "rgba(21,101,192,0.06)" }}>
              <TableCell
                colSpan={columns.length}
                sx={{ ...dt.tableCell, fontWeight: 700, fontSize: "0.72rem" }}
              >
                {headerLabel}
              </TableCell>
            </TableRow>
          );
        }
        return (
          <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
            {columns.map((column) => (
              <TableCell key={column} sx={dt.tableCell}>
                {renderCell(row, column)}
              </TableCell>
            ))}
          </TableRow>
        );
      });
    }

    return groups.map((group) => {
      const cutObservation = resolveAbradingCutObservationValue(
        displayRows,
        group.dataIndices,
        columns,
      );
      const cutAttachments = resolveAbradingCutAttachmentsValue(
        displayRows,
        group.dataIndices,
        columns,
      );
      const cutRowSpan = Math.max(group.dataIndices.length, 1);

      return (
        <Fragment key={`cut-${group.headerIndex}`}>
          <TableRow sx={{ background: "rgba(21,101,192,0.06)" }}>
            <TableCell
              colSpan={columns.length}
              sx={{ ...dt.tableCell, fontWeight: 700, fontSize: "0.72rem" }}
            >
              {group.headerLabel}
            </TableCell>
          </TableRow>
          {group.dataIndices.map((rowIndex, rowOffset) => {
            const row = displayRows[rowIndex];
            if (!row) return null;
            return (
              <TableRow key={`abr-${rowIndex}`} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => {
                  if (ABRADING_OBS_COLUMNS.has(column)) {
                    if (rowOffset !== 0) return null;
                    return (
                      <TableCell
                        key={column}
                        sx={{ ...dt.tableCell, verticalAlign: "top" }}
                        rowSpan={cutRowSpan}
                      >
                        <CasePrepCellValue
                          value={cutObservation}
                          subDepartmentId={subDepartmentId}
                          onOpen={onOpen}
                        />
                      </TableCell>
                    );
                  }
                  if (ABRADING_ATTACH_COLUMNS.has(column)) {
                    if (rowOffset !== 0) return null;
                    return (
                      <TableCell
                        key={column}
                        sx={{ ...dt.tableCell, verticalAlign: "top" }}
                        rowSpan={cutRowSpan}
                      >
                        <CasePrepCellValue
                          value={cutAttachments}
                          subDepartmentId={subDepartmentId}
                          onOpen={onOpen}
                        />
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={column} sx={dt.tableCell}>
                      {renderCell(row, column)}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
          {group.totalIndex != null
            ? (() => {
                const totalRow = displayRows[group.totalIndex!];
                if (!totalRow) return null;
                return (
                  <TableRow
                    key={`abr-total-${group.totalIndex}`}
                    sx={dt.tableRow(group.totalIndex!)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column} sx={dt.tableCell}>
                        {ABRADING_OBS_COLUMNS.has(column) ||
                        ABRADING_ATTACH_COLUMNS.has(column)
                          ? formatCasePrepCellValue(null)
                          : renderCell(totalRow, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })()
            : null}
        </Fragment>
      );
    });
  };

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75 }}>
        {table.label}
      </Typography>
      <TableContainer sx={dt.tableContainer}>
        <Table size="small">
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
            {useAbradingCutLayout
              ? renderAbradingBody()
              : displayRows.map((row, rowIndex) => {
                  const headerLabel = resolveAbradingHeaderLabel(row);
                  if (row.type === "header" && headerLabel) {
                    return (
                      <TableRow key={rowIndex} sx={{ background: "rgba(21,101,192,0.06)" }}>
                        <TableCell
                          colSpan={columns.length}
                          sx={{ ...dt.tableCell, fontWeight: 700, fontSize: "0.72rem" }}
                        >
                          {headerLabel}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                      {columns.map((column) => (
                        <TableCell key={column} sx={dt.tableCell}>
                          {renderCell(row, column)}
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

const CasePrepSectionPanel = ({
  section,
  dt,
  subDepartmentId,
  onOpen,
}: {
  section: CasePrepDetailSection;
  dt: CasePrepDetailsTheme;
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: "text.primary", mb: 1 }}>
      {section.label}
    </Typography>
    <CasePrepFieldsTable
      fields={section.fields}
      dt={dt}
      subDepartmentId={subDepartmentId}
      onOpen={onOpen}
    />
    {section.tables.map((table) => (
      <CasePrepDataTable
        key={table.blockId}
        table={table}
        dt={dt}
        subDepartmentId={subDepartmentId}
        onOpen={onOpen}
      />
    ))}
  </Box>
);

export const MotorDetailPanel = ({
  motor,
  dt,
  palette,
  subDepartmentId,
  onOpen,
  statusConfig,
}: {
  motor: CasePrepMotorDetailView;
  dt: CasePrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  subDepartmentId?: number;
  onOpen: (fileId: string, fileName: string) => void;
  statusConfig?: Record<string, { color: string; bg: string; border: string }>;
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={CP.MOTOR_CARD_TITLE} size="small" sx={dt.materialChip} />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
        {motor.motorId}
      </Typography>
      {motor.motorSubmissionStatus ? (
        statusConfig ? (
          <PremixStatusChip
            status={motor.motorSubmissionStatus as any}
            statusConfig={statusConfig}
            variant="embedded"
          />
        ) : (
          (() => {
            const statusKey = String(motor.motorSubmissionStatus).toUpperCase();
            const chipStyle = MOTOR_STATUS_CHIP_COLORS[statusKey];
            return (
              <Chip
                label={statusKey.replace(/_/g, " ")}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  height: 22,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  background: chipStyle?.bg,
                  color: chipStyle?.color,
                }}
              />
            );
          })()
        )
      ) : null}
      {motor.prrcClearanceDate ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
          PRRC: {motor.prrcClearanceDate}
        </Typography>
      ) : null}
    </Stack>

    {motor.sections.length === 0 ? (
      <Typography sx={dt.emptyText}>No form data recorded for this motor.</Typography>
    ) : (
      motor.sections.map((section) => (
        <CasePrepSectionPanel
          key={section.sectionId}
          section={section}
          dt={dt}
          subDepartmentId={subDepartmentId}
          onOpen={onOpen}
        />
      ))
    )}
  </Box>
);

export type CasePreparationDetailsContentProps = {
  detailView: CasePreparationDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  resetMotorOnFormId?: string | null;
};

const CasePreparationDetailsContent = ({
  detailView,
  row,
  loading,
  theme,
  resetMotorOnFormId,
}: CasePreparationDetailsContentProps) => {
  const dt = theme.manufacturing.casePreparation.details;
  const statusConfig = dt.bannerStatusConfig ?? {};
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "case-preparation")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const motors = detailView?.motors ?? [];
  const activeMotorIndexSafe = motors.length > 0 ? Math.min(activeMotorIndex, motors.length - 1) : 0;
  const activeMotor = motors[activeMotorIndexSafe] ?? null;

  useEffect(() => {
    setActiveMotorIndex(0);
  }, [resetMotorOnFormId]);

  const onOpenFile = (fileId: string, fileName: string) => {
    if (!subDepartmentId) return;
    void openFile(fileId, subDepartmentId, fileName);
  };

  const navPalette = {
    primary: theme.palette.primary,
    primaryLight: theme.palette.primaryLight,
    border: theme.palette.border,
    surface: theme.palette.surface,
    textSub: theme.palette.textSub,
    text: theme.palette.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motors.map((motor, index) => ({
        id: motor.motorId,
        label: motor.motorId,
        endAdornment: motor.motorSubmissionStatus ? (
          <PremixStatusChip
            status={motor.motorSubmissionStatus as any}
            statusConfig={statusConfig}
            variant="embedded"
            onAccent={index === activeMotorIndexSafe}
          />
        ) : undefined,
      })),
    [activeMotorIndexSafe, motors, statusConfig],
  );

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || row?.batchType || "—" },
    {
      label: BL.COL_CREATED_BY,
      value:
        detailView?.createdBy ||
        (row?.assignedTo as { fullName?: string } | undefined)?.fullName ||
        BL.UNASSIGNED,
    },
    {
      label: BL.COL_CREATED_ON,
      value: formatDisplayDateTime(
        detailView?.createdAt ?? (row?.createdOn as string | undefined),
        detailView?.createdAt ?? (row?.createdOn as string | undefined) ?? "—",
      ),
    },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    {
      label: "Submitted On",
      value: formatDisplayDateTime(detailView?.submittedAt, detailView?.submittedAt || "—"),
    },
  ];

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {BL.LOT_DETAILS_PROCUREMENT_SECTION}
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

      {motors.length > 0 ? (
        <Box sx={{ ...dt.section, mb: 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {BL.CASING_DETAILS_SECTIONS}
          </Typography>

          {motors.length > 1 ? (
            <Box sx={{ mb: 2 }}>
              <UserWorkflowNavPanel palette={navPalette}>
                <UserWorkflowTabNav
                  title={CP.MOTOR_NAV_TITLE}
                  hint={CP.MOTOR_NAV_HINT}
                  tabs={motorTabs}
                  activeIndex={activeMotorIndexSafe}
                  onActiveIndexChange={setActiveMotorIndex}
                  palette={navPalette}
                  showStepArrows
                />
              </UserWorkflowNavPanel>
            </Box>
          ) : null}

          {activeMotor ? (
            <MotorDetailPanel
              motor={activeMotor}
              dt={dt}
              palette={theme.palette}
              subDepartmentId={subDepartmentId}
              onOpen={onOpenFile}
              statusConfig={statusConfig}
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

export default CasePreparationDetailsContent;

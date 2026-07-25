import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
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
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  collectPrepSectionNestedTableRows,
  expandRawMaterialPrepSectionRows,
  extractPrepSectionNestedTableKeys,
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
  orderPrepSectionColumns,
  type PremixCounts,
  type PremixSubmissionStatus,
  type RawMaterialPrepApproverDetailView,
  type RawMaterialPrepApproverPremixView,
  type RawMaterialPrepApproverProcessView,
  type RawMaterialPrepApproverSectionView,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip, { PremixCountsSummary } from "./PremixStatusChip";
import { formatToIsoDateInput } from "../../../../../../utils/dateUtils";

const BL = STRINGS.SOURCING.BATCH_LIST;
const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

export type RawMaterialPrepDetailsTheme = ReturnType<
  typeof getManufacturingTheme
>["manufacturing"]["rawMaterialPrep"]["details"];

const formatDate = (value?: unknown) => {
  if (!value) return "—";
  const raw = String(value).trim();
  const iso = formatToIsoDateInput(raw) || raw;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value?: string) => {
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

export const SchemaSectionTable = ({
  section,
  dt,
}: {
  section: RawMaterialPrepApproverSectionView;
  dt: RawMaterialPrepDetailsTheme;
}) => {
  const rows = expandRawMaterialPrepSectionRows(section.sectionData);
  if (rows.length === 0) return null;

  const nestedTableKeys = extractPrepSectionNestedTableKeys(rows);
  const nestedKeySet = new Set(nestedTableKeys);

  const collectColumns = (tableRows: Record<string, unknown>[]) =>
    orderPrepSectionColumns(
      Array.from(
        tableRows.reduce((keys, row) => {
          Object.keys(row ?? {}).forEach((key) => {
            if (!key.startsWith("_") && !nestedKeySet.has(key)) keys.add(key);
          });
          return keys;
        }, new Set<string>()),
      ),
    );

  const mainColumns = collectColumns(rows);

  const renderDataTable = (
    tableRows: Record<string, unknown>[],
    tableColumns: string[],
    { nested = false }: { nested?: boolean } = {},
  ) => {
    if (tableColumns.length === 0 || tableRows.length === 0) return null;

    return (
      <TableContainer sx={dt.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {tableColumns.map((column, columnIndex) => (
                <TableCell key={column} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {formatPrepSectionLabel(column)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {tableColumns.map((column) => (
                  <TableCell key={column} sx={dt.tableCell}>
                    {formatPrepSectionCellValue(row?.[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 700,
          color: "text.secondary",
          mb: 0.75,
          letterSpacing: "normal",
        }}
      >
        {formatPrepSectionLabel(section.sectionId)}
      </Typography>

      {renderDataTable(rows, mainColumns)}

      {nestedTableKeys.map((nestedKey) => {
        const nestedRows = collectPrepSectionNestedTableRows(rows, nestedKey);
        const nestedColumns = orderPrepSectionColumns(
          Array.from(
            nestedRows.reduce((keys, row) => {
              Object.keys(row ?? {}).forEach((key) => {
                if (!key.startsWith("_")) keys.add(key);
              });
              return keys;
            }, new Set<string>()),
          ),
        );

        if (nestedRows.length === 0 || nestedColumns.length === 0) return null;

        return (
          <Box key={nestedKey} sx={{ mt: 1.25 }}>
            <Typography
              sx={{
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "text.secondary",
                mb: 0.75,
              }}
            >
              {formatPrepSectionLabel(nestedKey)}
            </Typography>
            {renderDataTable(nestedRows, nestedColumns, { nested: true })}
          </Box>
        );
      })}
    </Box>
  );
};

export const ProcessDetailBlock = ({
  process,
  slotLabel,
  slotIcon: SlotIcon,
  slotColor,
  dt,
}: {
  process: RawMaterialPrepApproverProcessView;
  slotLabel: string;
  slotIcon: typeof GrainRoundedIcon;
  slotColor: string;
  dt: RawMaterialPrepDetailsTheme;
}) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" alignItems="center" gap={1} mb={1.25} flexWrap="wrap">
      <Chip
        icon={<SlotIcon sx={{ fontSize: "12px !important" }} />}
        label={slotLabel}
        size="small"
        sx={{
          height: 22,
          fontSize: "0.68rem",
          fontWeight: 800,
          background: alpha(slotColor, 0.1),
          color: slotColor,
          border: `1px solid ${alpha(slotColor, 0.25)}`,
        }}
      />
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>
        {process.materialName || process.materialCode}
        {process.gradeCode ? ` (${process.gradeCode})` : ""}
      </Typography>
    </Stack>
    {process.sections.map((section) => (
      <SchemaSectionTable key={section.sectionId} section={section} dt={dt} />
    ))}
  </Box>
);

export const PremixDetailPanel = ({
  premix,
  dt,
  palette,
  statusConfig,
}: {
  premix: RawMaterialPrepApproverPremixView;
  dt: RawMaterialPrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
  statusConfig?: Record<string, { color: string; bg: string; border: string }>;
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={`Premix ${premix.premixNo}`} size="small" sx={dt.materialChip} />
      {statusConfig ? (
        <PremixStatusChip
          status={premix.premixSubmissionStatus}
          statusConfig={statusConfig}
        />
      ) : null}
      <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, fontWeight: 700 }}>
        {premix.materialType}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
        {RM.PREMIX_DATE}: {formatDate(premix.premixDate)}
      </Typography>
    </Stack>

    {premix.premixSubmissionStatus === "REJECTED" && premix.rejectionReason ? (
      <Typography sx={{ fontSize: "0.72rem", color: palette.danger ?? "#C0392B", mb: 1.5 }}>
        Rejection reason: {premix.rejectionReason}
      </Typography>
    ) : null}

    {premix.solidProcesses.length === 0 && premix.liquidProcesses.length === 0 ? (
      <Typography sx={dt.emptyText}>No process data recorded for this premix.</Typography>
    ) : null}

    {premix.solidProcesses.map((process, index) => (
      <ProcessDetailBlock
        key={`solid-${process.materialCode}-${index}`}
        process={process}
        slotLabel="Solid"
        slotIcon={GrainRoundedIcon}
        slotColor={palette.primary ?? "#1565C0"}
        dt={dt}
      />
    ))}
    {premix.liquidProcesses.map((process, index) => (
      <ProcessDetailBlock
        key={`liquid-${process.materialCode}-${index}`}
        process={process}
        slotLabel="Liquid"
        slotIcon={OpacityRoundedIcon}
        slotColor={palette.primaryLight ?? "#2E86C1"}
        dt={dt}
      />
    ))}
  </Box>
);

export const WeightmentSheetDetailBlock = ({
  weightmentSheet,
  dt,
  palette,
}: {
  weightmentSheet: RawMaterialPrepWeightmentSheet;
  dt: RawMaterialPrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
}) => {
  const hasWeightment =
    Boolean(weightmentSheet.mixerBuildingNumber) || weightmentSheet.weightmentDetails.length > 0;

  if (!hasWeightment) return null;

  return (
    <Box sx={{ ...dt.section, mb: 0 }}>
      <Typography sx={dt.sectionTitle}>
        <OpacityRoundedIcon sx={{ fontSize: 18 }} />
        {RM.WEIGHTMENT_SHEET_TITLE}
      </Typography>
      <Box sx={dt.metaGrid}>
        <Box sx={dt.metaItem}>
          <Typography sx={dt.metaLabel}>{RM.WEIGHTMENT_MIXER_BUILDING}</Typography>
          <Typography sx={dt.metaValue}>{weightmentSheet.mixerBuildingNumber || "—"}</Typography>
        </Box>
      </Box>
      {weightmentSheet.weightmentDetails.length > 0 && (
        <TableContainer sx={{ ...dt.tableContainer, mt: 1.5 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Material Code",
                  "Material Name",
                  "Percentage",
                  "Weight Transferred (Kg)",
                  "Container Type",
                  "Container No.",
                  "Weigh Scale No.",
                  "Weighing Date & Time",
                ].map((header, headerIndex) => (
                  <TableCell key={header} sx={dt.tableHeaderCell(headerIndex === 0)}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weightmentSheet.weightmentDetails.map((entry, rowIndex) => (
                <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                  <TableCell sx={dt.tableCell}>{entry.materialCode || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.materialName || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.percentage || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.weightTransferred || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.containerType || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.containerNumber || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{entry.weighScaleNumber || "—"}</TableCell>
                  <TableCell sx={dt.tableCell}>{formatDateTime(entry.weighingDateTime)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {weightmentSheet.validation.compareWithIdentificationSheet && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "background.paper",
            border: `1px solid ${palette.border}`,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: palette.textSub }}>
            {RM.WEIGHTMENT_COMPARE_LABEL}: Yes · {RM.WEIGHTMENT_DEVIATION_FOUND}:{" "}
            {weightmentSheet.validation.deviationFound ? "Yes" : "No"}
            {weightmentSheet.validation.deviationMessage
              ? ` — ${weightmentSheet.validation.deviationMessage}`
              : ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export type RawMaterialPreparationDetailsContentProps = {
  detailView: RawMaterialPrepApproverDetailView | null;
  weightmentSheet: RawMaterialPrepWeightmentSheet;
  row?: Record<string, unknown>;
  loading: boolean;
  theme: ReturnType<typeof getManufacturingTheme>;
  showMeta?: boolean;
  showPremixTabs?: boolean;
  resetPremixOnFormId?: string | null;
  premixCounts?: PremixCounts;
  approverMode?: boolean;
  filterPremixStatus?: PremixSubmissionStatus;
  onActivePremixChange?: (premixNo: number) => void;
};

const RawMaterialPreparationDetailsContent = ({
  detailView,
  weightmentSheet,
  row,
  loading,
  theme,
  showMeta = true,
  showPremixTabs = true,
  resetPremixOnFormId,
  premixCounts,
  approverMode = false,
  filterPremixStatus,
  onActivePremixChange,
}: RawMaterialPreparationDetailsContentProps) => {
  const dt = theme.manufacturing.rawMaterialPrep.details;
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;
  const [activePremixIndex, setActivePremixIndex] = useState(0);

  const allPremixes = detailView?.premixes ?? [];
  const premixes = useMemo(() => {
    if (!filterPremixStatus) return allPremixes;
    return allPremixes.filter((premix) => premix.premixSubmissionStatus === filterPremixStatus);
  }, [allPremixes, filterPremixStatus]);
  const activePremixIndexSafe =
    premixes.length > 0 ? Math.min(activePremixIndex, premixes.length - 1) : 0;
  const activePremix = premixes[activePremixIndexSafe] ?? null;

  const hasWeightment =
    Boolean(weightmentSheet.mixerBuildingNumber) || weightmentSheet.weightmentDetails.length > 0;

  useEffect(() => {
    setActivePremixIndex(0);
  }, [resetPremixOnFormId, filterPremixStatus]);

  useEffect(() => {
    const activePremix = premixes[activePremixIndexSafe];
    if (activePremix?.premixNo) {
      onActivePremixChange?.(activePremix.premixNo);
    }
  }, [activePremixIndexSafe, premixes, onActivePremixChange]);

  const resolvedPremixCounts = premixCounts ?? detailView?.premixCounts;

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Motor ID", value: row?.motorId || "—" },
    {
      label: "Material Type",
      value: row?.material || row?.batchType || "—",
    },
    {
      label: BL.COL_CREATED_BY,
      value:
        detailView?.createdBy ||
        (row?.assignedTo as { fullName?: string } | undefined)?.fullName ||
        (typeof row?.submittedBy === "string" ? row.submittedBy : "") ||
        BL.UNASSIGNED,
    },
    { label: BL.COL_CREATED_ON, value: formatDate(detailView?.createdAt ?? row?.createdOn) },
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
      {showMeta && (
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
      )}

      {resolvedPremixCounts && (
        <Box sx={{ ...dt.section, mb: 3 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            Premix Summary
          </Typography>
          <PremixCountsSummary
            pending={resolvedPremixCounts.pendingPremixCount}
            approved={resolvedPremixCounts.approvedPremixCount}
            rejected={resolvedPremixCounts.rejectedPremixCount}
            inProgress={resolvedPremixCounts.inProgressPremixCount}
            total={resolvedPremixCounts.totalPremixCount}
            statusConfig={statusConfig}
          />
        </Box>
      )}

      {premixes.length > 0 && (
        <Box sx={{ ...dt.section, mb: hasWeightment ? 3 : 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {BL.CASING_DETAILS_SECTIONS}
          </Typography>

          {showPremixTabs && premixes.length > 1 ? (
            <Box
              sx={{
                mb: 2,
                p: 1.25,
                borderRadius: 2,
                border: `1px solid ${theme.palette.border}`,
                background: theme.palette.surface,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  color: theme.palette.primary,
                  mb: 0.75,
                }}
              >
                Premix Navigation
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {premixes.map((premix, index) => (
                  <Button
                    key={premix.premixNo}
                    size="small"
                    variant={index === activePremixIndexSafe ? "contained" : "outlined"}
                    onClick={() => setActivePremixIndex(index)}
                    sx={{
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={0.75}>
                      Premix {premix.premixNo}
                      <PremixStatusChip
                        status={premix.premixSubmissionStatus}
                        statusConfig={statusConfig}
                        variant="embedded"
                        onAccent={index === activePremixIndexSafe}
                        showIcon={false}
                      />
                    </Stack>
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          {activePremix ? (
            <PremixDetailPanel
              premix={activePremix}
              dt={dt}
              palette={theme.palette}
              statusConfig={statusConfig}
            />
          ) : null}
        </Box>
      )}

      {!approverMode && (
        <WeightmentSheetDetailBlock
          weightmentSheet={weightmentSheet}
          dt={dt}
          palette={theme.palette}
        />
      )}

      {premixes.length === 0 && !hasWeightment && (
        <Typography sx={dt.emptyText}>
          {approverMode && filterPremixStatus
            ? "No premixes are waiting for approval."
            : "No form data recorded"}
        </Typography>
      )}
    </>
  );
};

export default RawMaterialPreparationDetailsContent;

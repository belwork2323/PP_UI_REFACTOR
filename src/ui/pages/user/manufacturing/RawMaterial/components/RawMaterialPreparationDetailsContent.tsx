import { useEffect, useState } from "react";
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
  expandRawMaterialPrepSectionRows,
  formatPrepSectionCellValue,
  formatPrepSectionLabel,
  orderPrepSectionColumns,
  type RawMaterialPrepApproverDetailView,
  type RawMaterialPrepApproverPremixView,
  type RawMaterialPrepApproverProcessView,
  type RawMaterialPrepApproverSectionView,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";

const BL = STRINGS.SOURCING.BATCH_LIST;
const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

export type RawMaterialPrepDetailsTheme =
  ReturnType<typeof getManufacturingTheme>["manufacturing"]["rawMaterialPrep"]["details"];

const formatDate = (value?: unknown) => {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
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

  const columns = orderPrepSectionColumns(
    Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row ?? {}).forEach((key) => {
          if (!key.startsWith("_")) keys.add(key);
        });
        return keys;
      }, new Set<string>()),
    ),
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", mb: 0.75, letterSpacing: "normal" }}>
        {formatPrepSectionLabel(section.sectionId)}
      </Typography>
      <TableContainer sx={dt.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column, columnIndex) => (
                <TableCell key={column} sx={dt.tableHeaderCell(columnIndex === 0)}>
                  {formatPrepSectionLabel(column)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} sx={dt.tableRow(rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column} sx={dt.tableCell}>
                    {formatPrepSectionCellValue(row?.[column])}
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
}: {
  premix: RawMaterialPrepApproverPremixView;
  dt: RawMaterialPrepDetailsTheme;
  palette: ReturnType<typeof getManufacturingTheme>["palette"];
}) => (
  <Box>
    <Stack direction="row" alignItems="center" gap={1} mb={1.5} flexWrap="wrap">
      <Chip label={`Premix ${premix.premixNo}`} size="small" sx={dt.materialChip} />
      <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, fontWeight: 700 }}>
        {premix.materialType}
      </Typography>
    </Stack>

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
}: RawMaterialPreparationDetailsContentProps) => {
  const dt = theme.manufacturing.rawMaterialPrep.details;
  const [activePremixIndex, setActivePremixIndex] = useState(0);

  const premixes = detailView?.premixes ?? [];
  const activePremixIndexSafe = premixes.length > 0 ? Math.min(activePremixIndex, premixes.length - 1) : 0;
  const activePremix = premixes[activePremixIndexSafe] ?? null;

  const hasWeightment =
    Boolean(weightmentSheet.mixerBuildingNumber) || weightmentSheet.weightmentDetails.length > 0;

  useEffect(() => {
    setActivePremixIndex(0);
  }, [resetPremixOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
    { label: "Submission Type", value: detailView?.formSubmissionType || "—" },
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
              <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: theme.palette.primary, mb: 0.75 }}>
                Premix Navigation
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                {premixes.map((premix, index) => (
                  <Button
                    key={premix.premixNo}
                    size="small"
                    variant={index === activePremixIndexSafe ? "contained" : "outlined"}
                    onClick={() => setActivePremixIndex(index)}
                    sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none", fontWeight: 700 }}
                  >
                    Premix {premix.premixNo}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : null}

          {activePremix ? (
            <PremixDetailPanel premix={activePremix} dt={dt} palette={theme.palette} />
          ) : null}
        </Box>
      )}

      <WeightmentSheetDetailBlock weightmentSheet={weightmentSheet} dt={dt} palette={theme.palette} />

      {premixes.length === 0 && !hasWeightment && (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
    </>
  );
};

export default RawMaterialPreparationDetailsContent;

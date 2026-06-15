import { useMemo } from "react";
import {
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import FormatPaintRoundedIcon from "@mui/icons-material/FormatPaintRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";

const BL = STRINGS.SOURCING.BATCH_LIST;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.manufacturing.casePreparation.list;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type DetailRow = { specification: string; analysedResult: string; remarks: string };
type DetailBlock = { material: string; lotNo?: string; rows: DetailRow[] };

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const flattenSectionData = (section: any): DetailRow[] => {
  const sectionId = section?.sectionId ?? "";
  const sectionData = Array.isArray(section?.sectionData) ? section.sectionData : [];
  const rows: DetailRow[] = [];
  for (const dataRow of sectionData) {
    if (typeof dataRow !== "object" || dataRow === null) continue;
    for (const [key, value] of Object.entries(dataRow)) {
      const val = String(value ?? "").trim();
      if (!val) continue;
      rows.push({
        specification: sectionId ? `${sectionId} — ${key}` : key,
        analysedResult: val,
        remarks: "—",
      });
    }
  }
  return rows;
};

const buildMotorBlocks = (motors: any[]): DetailBlock[] => {
  const blocks: DetailBlock[] = [];
  for (const motor of motors) {
    const motorId = motor.motorId || "—";
    const rows: DetailRow[] = [];
    const sections = motor.savedSections ?? motor.sections ?? [];
    for (const section of sections) {
      rows.push(...flattenSectionData(section));
    }
    const prrcDate = formatDate(motor.prrcClearanceDate || motor.prrcDate || motor.prrcClearance);
    blocks.push({
      material: `Motor`,
      lotNo: motorId,
      rows: rows.length > 0
        ? [{ specification: "PRRC Clearance Date", analysedResult: prrcDate, remarks: "—" }, ...rows]
        : [{ specification: "PRRC Clearance Date", analysedResult: prrcDate, remarks: "—" }],
    });
  }
  return blocks;
};

const buildObjectRows = (obj: Record<string, any>): DetailRow[] => {
  if (!obj || typeof obj !== "object") return [];
  const rows: DetailRow[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null) {
      const sub = value as Record<string, any>;
      for (const [subKey, subVal] of Object.entries(sub)) {
        rows.push({
          specification: `${key} — ${subKey}`,
          analysedResult: String(subVal ?? "—"),
          remarks: "—",
        });
      }
    } else {
      rows.push({
        specification: key,
        analysedResult: String(value ?? "—"),
        remarks: "—",
      });
    }
  }
  return rows;
};

type CasePreparationDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const CasePreparationDetailsView = ({ row, data, loading, onBack }: CasePreparationDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = theme.manufacturing.casePreparation.details;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ])
      ),
    [dt]
  );

  const details = data?.casePreparationDetails ?? data ?? {};
  const motors = Array.isArray(details.motors) ? details.motors : [];
  const motorBlocks = useMemo(() => buildMotorBlocks(motors), [motors]);
  const generalActivities = data?.generalActivities ?? details?.generalActivities ?? {};
  const linearCoating = data?.linearCoatingOperation ?? details?.linearCoatingOperation ?? {};
  const hasGA = typeof generalActivities === "object" && Object.keys(generalActivities).length > 0;
  const hasLCO = typeof linearCoating === "object" && Object.keys(linearCoating).length > 0;

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: data?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: data?.formId || row?.formId || "—" },
    { label: "Batch Type", value: data?.batchType || row?.batchType || "—" },
    { label: "Motor ID", value: row?.motorId || "—" },
    { label: BL.COL_CREATED_BY, value: row?.assignedTo?.fullName ?? BL.UNASSIGNED },
    { label: BL.COL_CREATED_ON, value: formatDate(row?.createdOn || data?.createdOn) },
  ];

  const defaultColumns = [
    { label: "Section / Parameter" },
    { label: "Details" },
    { label: "Remarks" },
  ];

  return (
    <Box sx={dt.page}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={theme.workflow.formHeader.backButton}
        >
          {FH.BACK_TO_LIST}
        </Button>
      </Stack>

      <Box sx={dt.document}>
        <Box sx={dt.banner}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="flex-start" gap={1.5}>
              <CleaningServicesRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{STRINGS.MANUFACTURING.CASE_PREP.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {data?.batchId || row?.batchId}
                  {row?.batchType ? ` · ${row.batchType}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={row?.cpStatus}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={row?.rejectionReason ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          {loading ? (
            <Box sx={dt.loadingBox}>
              <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
              <Typography sx={dt.emptyText}>Loading details…</Typography>
            </Box>
          ) : (
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
                      <Typography sx={dt.metaValue}>{field.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {motorBlocks.length > 0 && (
                <Box sx={{ ...dt.section, mb: (hasGA || hasLCO) ? 3 : 0 }}>
                  <Typography sx={dt.sectionTitle}>
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                    {BL.CASING_DETAILS_SECTIONS}
                  </Typography>
                  {motorBlocks.map((block, bi) => {
                    const isLast = bi === motorBlocks.length - 1;
                    return (
                      <Box key={`${block.lotNo}-${bi}`} sx={dt.blockWrapper(isLast)}>
                        <Stack direction="row" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                          <Chip label={block.material} size="small" sx={dt.materialChip} />
                          {block.lotNo ? (
                            <Typography sx={dt.blockMeta}>
                              <Box component="span" sx={dt.blockMetaStrong}>
                                {block.lotNo}
                              </Box>
                            </Typography>
                          ) : null}
                        </Stack>
                        <TableContainer sx={dt.tableContainer}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {defaultColumns.map((col, i) => (
                                  <TableCell key={col.label} sx={dt.tableHeaderCell(i === 0)}>
                                    {col.label}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {block.rows.map((specRow, ri) => (
                                <TableRow key={`${specRow.specification}-${ri}`} sx={dt.tableRow(ri)}>
                                  <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                                    {specRow.specification}
                                  </TableCell>
                                  <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                                    {specRow.analysedResult}
                                  </TableCell>
                                  <TableCell sx={dt.tableCell}>
                                    <Typography sx={dt.remarksText}>{specRow.remarks}</Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {hasGA && (
                <Box sx={{ ...dt.section, mb: hasLCO ? 3 : 0 }}>
                  <Typography sx={dt.sectionTitle}>
                    <FormatPaintRoundedIcon sx={{ fontSize: 18 }} />
                    {"General Activities"}
                  </Typography>
                  <TableContainer sx={dt.tableContainer}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {defaultColumns.map((col, i) => (
                            <TableCell key={col.label} sx={dt.tableHeaderCell(i === 0)}>
                              {col.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {buildObjectRows(generalActivities).map((specRow, ri) => (
                          <TableRow key={`ga-${specRow.specification}-${ri}`} sx={dt.tableRow(ri)}>
                            <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                              {specRow.specification}
                            </TableCell>
                            <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                              {specRow.analysedResult}
                            </TableCell>
                            <TableCell sx={dt.tableCell}>
                              <Typography sx={dt.remarksText}>{specRow.remarks}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {hasLCO && (
                <Box sx={{ ...dt.section, mb: 0 }}>
                  <Typography sx={dt.sectionTitle}>
                    <FormatPaintRoundedIcon sx={{ fontSize: 18 }} />
                    {"Linear Coating Operation"}
                  </Typography>
                  <TableContainer sx={dt.tableContainer}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {defaultColumns.map((col, i) => (
                            <TableCell key={col.label} sx={dt.tableHeaderCell(i === 0)}>
                              {col.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {buildObjectRows(linearCoating).map((specRow, ri) => (
                          <TableRow key={`lco-${specRow.specification}-${ri}`} sx={dt.tableRow(ri)}>
                            <TableCell sx={{ ...dt.tableCell, ...dt.specText }}>
                              {specRow.specification}
                            </TableCell>
                            <TableCell sx={{ ...dt.tableCell, ...dt.resultText }}>
                              {specRow.analysedResult}
                            </TableCell>
                            <TableCell sx={dt.tableCell}>
                              <Typography sx={dt.remarksText}>{specRow.remarks}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {motorBlocks.length === 0 && !hasGA && !hasLCO && (
                <Typography sx={dt.emptyText}>No form data recorded</Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CasePreparationDetailsView;

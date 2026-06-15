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
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
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
} = icons.user.manufacturing.rawMaterial.preparationList;

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

const buildPremixBlocks = (premixes: any[]): DetailBlock[] => {
  const blocks: DetailBlock[] = [];
  for (const premix of premixes) {
    const processTypes = [
      { key: "solidProcess", label: "Solid" },
      { key: "liquidProcess", label: "Liquid" },
    ];
    for (const { key: processKey, label: typeLabel } of processTypes) {
      const processes = premix[processKey];
      if (!Array.isArray(processes) || processes.length === 0) continue;
      for (const process of processes) {
        const rows: DetailRow[] = [];
        const sections = Array.isArray(process.sections) ? process.sections : [];
        for (const section of sections) {
          rows.push(...flattenSectionData(section));
        }
        const materialCode = process.materialCode || process.materialName || "";
        blocks.push({
          material: `Premix #${premix.premixNo}`,
          lotNo: `${typeLabel} — ${materialCode}`,
          rows: rows.length > 0 ? rows : [{ specification: "No data recorded", analysedResult: "—", remarks: "—" }],
        });
      }
    }
  }
  return blocks;
};

type RawMaterialPreparationDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const RawMaterialPreparationDetailsView = ({ row, data, loading, onBack }: RawMaterialPreparationDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = theme.manufacturing.rawMaterialPrep.details;

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

  const details = data?.preparationDetails ?? data ?? {};
  const premixes = Array.isArray(details.premixes) ? details.premixes : [];
  const blocks = useMemo(() => buildPremixBlocks(premixes), [premixes]);
  const weightmentSheet = details.weightmentSheet;

  const formatRowValue = (val: any) => {
    if (val === null || val === undefined) return "—";
    const s = String(val).trim();
    return s || "—";
  };

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: data?.batchId || row?.batchId || "—" },
    { label: "Form ID", value: data?.formId || row?.formId || "—" },
    { label: "Motor ID", value: row?.motorId || "—" },
    { label: "Material Type", value: row?.material || row?.batchType || "—" },
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
              <GrainRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{STRINGS.MANUFACTURING.RAW_MATERIAL_PREP.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {data?.batchId || row?.batchId}
                  {row?.material ? ` · ${row.material}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={row?.rmStatus}
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

              {blocks.length > 0 && (
                <Box sx={{ ...dt.section, mb: weightmentSheet ? 3 : 0 }}>
                  <Typography sx={dt.sectionTitle}>
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                    {BL.CASING_DETAILS_SECTIONS}
                  </Typography>
                  {blocks.map((block, bi) => {
                    const isLast = bi === blocks.length - 1;
                    return (
                      <Box key={`${block.material}-${block.lotNo}-${bi}`} sx={dt.blockWrapper(isLast)}>
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

              {weightmentSheet && (weightmentSheet.mixerBuildingNumber || (weightmentSheet.weightmentDetails ?? []).length > 0) && (
                <Box sx={{ ...dt.section, mb: 0 }}>
                  <Typography sx={dt.sectionTitle}>
                    <OpacityRoundedIcon sx={{ fontSize: 18 }} />
                    {"Weightment Sheet"}
                  </Typography>
                  <Box sx={dt.metaGrid}>
                    <Box sx={dt.metaItem}>
                      <Typography sx={dt.metaLabel}>Mixer Building</Typography>
                      <Typography sx={dt.metaValue}>{weightmentSheet.mixerBuildingNumber || "—"}</Typography>
                    </Box>
                  </Box>
                  {(weightmentSheet.weightmentDetails ?? []).length > 0 && (
                    <TableContainer sx={{ ...dt.tableContainer, mt: 1.5 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {["Material Code", "Material Name", "Percentage", "Weight Transferred", "Container Type", "Container No.", "Weigh Scale No.", "Date/Time"].map((h, i) => (
                              <TableCell key={h} sx={dt.tableHeaderCell(i === 0)}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {weightmentSheet.weightmentDetails.map((d: any, di: number) => (
                            <TableRow key={di} sx={dt.tableRow(di)}>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.materialCode)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.materialName)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.percentage)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.weightTransferred)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.containerType)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.containerNumber)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.weighScaleNumber)}</TableCell>
                              <TableCell sx={dt.tableCell}>{formatRowValue(d.weighingDateTime)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  {weightmentSheet.validation?.compareWithIdentificationSheet && (
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: "background.paper", border: `1px solid ${theme.palette.border}` }}>
                      <Typography sx={{ fontSize: "0.68rem", color: theme.palette.textSub }}>
                        Deviation: {weightmentSheet.validation.deviationFound ? "Yes" : "No"}
                        {weightmentSheet.validation.deviationMessage ? ` — ${weightmentSheet.validation.deviationMessage}` : ""}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {premixes.length === 0 && !weightmentSheet && (
                <Typography sx={dt.emptyText}>No form data recorded</Typography>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RawMaterialPreparationDetailsView;

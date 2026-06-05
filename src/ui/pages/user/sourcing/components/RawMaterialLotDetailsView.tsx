import { useMemo } from "react";
import {
  alpha,
  Box,
  Button,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getSourcingTheme from "../../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import {
  formatSpecStatusDisplayLabel,
  type MaterialBlock,
  type RawMaterialLotDetailsContext,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import { fileUtils } from "../../../../../utils/FileUtils";

const BL = STRINGS.SOURCING.BATCH_LIST;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  visibility: VisibilityRoundedIcon,
  inventory: InventoryRoundedIcon,
  description: DescriptionRoundedIcon,
  insertDriveFile: InsertDriveFileOutlinedIcon,
  openInNew: OpenInNewRoundedIcon,
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type RawMaterialLotDetailsViewProps = {
  row: RawMaterialLotDetailsContext;
  blocks: MaterialBlock[];
  loading: boolean;
  onBack: () => void;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const RawMaterialLotDetailsView = ({ row, blocks, loading, onBack }: RawMaterialLotDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getSourcingTheme(mode), [mode]);
  const rmTheme = theme.sourcing.rawMaterial.lotDetails;

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...theme.batchList.statusConfig[status] },
        ])
      ),
    [theme]
  );

  const block = blocks[0];
  const metaFields = [
    { label: BL.COL_LOT_ID, value: row.lotId },
    { label: BL.COL_PROCUREMENT_ID, value: row.procurementId || "—" },
    { label: BL.COL_MATERIAL_CODE, value: row.materialCode || block?.material || "—" },
    { label: BL.COL_MATERIAL_NAME, value: row.materialName || "—" },
    { label: BL.COL_SUPPLY_ORDER, value: block?.supplyOrderNo || row.supplyOrderNo || "—" },
    { label: BL.COL_RECEIPT_DATE, value: formatDate(block?.receiptDate || row.receiptDate) },
    { label: BL.COL_MANUFACTURER, value: block?.manufacturerName || row.manufacturerName || "—" },
    {
      label: BL.COL_CREATED_BY,
      value: row.createdBy?.fullName ?? BL.UNASSIGNED,
    },
    { label: BL.COL_CREATED_ON, value: formatDate(row.createdOn) },
  ];

  return (
    <Box sx={rmTheme.page}>
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

      <Box sx={rmTheme.document}>
        <Box sx={rmTheme.banner}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="flex-start" gap={1.5}>
              <InventoryRoundedIcon sx={rmTheme.bannerIcon} />
              <Box>
                <Typography sx={rmTheme.bannerTitle}>{BL.LOT_DETAILS_TITLE}</Typography>
                <Typography sx={rmTheme.bannerSubtitle}>
                  {row.lotId}
                  {row.materialName || row.materialCode ? ` · ${row.materialName || row.materialCode}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={row.rmStatus}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={row.rejectionReason ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={rmTheme.body}>
          {loading ? (
            <Box sx={rmTheme.loadingBox}>
              <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
              <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_LOADING}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={rmTheme.section}>
                <Typography sx={rmTheme.sectionTitle}>
                  <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
                  {BL.LOT_DETAILS_PROCUREMENT_SECTION}
                </Typography>
                <Box sx={rmTheme.metaGrid}>
                  {metaFields.map((field) => (
                    <Box key={field.label} sx={rmTheme.metaItem}>
                      <Typography sx={rmTheme.metaLabel}>{field.label}</Typography>
                      <Typography sx={rmTheme.metaValue}>{field.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={rmTheme.section}>
                <Typography sx={rmTheme.sectionTitle}>
                  <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  {BL.LOT_DETAILS_SPEC_SECTION}
                </Typography>
                {block?.rows?.length ? (
                  <TableContainer sx={rmTheme.tableContainer}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Specification", "Reference range", "Analyzed result", "Remarks", "Status"].map((h) => (
                            <TableCell key={h} sx={rmTheme.tableHeaderCell}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {block.rows.map((specRow, ri) => {
                          const failed = Boolean(specRow.isOutOfRange);
                          const statusLabel = formatSpecStatusDisplayLabel(specRow.status, specRow.isOutOfRange);
                          return (
                            <TableRow key={`${specRow.specificationCode ?? ri}`} sx={rmTheme.tableRow(ri, failed)}>
                              <TableCell sx={{ ...rmTheme.tableCell, ...rmTheme.specText }}>
                                {specRow.specification || specRow.specificationName || "—"}
                              </TableCell>
                              <TableCell sx={rmTheme.tableCell}>
                                <Chip label={specRow.refRange || "—"} size="small" sx={rmTheme.refChip} />
                              </TableCell>
                              <TableCell sx={rmTheme.tableCell}>
                                <Typography sx={failed ? rmTheme.failedResult : rmTheme.resultText}>
                                  {specRow.analysedResult || "—"}
                                </Typography>
                              </TableCell>
                              <TableCell sx={rmTheme.tableCell}>
                                <Typography sx={rmTheme.remarksText}>{specRow.remarks || "—"}</Typography>
                              </TableCell>
                              <TableCell sx={rmTheme.tableCell}>
                                {statusLabel ? (
                                  <Chip
                                    label={statusLabel}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.62rem",
                                      fontWeight: 700,
                                      background: failed
                                        ? alpha(theme.palette.danger, 0.1)
                                        : alpha(theme.palette.accent, 0.1),
                                      color: failed ? theme.palette.danger : theme.palette.accent,
                                    }}
                                  />
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_EMPTY}</Typography>
                )}
              </Box>

              <Box sx={{ ...rmTheme.section, mb: 0 }}>
                <Typography sx={rmTheme.sectionTitle}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 18 }} />
                  {BL.LOT_DETAILS_CERTIFICATES_SECTION}
                </Typography>
                {block?.certificates?.length ? (
                  <Stack spacing={1}>
                    {block.certificates.map((cert, ci) => (
                      <Box key={`${cert.fileName}-${ci}`} sx={rmTheme.certRow}>
                        <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: theme.palette.primaryLight }} />
                        <Box flex={1} minWidth={0}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text }}>
                            {cert.fileName || "Document"}
                          </Typography>
                          {cert.certificateType ? (
                            <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub }}>
                              {cert.certificateType}
                            </Typography>
                          ) : null}
                        </Box>
                        {fileUtils.isOpenableCertificateUrl(cert.fileUrl) ? (
                          <Link
                            href={cert.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={rmTheme.certLink}
                          >
                            Open
                            <OpenInNewRoundedIcon sx={{ fontSize: 14, ml: 0.3, verticalAlign: "middle" }} />
                          </Link>
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography sx={rmTheme.emptyText}>{BL.LOT_DETAILS_NO_CERTIFICATES}</Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default RawMaterialLotDetailsView;

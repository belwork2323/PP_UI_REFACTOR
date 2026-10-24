import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import dayjs from "dayjs";

import { useThemeStore } from "@app/store/themeStore";
import { useAuthStore } from "@app/store/authStore";
import { getRocketMotorCasingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rocketMotorCasingApprover_theme";
import getSourcingTheme from "@app/theme/custom_themes/user/sourcing/sourcing_theme";
import { isApproverActionableStatus } from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import { formatMotorStageLabel } from "@data/models/approver/RocketMotorCasingApproverModel";
import { ReportPreviewDialog } from "../../components/ReportPdf";
import DimensionalInspectionDetailTable from "../../../user/sourcing/components/DimensionalInspectionDetailTable";
import MockTrialDetailTables from "../../../user/sourcing/components/MockTrialDetailTables";
import FilePreviewDialog from "@ui/components/common/FilePreviewDialog";
import { useFilePreview } from "@/hooks/useFilePreview";

const BL = STRINGS.SOURCING.BATCH_LIST;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rocketMotorCasing;

export type RocketCasingDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: any | null;
  loading: boolean;
  theme: ReturnType<typeof getRocketMotorCasingApproverTheme>;
  /** When omitted, Approve/Reject footer actions are hidden (read-only / admin). */
  onApprove?: (item: any) => void;
  onReject?: (item: any) => void;
};

const formatDetailDate = (value?: string) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
};

const DEFAULT_DETAIL_COLUMNS = [
  { key: "specification", label: "Section / Parameter" },
  { key: "analysedResult", label: "Details" },
];

const hasRemarksColumn = (columns: Array<{ key?: string; label: string }>) =>
  columns.some((col) => col.key === "remarks" || col.label === "Remarks");

const RocketCasingDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  onApprove,
  onReject,
  theme,
}: RocketCasingDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const sourcingTheme = useMemo(() => getSourcingTheme(mode), [mode]);
  const dimTableTheme = sourcingTheme.sourcing.rocketMotor.casingDetails;
  const authSubDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
  );
  const subDepartmentId = Number(
    item?.subDepartmentId ?? authSubDepartmentId ?? 0,
  ) || undefined;
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const showActions = Boolean(onApprove && onReject);

  const renderResultCell = (row: any) => {
    const fileId = String(row?.fileId ?? "").trim();
    const canOpen = Boolean(fileId && subDepartmentId);
    if (!canOpen) return row?.analysedResult || "—";
    return (
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
        <Typography component="span" sx={theme.dialog.innerResultText}>
          {row?.analysedResult || "—"}
        </Typography>
        <Link
          component="button"
          type="button"
          onClick={() =>
            void openFile(fileId, subDepartmentId!, row?.fileName || row?.analysedResult)
          }
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.25,
            cursor: "pointer",
          }}
        >
          View
          <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
        </Link>
      </Stack>
    );
  };

  const renderKeyValueTable = (rows: any[], columns = DEFAULT_DETAIL_COLUMNS) => {
    const showRemarks = hasRemarksColumn(columns);
    return (
      <TableContainer sx={theme.dialog.innerTableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col: { label: string }, i: number) => (
                <TableCell key={col.label} sx={theme.dialog.innerHeaderCell(i === 0)}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any, ri: number) => (
              <TableRow key={`${row.specification}-${ri}`} sx={theme.dialog.innerRow(ri)}>
                <TableCell sx={theme.dialog.innerSpecText}>{row.specification}</TableCell>
                <TableCell sx={theme.dialog.innerResultText}>{renderResultCell(row)}</TableCell>
                {showRemarks ? (
                  <TableCell sx={theme.dialog.innerRemarksText}>
                    {row.remarks?.trim() ? row.remarks : "—"}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (!item) return null;

  const canApproveOrReject = showActions && isApproverActionableStatus(item.status);
  const blocks = Array.isArray(item.casingBlocks) ? item.casingBlocks : [];
  const stageLabel =
    item.motorStageLabel ?? formatMotorStageLabel(item.motorStage ?? item.motorType);
  const metaFields = [
    { label: BL.COL_MOTOR_CASING_ID, value: item.motorCasingId ?? item.batchId ?? "—" },
    { label: BL.COL_PROJECT_ID, value: item.projectId || "—" },
    { label: BL.COL_MOTOR_ID, value: item.motorId ?? item.motorNo ?? "—" },
    { label: BL.COL_MOTOR_STAGE, value: stageLabel || "—" },
    { label: BL.COL_CASING_TYPE, value: item.casingType || "—" },
    { label: BL.COL_INSULATION_TYPE, value: item.insulationType || "—" },
    { label: BL.COL_RECEIVING_DATE, value: formatDetailDate(item.receivingDate) },
    { label: BL.COL_CREATED_BY, value: item.submittedBy || "—" },
    { label: BL.COL_CREATED_ON, value: formatDetailDate(item.createdOn) },
    { label: BL.COL_STAGE_STATUS, value: item.status || "—" },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullWidth
        PaperProps={{ sx: theme.dialog.paper }}
      >
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <RocketLaunchRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Rocket Casing Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.motorCasingId ?? item.batchId}
                {stageLabel ? ` · ${stageLabel}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              disabled={loading || !subDepartmentId}
              sx={theme.dialog.pdfButton}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small" sx={theme.dialog.closeButton}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={theme.dialog.content}>
          {loading ? (
            <Box sx={theme.dialog.loadingContainer}>
              <CircularProgress size={32} sx={theme.dialog.loadingSpinner} />
              <Typography sx={theme.dialog.loadingText}>Loading casing details...</Typography>
            </Box>
          ) : (
            <>
              <Box sx={theme.dialog.sectionCard}>
                <Typography sx={theme.dialog.sectionTitle}>
                  {BL.CASING_DETAILS_IDENTIFICATION_SECTION}
                </Typography>
                <Box sx={theme.dialog.metaGrid}>
                  {metaFields.map((field) => (
                    <Box key={field.label} sx={theme.dialog.metaItem}>
                      <Typography sx={theme.dialog.metaLabel}>{field.label}</Typography>
                      <Typography sx={theme.dialog.metaValue}>{field.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {blocks.length ? (
                blocks.map((block: any, bi: number) => {
                  const columns = block._columns ?? DEFAULT_DETAIL_COLUMNS;
                  const nestedTables = block.mockTrialTables?.length
                    ? block.mockTrialTables
                    : block.radiographyPlanTables?.length
                      ? block.radiographyPlanTables
                      : block.insulationSpecTables?.length
                        ? block.insulationSpecTables
                        : [];
                  return (
                    <Box
                      key={`${block.material}-${bi}`}
                      sx={theme.dialog.blockWrapper(bi === blocks.length - 1)}
                    >
                      <Stack direction="row" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                        <Chip label={block.material} size="small" sx={theme.chips.material} />
                        {block.lotNo ? (
                          <Typography sx={theme.dialog.blockMeta}>
                            Ref:{" "}
                            <Box component="span" sx={theme.dialog.blockMetaStrong}>
                              {block.lotNo}
                            </Box>
                          </Typography>
                        ) : null}
                      </Stack>

                      {block.dimensionalTable?.length ? (
                        <DimensionalInspectionDetailTable
                          rows={block.dimensionalTable}
                          dt={dimTableTheme}
                        />
                      ) : nestedTables.length ? (
                        <>
                          {block.rows?.length > 0
                            ? renderKeyValueTable(block.rows, columns)
                            : null}
                          <Box sx={block.rows?.length ? theme.dialog.nestedTableGap : undefined}>
                            <MockTrialDetailTables tables={nestedTables} dt={dimTableTheme} />
                          </Box>
                        </>
                      ) : block.rows?.length ? (
                        renderKeyValueTable(block.rows, columns)
                      ) : (
                        <Typography sx={theme.dialog.emptyText}>
                          No records in this section.
                        </Typography>
                      )}
                    </Box>
                  );
                })
              ) : (
                <Typography sx={theme.dialog.emptyText}>
                  No casing details available for this form.
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} sx={theme.dialog.closeAction}>
            Close
          </Button>
          {canApproveOrReject && onApprove && onReject ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelRoundedIcon />}
                onClick={() => onReject?.(item)}
                disabled={loading}
                sx={theme.dialog.rejectAction}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove?.(item)}
                disabled={loading}
                sx={theme.dialog.approveAction}
              >
                Approve
              </Button>
            </>
          ) : null}
        </Box>
      </Dialog>

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
        themeColor={sourcingTheme.palette.primary}
        themeColorLight={sourcingTheme.palette.primaryLight}
      />

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.motorCasingId ?? item.batchId}
        department="sourcing"
        subDepartment="rocket-motor"
        subDepartmentId={subDepartmentId}
        dialogTitle={`Casing Report — ${item.motorCasingId ?? item.batchId}`}
      />
    </>
  );
};

export default RocketCasingDetailDialog;

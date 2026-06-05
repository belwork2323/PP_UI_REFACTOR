import { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Card,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { useThemeStore } from "../../../../app/store/themeStore";
import { getRocketMotorCasingApproverTheme } from "../../../../app/theme/custom_themes/approver/sourcing/rocketMotorCasingApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import useRocketMotorCasingApproverHook from "../../../../hooks/approver/sourcing/useRocketMotorCasingApproverHook";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { ReportPreviewDialog } from "../components/ReportPdf";
import { STRINGS } from "../../../../app/config/strings";
import getSourcingTheme from "../../../../app/theme/custom_themes/user/sourcing/sourcing_theme";
import DimensionalInspectionDetailTable from "../../user/sourcing/components/DimensionalInspectionDetailTable";

const BL = STRINGS.SOURCING.BATCH_LIST;
const MOTOR_TYPE_PREFIX = BL.MOTOR_TYPE_PREFIX;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rocketMotorCasing;

// ─── Dialog ───────────────────────────────────────────────────────────────────

type DetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: any | null;
  loading: boolean;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
  theme: ReturnType<typeof getRocketMotorCasingApproverTheme>;
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const RocketCasingDetailDialog = ({ open, onClose, item, loading, onApprove, onReject, theme }: DetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const sourcingTheme = useMemo(() => getSourcingTheme(mode), [mode]);
  const dimTableTheme = sourcingTheme.sourcing.rocketMotor.casingDetails;

  if (!item) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: theme.dialog.paper }}
      >
        {/* Header */}
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <RocketLaunchRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Rocket Casing Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.motorCasingId ?? item.batchId} · Stage {item.motorStage ?? item.motorType}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip label={item.priority} size="small" sx={theme.chips.priority(undefined)} />
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={theme.dialog.pdfButton}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small" sx={theme.dialog.closeButton}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={theme.dialog.content}>
          {loading ? (
            <Box sx={theme.dialog.loadingContainer}>
              <CircularProgress size={32} sx={theme.dialog.loadingSpinner} />
              <Typography sx={theme.dialog.loadingText}>Loading casing details...</Typography>
            </Box>
          ) : item.casingBlocks?.length ? (
            item.casingBlocks.map((block: any, bi: number) => (
              <Box key={bi} sx={theme.dialog.blockWrapper(bi === item.casingBlocks.length - 1)}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <Chip label={block.material} size="small" sx={theme.chips.material} />
                  {block.lotNo ? (
                    <Typography sx={theme.dialog.blockMeta}>
                      Lot/Batch No:{" "}
                      <Box component="span" sx={theme.dialog.blockMetaStrong}>
                        {block.lotNo}
                      </Box>
                    </Typography>
                  ) : null}
                </Stack>
                {block.dimensionalTable?.length ? (
                  <DimensionalInspectionDetailTable rows={block.dimensionalTable} dt={dimTableTheme} />
                ) : block.rows?.length ? (
                  <TableContainer sx={theme.dialog.innerTableContainer}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {(block._columns ?? [
                            { label: "Section / Parameter" },
                            { label: "Details" },
                            { label: "Remarks" },
                          ]).map((col: any, i: number) => (
                            <TableCell key={col.label} sx={theme.dialog.innerHeaderCell(i === 0)}>
                              {col.label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {block.rows.map((row: any, ri: number) => (
                          <TableRow key={ri} sx={theme.dialog.innerRow(ri)}>
                            <TableCell sx={theme.dialog.innerSpecText}>{row.specification}</TableCell>
                            <TableCell sx={theme.dialog.innerResultText}>{row.analysedResult || "—"}</TableCell>
                            <TableCell sx={theme.dialog.innerRemarksText}>{row.remarks || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography sx={theme.dialog.emptyText}>No records in this section.</Typography>
                )}
              </Box>
            ))
          ) : (
            <Typography sx={theme.dialog.emptyText}>No casing details available for this form.</Typography>
          )}
        </DialogContent>

        {/* Footer */}
        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} sx={theme.dialog.closeAction}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<CancelRoundedIcon />}
            onClick={() => onReject(item)}
            disabled={loading}
            sx={theme.dialog.rejectAction}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => onApprove(item)}
            disabled={loading}
            sx={theme.dialog.approveAction}
          >
            Approve
          </Button>
        </Box>
      </Dialog>

      {/* PDF Preview */}
      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.motorCasingId ?? item.batchId}
        department="sourcing"
        subDepartment="rocket-motor"
        dialogTitle={`Casing Report — ${item.motorCasingId ?? item.batchId}`}
      />
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const RocketMotorApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRocketMotorCasingApproverTheme(mode), [mode]);

  const {
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    statusMeta,
    priorityMeta,
  } = useRocketMotorCasingApproverHook();

  return (
    <ApproverList
      department="sourcing"
      subDepartment="rocket-motor"
      statusField="status"
      statusMeta={statusMeta}
      searchKeys={[
        "motorCasingId",
        "procurementId",
        "motorStage",
        "motorNo",
        "casingType",
        "insulationType",
        "submittedBy",
      ]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Motor stage", options: ["A", "B", "C"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card sx={theme.table.containerCard} elevation={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      BL.COL_MOTOR_CASING_ID,
                      BL.COL_PROCUREMENT_ID,
                      BL.COL_MOTOR_TYPE,
                      BL.COL_MOTOR_ID,
                      BL.COL_BATCH_TYPE,
                      BL.COL_CREATED_BY,
                      BL.COL_CREATED_ON,
                      BL.COL_PRIORITY,
                      BL.COL_STAGE_STATUS,
                    ].map((h) => (
                      <TableCell key={h} sx={theme.table.headerCell}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ ...theme.table.headerCell, textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx: number) => (
                    <TableRow key={row.motorCasingId ?? row.id ?? row.formId ?? idx} sx={theme.table.row(idx)}>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.batchIdText}>{row.motorCasingId ?? row.batchId}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.subtleText}>{row.procurementId ?? row.formId ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip
                          label={`${MOTOR_TYPE_PREFIX}${row.motorStage ?? row.motorType ?? "—"}`}
                          size="small"
                          sx={theme.chips.type}
                        />
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.subtleText }}>
                        {row.motorNo ?? row.motorId ?? "—"}
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.casingType ?? row.batchType ?? "—"} size="small" sx={theme.chips.type} />
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>{row.submittedBy}</TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.dateText }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.priority} size="small" sx={theme.chips.priority(priorityMeta[row.priority])} />
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.status} size="small" sx={theme.chips.status(statusMeta[row.status])} />
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.actionCell }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => handleViewDetails(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={theme.table.actionButton(isApproverActionableStatus(row.status))}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <RocketCasingDetailDialog
            open={!!selected}
            onClose={handleCloseDetail}
            item={selected}
            loading={detailsLoading}
            onApprove={requestApprove}
            onReject={requestReject}
            theme={theme}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      )}
    </ApproverList>
  );
};

export default RocketMotorApproverPage;

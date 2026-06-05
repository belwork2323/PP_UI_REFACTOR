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
import { getRawMaterialApproverTheme } from "../../../../app/theme/custom_themes/approver/sourcing/rawMaterialApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import useRawMaterialApproverHook from "../../../../hooks/approver/sourcing/useRawMaterialApproverHook";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { ReportPreviewDialog } from "../components/ReportPdf";
import { STRINGS } from "../../../../app/config/strings";

const BL = STRINGS.SOURCING.BATCH_LIST;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  inventory: InventoryRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rawMaterialProcurement;

// ─── Dialog ───────────────────────────────────────────────────────────────────

type DetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: any | null;
  loading: boolean;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
  theme: ReturnType<typeof getRawMaterialApproverTheme>;
};

const RawMaterialDetailDialog = ({ open, onClose, item, loading, onApprove, onReject, theme }: DetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <InventoryRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Raw Material Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.lotId ?? item.batchId} · {item.materialName ?? item.materialCode}
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

        <DialogContent sx={theme.dialog.content}>
          {loading ? (
            <Box sx={theme.dialog.loadingContainer}>
              <CircularProgress size={32} sx={theme.dialog.loadingSpinner} />
              <Typography sx={theme.dialog.loadingText}>Loading raw material details...</Typography>
            </Box>
          ) : item.qcBlocks?.length ? (
            item.qcBlocks.map((block: any, bi: number) => (
              <Box key={bi} sx={theme.dialog.blockWrapper(bi === item.qcBlocks.length - 1)}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <Chip label={block.material} size="small" sx={theme.chips.material} />
                  <Typography sx={theme.dialog.blockMeta}>
                    Man. Lot/Batch No.:{" "}
                    <Box component="span" sx={theme.dialog.blockMetaStrong}>
                      {block.lotNo || "—"}
                    </Box>
                  </Typography>
                </Stack>
                <TableContainer sx={theme.dialog.innerTableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Material", "Man. Lot/Batch No.", "Specification", "Ref. Range", "Analyzed Result", "Remarks"].map(
                          (h, i) => (
                            <TableCell key={h} sx={theme.dialog.innerHeaderCell(i === 0)}>
                              {h}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {block.rows.map((row: any, ri: number) => (
                        <TableRow key={ri} sx={theme.dialog.innerRow(ri)}>
                          <TableCell sx={theme.dialog.innerCell}>
                            {ri === 0 && <Chip label={block.material} size="small" sx={theme.chips.inlineMaterial} />}
                          </TableCell>
                          <TableCell sx={theme.dialog.innerLotText}>{ri === 0 ? block.lotNo || "—" : ""}</TableCell>
                          <TableCell sx={theme.dialog.innerSpecText}>{row.specification}</TableCell>
                          <TableCell sx={theme.dialog.innerCell}>
                            <Chip label={row.refRange} size="small" sx={theme.chips.refRange} />
                          </TableCell>
                          <TableCell sx={theme.dialog.innerResultText}>{row.analysedResult || "—"}</TableCell>
                          <TableCell sx={theme.dialog.innerRemarksText}>{row.remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <Typography sx={theme.dialog.emptyText}>No raw material details available for this form.</Typography>
          )}
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} sx={theme.dialog.closeAction}>
            Close
          </Button>
          <Button variant="contained" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)} disabled={loading} sx={theme.dialog.rejectAction}>
            Reject
          </Button>
          <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} onClick={() => onApprove(item)} disabled={loading} sx={theme.dialog.approveAction}>
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.lotId ?? item.batchId}
        department="sourcing"
        subDepartment="raw-material"
        dialogTitle={`Raw Material Report — ${item.lotId ?? item.batchId}`}
      />
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const RawMaterialApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialApproverTheme(mode), [mode]);

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
  } = useRawMaterialApproverHook();

  return (
    <ApproverList
      department="sourcing"
      subDepartment="raw-material"
      statusField="status"
      statusMeta={statusMeta}
      searchKeys={["lotId", "procurementId", "materialCode", "materialName", "supplyOrderNo", "manufacturerName", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card sx={theme.table.containerCard} elevation={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[BL.COL_LOT_ID, BL.COL_PROCUREMENT_ID, BL.COL_MATERIAL_CODE, BL.COL_MATERIAL_NAME, BL.COL_SUPPLY_ORDER, BL.COL_CREATED_BY, BL.COL_CREATED_ON, BL.COL_PRIORITY, BL.COL_RM_STATUS].map((h) => (
                      <TableCell key={h} sx={theme.table.headerCell}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ ...theme.table.headerCell, textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx: number) => (
                    <TableRow key={row.lotId ?? row.id ?? row.formId ?? idx} sx={theme.table.row(idx)}>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.batchIdText}>{row.lotId ?? row.batchId}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.subtleText}>{row.procurementId ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.materialCode ?? row.batchType} size="small" sx={theme.chips.type} />
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={{ fontSize: "0.82rem" }}>{row.materialName ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.subtleText }}>
                        {row.supplyOrderNo ?? "—"}
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

          <RawMaterialDetailDialog
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

export default RawMaterialApproverPage;

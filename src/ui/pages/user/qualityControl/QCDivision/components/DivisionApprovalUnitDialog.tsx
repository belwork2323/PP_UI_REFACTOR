import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ConfirmAlertDialog from "../../../../../components/common/ConfirmAlertDialog";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  type QcApprovalTableRow,
} from "../../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type DivisionApprovalUnitDialogProps = {
  open: boolean;
  rows: QcApprovalTableRow[];
  canProceed: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onProceed: () => void;
};

const DivisionApprovalUnitDialog = ({
  open,
  rows,
  canProceed,
  confirmDisabled = false,
  onClose,
  onProceed,
}: DivisionApprovalUnitDialogProps) => (
  <ConfirmAlertDialog
    open={open}
    title={S.DIVISION_APPROVAL_DIALOG_TITLE}
    message={S.DIVISION_APPROVAL_DIALOG_INFO}
    severity="info"
    maxWidth="sm"
    confirmLabel={S.DIVISION_APPROVAL_PROCEED}
    cancelLabel={S.DIVISION_APPROVAL_CLOSE}
    confirmDisabled={!canProceed || confirmDisabled}
    onConfirm={onProceed}
    onCancel={onClose}
  >
    <Box
      sx={{
        mt: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        overflow: "hidden",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.DIVISION_APPROVAL_COL_UNIT}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.DIVISION_APPROVAL_COL_TYPE}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.DIVISION_APPROVAL_COL_STATUS}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const chip = PARTIAL_ITEM_STATUS_CHIP[row.status] ?? PARTIAL_ITEM_STATUS_CHIP.TO_BE_INITIATED;
            return (
              <TableRow key={row.id}>
                <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                  {row.unitLabel}
                </TableCell>
                <TableCell sx={{ fontSize: "0.74rem" }}>{row.submissionType || "—"}</TableCell>
                <TableCell>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      bgcolor: chip.bg,
                      color: chip.color,
                      border: `1px solid ${chip.border}`,
                    }}
                  >
                    {chip.label}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
    {!canProceed ? (
      <Box sx={{ mt: 1.25, fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
        {S.DIVISION_APPROVAL_NOT_READY}
      </Box>
    ) : null}
  </ConfirmAlertDialog>
);

export default DivisionApprovalUnitDialog;

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
  type PremixStatusMeta,
  type PremixSubmissionStatus,
} from "../../../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip, { type PremixStatusThemeConfig } from "./PremixStatusChip";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

export type FinalApprovalPremixRow = {
  premixNo: number;
  premixSubmissionStatus: PremixSubmissionStatus | string;
  premixSubmissionType?: string | null;
};

type FinalApprovalPremixDialogProps = {
  open: boolean;
  rows: FinalApprovalPremixRow[];
  statusConfig: PremixStatusThemeConfig;
  onClose: () => void;
};

export const buildFinalApprovalPremixRows = (
  premixStatusByNo: Record<number, PremixStatusMeta> | undefined,
  totalPremix: number,
): FinalApprovalPremixRow[] => {
  const statuses = premixStatusByNo ?? {};
  const fromMap = Object.keys(statuses)
    .map((key) => Number(key))
    .filter((n) => Number.isFinite(n) && n > 0);
  const count = Math.max(totalPremix || 0, fromMap.length > 0 ? Math.max(...fromMap) : 0);

  return Array.from({ length: count }, (_, index) => {
    const premixNo = index + 1;
    const meta = statuses[premixNo];
    return {
      premixNo,
      premixSubmissionStatus: meta?.premixSubmissionStatus ?? "TO_BE_INITIATED",
      premixSubmissionType: meta?.premixSubmissionType ?? null,
    };
  });
};

export const areAllPremixesApproved = (rows: FinalApprovalPremixRow[]): boolean =>
  rows.length > 0 &&
  rows.every((row) => String(row.premixSubmissionStatus).toUpperCase() === "APPROVED");

const FinalApprovalPremixDialog = ({
  open,
  rows,
  statusConfig,
  onClose,
}: FinalApprovalPremixDialogProps) => (
  <ConfirmAlertDialog
    open={open}
    title={RM.FINAL_APPROVAL_DIALOG_TITLE}
    message={RM.FINAL_APPROVAL_DIALOG_INFO}
    severity="info"
    maxWidth="sm"
    hideConfirm
    cancelLabel={RM.FINAL_APPROVAL_CLOSE}
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
              {RM.FINAL_APPROVAL_COL_PREMIX}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {RM.FINAL_APPROVAL_COL_TYPE}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {RM.FINAL_APPROVAL_COL_STATUS}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.premixNo}>
              <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                Premix {row.premixNo}
              </TableCell>
              <TableCell sx={{ fontSize: "0.74rem" }}>
                {row.premixSubmissionType || "—"}
              </TableCell>
              <TableCell>
                <PremixStatusChip
                  status={row.premixSubmissionStatus as PremixSubmissionStatus}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
                No premix status available.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Box>
  </ConfirmAlertDialog>
);

export default FinalApprovalPremixDialog;

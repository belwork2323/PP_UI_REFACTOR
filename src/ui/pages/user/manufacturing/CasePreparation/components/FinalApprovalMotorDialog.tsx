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
  type MotorStatusMeta,
  type MotorSubmissionStatus,
} from "../../../../../../data/models/user/CasePreparationFormModel";
import PremixStatusChip, {
  type PremixStatusThemeConfig,
} from "../../RawMaterial/components/PremixStatusChip";

const S = STRINGS.MANUFACTURING.CASE_PREP;

export type FinalApprovalMotorRow = {
  motorId: string;
  motorSubmissionStatus: MotorSubmissionStatus | string;
  motorSubmissionType?: string | null;
};

type FinalApprovalMotorDialogProps = {
  open: boolean;
  rows: FinalApprovalMotorRow[];
  statusConfig: PremixStatusThemeConfig;
  allMotorsApproved: boolean;
  confirmDisabled?: boolean;
  onClose: () => void;
  onProceed: () => void;
};

export const buildFinalApprovalMotorRows = (
  motorStatusById: Record<string, MotorStatusMeta> | undefined,
  motorIds: string[],
): FinalApprovalMotorRow[] => {
  const statuses = motorStatusById ?? {};
  const ids =
    motorIds.length > 0
      ? motorIds
      : Object.keys(statuses).filter((id) => String(id).trim().length > 0);

  return ids.map((motorId) => {
    const meta = statuses[motorId];
    return {
      motorId,
      motorSubmissionStatus: meta?.motorSubmissionStatus ?? "TO_BE_INITIATED",
      motorSubmissionType: meta?.motorSubmissionType ?? null,
    };
  });
};

export const areAllMotorsApproved = (rows: FinalApprovalMotorRow[]): boolean =>
  rows.length > 0 &&
  rows.every((row) => String(row.motorSubmissionStatus).toUpperCase() === "APPROVED");

const FinalApprovalMotorDialog = ({
  open,
  rows,
  statusConfig,
  allMotorsApproved,
  confirmDisabled = false,
  onClose,
  onProceed,
}: FinalApprovalMotorDialogProps) => (
  <ConfirmAlertDialog
    open={open}
    title={S.FINAL_APPROVAL_DIALOG_TITLE}
    message={S.FINAL_APPROVAL_DIALOG_INFO}
    severity="info"
    maxWidth="sm"
    confirmLabel={S.FINAL_APPROVAL_PROCEED}
    cancelLabel={S.FINAL_APPROVAL_CLOSE}
    confirmDisabled={!allMotorsApproved || confirmDisabled}
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
              {S.FINAL_APPROVAL_COL_MOTOR}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_TYPE}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_STATUS}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.motorId}>
              <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
                {row.motorId}
              </TableCell>
              <TableCell sx={{ fontSize: "0.74rem" }}>
                {row.motorSubmissionType || "—"}
              </TableCell>
              <TableCell>
                <PremixStatusChip
                  status={row.motorSubmissionStatus as any}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    {!allMotorsApproved ? (
      <Box sx={{ mt: 1.25, fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
        {S.FINAL_APPROVAL_NOT_READY}
      </Box>
    ) : null}
  </ConfirmAlertDialog>
);

export default FinalApprovalMotorDialog;

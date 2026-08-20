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

type FinalApprovalCopy = {
  title: string;
  info: string;
  proceed: string;
  close: string;
  notReady: string;
  colMotor: string;
  colType: string;
  colStatus: string;
};

type FinalApprovalMotorDialogProps = {
  open: boolean;
  rows: FinalApprovalMotorRow[];
  statusConfig: PremixStatusThemeConfig;
  allMotorsApproved: boolean;
  confirmDisabled?: boolean;
  copy?: FinalApprovalCopy;
  hideConfirm?: boolean;
  onClose: () => void;
  onProceed?: () => void;
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
  copy,
  hideConfirm = false,
  onClose,
  onProceed,
}: FinalApprovalMotorDialogProps) => {
  const labels = copy ?? {
    title: S.FINAL_APPROVAL_DIALOG_TITLE,
    info: S.FINAL_APPROVAL_DIALOG_INFO,
    proceed: S.FINAL_APPROVAL_PROCEED,
    close: S.FINAL_APPROVAL_CLOSE,
    notReady: S.FINAL_APPROVAL_NOT_READY,
    colMotor: S.FINAL_APPROVAL_COL_MOTOR,
    colType: S.FINAL_APPROVAL_COL_TYPE,
    colStatus: S.FINAL_APPROVAL_COL_STATUS,
  };

  return (
  <ConfirmAlertDialog
    open={open}
    title={labels.title}
    message={labels.info}
    severity="info"
    maxWidth="sm"
    confirmLabel={labels.proceed}
    cancelLabel={labels.close}
    confirmDisabled={!allMotorsApproved || confirmDisabled}
    hideConfirm={hideConfirm}
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
              {labels.colMotor}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {labels.colType}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {labels.colStatus}
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
    {!hideConfirm && !allMotorsApproved ? (
      <Box sx={{ mt: 1.25, fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
        {labels.notReady}
      </Box>
    ) : null}
  </ConfirmAlertDialog>
  );
};

export default FinalApprovalMotorDialog;

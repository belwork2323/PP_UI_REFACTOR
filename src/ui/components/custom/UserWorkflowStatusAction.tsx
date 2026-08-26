import { Button, Chip, Tooltip } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { toApiStatusEnum, type OperationStatusMap } from "../../../hooks/operationStatus";

type UserWorkflowStatusActionProps = {
  status: string;
  row: any;
  statusMap: OperationStatusMap;
  onFillForm: (row: any) => void;
  onEditForm: (row: any) => void;
  theme: any;
  fillLabel: string;
  continueLabel: string;
  editLabel?: string;
  editTooltip?: string;
  waitingLabel?: string;
  approvedLabel?: string;
  /** When true, "Continue" uses the same prominent contained style as the fill action */
  continueUsesPrimaryStyle?: boolean;
};

const UserWorkflowStatusAction = ({
  status,
  row,
  statusMap,
  onFillForm,
  onEditForm,
  theme,
  fillLabel,
  continueLabel,
  editLabel = "Edit & Resubmit",
  editTooltip = "Load previously submitted data",
  waitingLabel = "Awaiting Approver",
  approvedLabel = "Approved",
  continueUsesPrimaryStyle = false,
}: UserWorkflowStatusActionProps) => {
  const apiStatus = toApiStatusEnum(status);

  const isToBeInitiated =
    apiStatus === "TO_BE_INITIATED" || !apiStatus;

  const isInProgress =
    apiStatus === "IN_PROGRESS" || apiStatus === "WAITING_FOR_PARTIAL_APPROVAL";

  const isRejected = apiStatus === "REJECTED";

  const isWaitingForApproval =
    apiStatus === "WAITING_FOR_APPROVAL" || apiStatus === "WAITING_FOR_COMPLETE_APPROVAL";

  const isApproved =
    apiStatus === "APPROVED" ||
    apiStatus === "COMPLETELY_APPROVED" ||
    apiStatus === "FINAL_APPROVAL_COMPLETED";

  if (isToBeInitiated) {
    return (
      <Button
        variant="contained"
        size="small"
        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
        onClick={() => onFillForm(row)}
        sx={theme.batchList.action.primary}
      >
        {fillLabel}
      </Button>
    );
  }

  if (isInProgress) {
    return (
      <Button
        variant={continueUsesPrimaryStyle ? "contained" : "outlined"}
        size="small"
        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
        onClick={() => onFillForm(row)}
        sx={
          continueUsesPrimaryStyle
            ? theme.batchList.action.primary
            : theme.batchList.action.secondary
        }
      >
        {continueLabel}
      </Button>
    );
  }

  if (isRejected) {
    return (
      <Tooltip title={editTooltip} arrow placement="top">
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditRoundedIcon sx={{ fontSize: "14px !important" }} />}
          onClick={() => onEditForm(row)}
          sx={theme.batchList.action.danger}
        >
          {editLabel}
        </Button>
      </Tooltip>
    );
  }

  if (isWaitingForApproval) {
    return <Chip label={waitingLabel} size="small" sx={theme.batchList.chips.waiting} />;
  }

  if (isApproved) {
    const isCompletelyApproved =
      apiStatus === "COMPLETELY_APPROVED" || apiStatus === "FINAL_APPROVAL_COMPLETED";

    return (
      <Chip
        icon={
          <CheckCircleRoundedIcon
            sx={{
              fontSize: "13px !important",
              color: `${theme.palette.success?.main || theme.palette.success} !important`,
            }}
          />
        }
        label={isCompletelyApproved ? statusMap?.COMPLETELY_APPROVED ?? "Completely Approved" : approvedLabel}
        size="small"
        sx={theme.batchList.chips.approved}
      />
    );
  }

  return null;
};

export default UserWorkflowStatusAction;

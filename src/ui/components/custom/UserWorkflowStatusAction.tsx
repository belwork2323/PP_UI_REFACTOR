import { Button, Chip, Tooltip } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

type UserWorkflowStatusActionProps = {
  status: string;
  row: any;
  statusMap: {
    INITIATED: string;
    IN_PROGRESS: string;
    WAITING_FOR_APPROVAL: string;
    APPROVED: string;
    REJECTED: string;
  };
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
  switch (status) {
    case statusMap.INITIATED:
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

    case statusMap.IN_PROGRESS:
      return (
        <Button
          variant={continueUsesPrimaryStyle ? "contained" : "outlined"}
          size="small"
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: "14px !important" }} />}
          onClick={() => onFillForm(row)}
          sx={continueUsesPrimaryStyle ? theme.batchList.action.primary : theme.batchList.action.secondary}
        >
          {continueLabel}
        </Button>
      );

    case statusMap.REJECTED:
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

    case statusMap.WAITING_FOR_APPROVAL:
      return <Chip label={waitingLabel} size="small" sx={theme.batchList.chips.waiting} />;

    case statusMap.APPROVED:
      return (
        <Chip
          icon={<CheckCircleRoundedIcon sx={{ fontSize: "13px !important", color: `${theme.palette.success} !important` }} />}
          label={approvedLabel}
          size="small"
          sx={theme.batchList.chips.approved}
        />
      );

    default:
      return null;
  }
};

export default UserWorkflowStatusAction;

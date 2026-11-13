import { IconButton, Stack, Tooltip } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import type { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import { canDeleteRawMaterialLot } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import AppButton from "@ui/components/common/Button";
import UserWorkflowStatusAction from "@ui/components/custom/UserWorkflowStatusAction";

const BL = STRINGS.SOURCING.BATCH_LIST;
const { visibility: VisibilityRoundedIcon } = icons.user.sourcing.rawMaterialBatchList;

/** Lot metadata edit — only for drafts not yet in workflow filling */
const canShowEditLotButton = (status: string) => status === OPERATION_STATUS.TO_BE_INITIATED;

const canViewLotDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

type RawMaterialLotRowActionsProps = {
  row: any;
  theme: ReturnType<typeof getRawMaterialSourcingPageTheme>;
  onFillForm: (row: any) => void;
  onEditLot: (row: any) => void;
  onDeleteLot: (row: any) => void;
  onViewDetails: (row: any) => void;
};

const RawMaterialLotRowActions = ({
  row,
  theme,
  onFillForm,
  onEditLot,
  onDeleteLot,
  onViewDetails,
}: RawMaterialLotRowActionsProps) => {
  const styles = theme.sourcing.rawMaterial.lotList;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" flexWrap="nowrap">
      {canViewLotDetails(row.rmStatus) ? (
        <Tooltip title={BL.VIEW_LOT_DETAILS_TOOLTIP} arrow placement="top">
          <IconButton
            size="small"
            onClick={() => onViewDetails(row)}
            aria-label={BL.VIEW_LOT_DETAILS}
            sx={styles.viewDetailsButton}
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <UserWorkflowStatusAction
          status={row.rmStatus}
          row={row}
          statusMap={OPERATION_STATUS}
          onFillForm={onFillForm}
          onEditForm={onEditLot}
          theme={theme}
          fillLabel={BL.FILL_ACTION}
          continueLabel={BL.CONTINUE_ACTION}
          continueUsesPrimaryStyle
          editLabel={BL.EDIT_LOT}
          editTooltip={BL.EDIT_ACTION_TOOLTIP}
        />
      )}
      {canShowEditLotButton(row.rmStatus) && (
        <AppButton
          variant="outlined"
          size="small"
          fullWidth={false}
          onClick={() => onEditLot(row)}
          sx={theme.batchList.action.secondary}
        >
          {BL.EDIT_LOT}
        </AppButton>
      )}
      {canDeleteRawMaterialLot(row.rmStatus) && (
        <Tooltip title={BL.DELETE_LOT_TOOLTIP} arrow placement="top">
          <IconButton
            size="small"
            onClick={() => onDeleteLot(row)}
            sx={styles.deleteButton}
            aria-label={BL.DELETE_LOT}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default RawMaterialLotRowActions;

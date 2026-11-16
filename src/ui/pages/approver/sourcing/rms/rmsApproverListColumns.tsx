import type { ReactNode } from "react";

import { STRINGS } from "@app/config/strings";
import { canApproverViewBatchDetails } from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import { getOperationStatusConfig, OPERATION_STATUS } from "@hooks/operationStatus";
import AppButton from "@ui/components/common/Button";
import type { BatchTableColumn } from "@ui/components/custom/BatchTable";
import {
  getRawMaterialLotListColumns,
  type RawMaterialLotListColumnTheme,
} from "@ui/pages/user/sourcing/rms/components/rawMaterialLotListColumns";

const { visibility: VisibilityRoundedIcon } = icons.approver.sourcing.rawMaterialSourcing;
const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const OPERATION_STATUS_ICONS = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

/** Same chip merge as user RMS lot list (icons + operations batchList.statusConfig). */
export const buildRmsApproverStatusConfig = (
  theme: RawMaterialLotListColumnTheme,
): Record<string, any> =>
  Object.fromEntries(
    Object.entries(OPERATION_STATUS_ICONS).map(([status, cfg]) => [
      status,
      { ...cfg, ...(theme.batchList?.statusConfig?.[status] ?? {}) },
    ]),
  );

/** Shared lot columns — BatchTable shape, status field `status`, created-by `submittedBy`. */
export const getRmsApproverListColumns = ({
  theme,
  statusConfig,
}: {
  theme: RawMaterialLotListColumnTheme;
  statusConfig: Record<string, any>;
}): BatchTableColumn[] =>
  getRawMaterialLotListColumns(theme, statusConfig, {
    statusField: "status",
    createdByKey: "submittedBy",
  });

/** Approver View Details action for BatchTable `renderAction`. */
export const renderRmsApproverRowAction = (
  row: any,
  onViewDetails: (row: any) => void,
  actionSx?: {
    button?: (enabled: boolean) => object;
    icon?: object;
  },
): ReactNode => {
  const canViewDetails = canApproverViewBatchDetails(row.status, {
    allowWhenApproved: true,
  });
  return (
    <AppButton
      size="small"
      variant="outlined"
      fullWidth={false}
      startIcon={<VisibilityRoundedIcon sx={actionSx?.icon ?? { fontSize: "13px !important" }} />}
      onClick={() => onViewDetails(row)}
      disabled={!canViewDetails}
      sx={
        actionSx?.button?.(canViewDetails) ?? {
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "0.72rem",
          textTransform: "none",
          px: 1.5,
          py: 0.6,
        }
      }
    >
      {STRINGS.APPROVER.COMMON.VIEW_DETAILS}
    </AppButton>
  );
};

import React, { useMemo } from "react";

import { icons } from "../../../../app/theme/icons";
import { dispatchBatchListLabels } from "../../../components/custom/subdepartmentBatchListColumns";
import { useThemeStore } from "../../../../app/store/themeStore";
import getOperationsTheme from "../../../../app/theme/custom_themes/shared/operations_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../hooks/operationStatus";
import { STRINGS } from "../../../../app/config/strings";
import UserSubdepartmentBatchListSection from "../../../components/custom/UserSubdepartmentBatchListSection";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.dispatch.list;

export const DISPATCH_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.DISPATCH;

const DispatchList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getOperationsTheme(mode), [mode]);

  return (
    <UserSubdepartmentBatchListSection
      hookState={hookState}
      rowsPerPageOptions={rowsPerPageOptions}
      theme={theme}
      statusField="dispatchStatus"
      statusLabel={S.COL_STATUS}
      rawStatusConfig={DISPATCH_STATUS_CONFIG}
      statusMap={OPERATION_STATUS}
      tableLabel={S.TABLE_LABEL}
      onViewDetails={hookState.handleViewDispatchDetails}
      PersonIcon={PersonRoundedIcon}
      CalendarIcon={CalendarMonthRoundedIcon}
      actionStrings={S.BATCH_LIST}
      columnLabels={dispatchBatchListLabels()}
      viewDetailsTooltip={S.VIEW_DETAILS_TOOLTIP}
    />
  );
};

export default DispatchList;

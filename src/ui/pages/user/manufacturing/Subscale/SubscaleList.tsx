import React, { useMemo } from "react";

import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import UserSubdepartmentBatchListSection from "../../../../components/custom/UserSubdepartmentBatchListSection";

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
  person: PersonRoundedIcon,
  calendar: CalendarMonthRoundedIcon,
} = icons.user.manufacturing.subscale.list;

export const SS_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.MANUFACTURING;

const SubscaleList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);

  return (
    <UserSubdepartmentBatchListSection
      hookState={hookState}
      rowsPerPageOptions={rowsPerPageOptions}
      theme={theme}
      statusField="ssStatus"
      statusLabel={S.SUBSCALE.COL_SS_STATUS}
      rawStatusConfig={SS_STATUS_CONFIG}
      statusMap={OPERATION_STATUS}
      tableLabel={S.SUBSCALE.TABLE_LABEL}
      onViewDetails={hookState.handleViewDetails}
      PersonIcon={PersonRoundedIcon}
      CalendarIcon={CalendarMonthRoundedIcon}
      extraSearchFields={["articleId"]}
      emptyText={S.SUBSCALE.EMPTY_TEXT}
    />
  );
};

export default SubscaleList;

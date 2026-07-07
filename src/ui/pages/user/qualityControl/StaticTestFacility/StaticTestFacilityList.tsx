import React, { useMemo } from "react";

import { icons } from "../../../../../app/theme/icons";
import { qualityControlBatchListLabels } from "../../../../components/custom/subdepartmentBatchListColumns";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
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
} = icons.user.qualityControl.staticTestFacility.list;

export const STF_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const S = STRINGS.QUALITY_CONTROL;

const STFList = ({ hookState, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);

  return (
    <UserSubdepartmentBatchListSection
      hookState={hookState}
      rowsPerPageOptions={rowsPerPageOptions}
      theme={theme}
      statusField="stfStatus"
      statusLabel={S.STATIC_TEST_FACILITY.COL_STATUS}
      rawStatusConfig={STF_STATUS_CONFIG}
      statusMap={OPERATION_STATUS}
      tableLabel={S.STATIC_TEST_FACILITY.TABLE_LABEL}
      onViewDetails={hookState.handleViewDetails}
      PersonIcon={PersonRoundedIcon}
      CalendarIcon={CalendarMonthRoundedIcon}
      actionStrings={S.BATCH_LIST}
      columnLabels={qualityControlBatchListLabels()}
    />
  );
};

export default STFList;

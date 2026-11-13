import { Box, Chip, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import type { getRocketMotorCasingPageTheme } from "@app/theme/custom_themes/user/sourcing/rocketMotorCasing_theme";
import { formatMotorStageLabel } from "@data/models/approver/RocketMotorCasingApproverModel";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import { formatDisplayDateTime } from "@utils/dateUtils";
import IconText from "@ui/components/common/IconText";
import UserWorkflowStatusCell from "@ui/components/custom/UserWorkflowStatusCell";

const BL = STRINGS.SOURCING.BATCH_LIST;
const { person: PersonRoundedIcon, calendar: CalendarMonthRoundedIcon } =
  icons.user.sourcing.rocketMotorBatchList;

/** `BatchList` column config for the rocket motor casing list. */
export const getCasingListColumns = (
  theme: ReturnType<typeof getRocketMotorCasingPageTheme>,
  statusConfig: Record<string, any>,
) => [
  {
    key: "motorCasingId",
    label: BL.COL_MOTOR_CASING_ID,
    render: (v: string) => <Typography sx={theme.batchList.batchIdText}>{v || "—"}</Typography>,
  },
  {
    key: "projectId",
    label: BL.COL_PROJECT,
    render: (_v: string, row: any) => {
      const projectName = String(row?.projectName ?? "").trim();
      const projectId = String(row?.projectId ?? "").trim();
      if (!projectName && !projectId) {
        return <Typography sx={theme.batchList.normalText}>—</Typography>;
      }
      return (
        <Box sx={theme.batchList.projectCell}>
          <icons.batchMgmt.projectId sx={theme.batchList.projectIcon} />
          <Box sx={theme.batchList.projectInfo}>
            <Typography sx={theme.batchList.projectName}>{projectName || "—"}</Typography>
            <Typography sx={theme.batchList.projectId}>{projectId || "—"}</Typography>
          </Box>
        </Box>
      );
    },
  },
  {
    key: "motorId",
    label: BL.COL_MOTOR_ID,
    render: (v: string) => <Typography sx={theme.batchList.normalText}>{v || "—"}</Typography>,
  },
  {
    key: "motorStage",
    label: BL.COL_MOTOR_STAGE,
    align: "center" as const,
    render: (v: string) => (
      <Chip label={formatMotorStageLabel(v)} size="small" sx={theme.batchList.batchTypeChip} />
    ),
  },
  {
    key: "casingType",
    label: BL.COL_CASING_TYPE,
    align: "center" as const,
    render: (v: string) => <Chip label={v || "—"} size="small" sx={theme.batchList.batchTypeChip} />,
  },
  {
    key: "insulationType",
    label: BL.COL_INSULATION_TYPE,
    align: "center" as const,
    render: (v: string) => <Chip label={v || "—"} size="small" sx={theme.batchList.batchTypeChip} />,
  },
  {
    key: "createdBy.fullName",
    label: BL.COL_CREATED_BY,
    render: (v: string) => (
      <IconText
        icon={<PersonRoundedIcon sx={theme.batchList.icon} />}
        text={v ?? BL.UNASSIGNED}
        textSx={theme.batchList.subtleText}
      />
    ),
  },
  {
    key: "createdOn",
    label: BL.COL_CREATED_ON,
    render: (v: string) => (
      <IconText
        icon={<CalendarMonthRoundedIcon sx={theme.batchList.icon} />}
        text={formatDisplayDateTime(v)}
        textSx={theme.batchList.subtleText}
      />
    ),
  },
  {
    key: "rmStatus",
    label: BL.COL_STAGE_STATUS,
    align: "center" as const,
    render: (v: string, row: any) => (
      <UserWorkflowStatusCell
        status={v}
        statusConfig={statusConfig}
        rejectedStatus={OPERATION_STATUS.REJECTED}
        rejectionReason={row.rejectionReason}
        theme={theme}
      />
    ),
  },
];

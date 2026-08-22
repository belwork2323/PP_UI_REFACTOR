import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import type { DispatchDetailView } from "../../../../data/models/user/DispatchApiModel";
import {
  isDispatchMotorApproverActionable,
  isDispatchMotorApproverTabDisabled,
} from "../../../../data/models/user/DispatchFormModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import DispatchMotorDetailsCard from "../../user/dispatch/DispatchMotorDetailsCard";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const D = STRINGS.DISPATCH;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.dispatch.page;

type DispatchApproverReviewContentProps = {
  detailView: DispatchDetailView | null;
  loading: boolean;
  activeMotorId: string | null;
  onActiveMotorChange: (motorId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading?: boolean;
  dispatchTheme: ReturnType<typeof getDispatchTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const DispatchApproverReviewContent = ({
  detailView,
  loading,
  activeMotorId,
  onActiveMotorChange,
  onApprove,
  onReject,
  actionLoading = false,
  dispatchTheme,
  approverTheme,
}: DispatchApproverReviewContentProps) => {
  const dt = dispatchTheme.details;
  const palette = {
    primary: dispatchTheme.brand.primary,
    primaryLight: dispatchTheme.brand.primaryLight,
    border: dispatchTheme.brand.border,
    surface: dispatchTheme.brand.surface,
    text: dispatchTheme.brand.text,
    textSub: dispatchTheme.brand.textSub,
    danger: dispatchTheme.brand.danger,
    pageBg: "#fff",
  };
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const motors = detailView?.motors ?? [];

  const derivedMotorCounts = useMemo(() => {
    const counts = {
      pendingMotorCount: 0,
      approvedMotorCount: 0,
      rejectedMotorCount: 0,
      inProgressMotorCount: 0,
      toBeInitiatedMotorCount: 0,
      totalMotorCount: 0,
    };

    motors.forEach((motor) => {
      const status = String(motor.motorSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
      if (status === "WAITING_FOR_APPROVAL") counts.pendingMotorCount += 1;
      else if (status === "APPROVED") counts.approvedMotorCount += 1;
      else if (status === "REJECTED") counts.rejectedMotorCount += 1;
      else if (status === "IN_PROGRESS") counts.inProgressMotorCount += 1;
      else counts.toBeInitiatedMotorCount += 1;
    });

    const apiTotal = Number(detailView?.motorCounts?.totalMotorCount ?? 0);
    counts.totalMotorCount = Math.max(apiTotal, motors.length, 0);
    if (counts.totalMotorCount > motors.length) {
      counts.toBeInitiatedMotorCount += counts.totalMotorCount - motors.length;
    }

    return counts;
  }, [detailView?.motorCounts?.totalMotorCount, motors]);

  const enabledMotors = useMemo(
    () => motors.filter((motor) => !isDispatchMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isDispatchMotorApproverActionable(activeMotor?.motorSubmissionStatus);

  const navPalette = {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    border: palette.border,
    surface: palette.surface,
    textSub: palette.textSub,
    text: palette.text,
  };

  const motorNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motors.map((motor) => ({
        id: motor.motorId,
        label: motor.motorId,
        endAdornment: (
          <PremixStatusChip
            status={motor.motorSubmissionStatus as PremixSubmissionStatus}
            statusConfig={statusConfig}
            showIcon={false}
            variant="embedded"
            onAccent={motor.motorId === activeMotorId}
          />
        ),
      })),
    [activeMotorId, motors, statusConfig],
  );

  const goToEnabledMotor = (direction: -1 | 1) => {
    if (enabledMotors.length === 0) return;
    const currentIndex = Math.max(
      0,
      enabledMotors.findIndex((motor) => motor.motorId === activeMotorId),
    );
    const nextIndex = Math.min(
      enabledMotors.length - 1,
      Math.max(0, currentIndex + direction),
    );
    onActiveMotorChange(enabledMotors[nextIndex].motorId);
  };

  if (loading) {
    return (
      <Box sx={approverTheme.dialog.loadingContainer}>
        <CircularProgress size={36} sx={approverTheme.dialog.loadingSpinner} />
        <Typography sx={approverTheme.dialog.loadingText}>Loading submission details…</Typography>
      </Box>
    );
  }

  if (!detailView || motors.length === 0) {
    return <Typography sx={approverTheme.dialog.emptyText}>No form data recorded</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          px: 1.25,
          py: 1,
          background: palette.surface,
        }}
      >
        <PremixCountsSummary
          pending={derivedMotorCounts.pendingMotorCount}
          approved={derivedMotorCounts.approvedMotorCount}
          rejected={derivedMotorCounts.rejectedMotorCount}
          inProgress={derivedMotorCounts.inProgressMotorCount}
          toBeInitiated={derivedMotorCounts.toBeInitiatedMotorCount}
          total={derivedMotorCounts.totalMotorCount}
          statusConfig={statusConfig}
        />
      </Box>

      <UserWorkflowNavPanel palette={navPalette}>
        <UserWorkflowTabNav
          title={D.MOTOR_NAV_TITLE}
          hint={D.MOTOR_APPROVER_NAV_HINT}
          tabs={motorNavTabs}
          activeIndex={activeMotorIndex >= 0 ? activeMotorIndex : 0}
          onActiveIndexChange={(index) => onActiveMotorChange(motors[index].motorId)}
          palette={navPalette}
          showStepArrows
          onStepBack={() => goToEnabledMotor(-1)}
          onStepNext={() => goToEnabledMotor(1)}
          disableStepBack={enabledMotorIndex <= 0}
          disableStepNext={
            enabledMotorIndex < 0 || enabledMotorIndex >= enabledMotors.length - 1
          }
          isTabDisabled={(_, index) =>
            isDispatchMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isDispatchMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
              ? D.MOTOR_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMotor && !isDispatchMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${palette.border}`,
            background: palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mb={1}
          >
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: palette.primary }}>
              {D.MOTOR_CARD_TITLE} · {activeMotor.motorId}
            </Typography>
            <PremixStatusChip
              status={activeMotor.motorSubmissionStatus as PremixSubmissionStatus}
              statusConfig={statusConfig}
            />
          </Stack>

          {activeMotor.motorSubmissionStatus === "REJECTED" && activeMotor.rejectionReason ? (
            <Typography sx={{ fontSize: "0.72rem", color: palette.danger, mb: 1.25 }}>
              Rejection reason: {activeMotor.rejectionReason}
            </Typography>
          ) : null}

          {canApproveOrReject ? (
            <Stack direction={{ xs: "column", sm: "row" }} gap={1} mb={1.25} justifyContent="flex-end">
              <Button
                variant="contained"
                size="small"
                startIcon={<RejectIcon />}
                disabled={actionLoading}
                onClick={onReject}
                sx={approverTheme.dialog.rejectAction}
              >
                {D.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {D.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <DispatchMotorDetailsCard
            motor={{
              motorId: activeMotor.motorId,
              setup: activeMotor.setup,
              formLoaded: true,
              dispatchData: activeMotor.dispatchData,
            }}
            batchId={detailView.batchId}
            theme={{ palette: palette }}
            readOnly
            onMotorDataChange={() => undefined}
          />
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{D.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default DispatchApproverReviewContent;

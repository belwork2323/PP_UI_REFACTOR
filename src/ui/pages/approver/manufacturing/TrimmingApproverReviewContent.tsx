import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  isTrimmingMotorApproverActionable,
  isTrimmingMotorApproverTabDisabled,
  type TrimmingDetailView,
} from "../../../../data/models/user/TrimmingFormModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import { MotorDetailPanel } from "../../user/manufacturing/Trimming/components/TrimmingDetailsContent";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const TR = STRINGS.MANUFACTURING.TRIMMING;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.manufacturing.trimming;

type TrimmingApproverReviewContentProps = {
  detailView: TrimmingDetailView | null;
  loading: boolean;
  activeMotorId: string | null;
  onActiveMotorChange: (motorId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading?: boolean;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const TrimmingApproverReviewContent = ({
  detailView,
  loading,
  activeMotorId,
  onActiveMotorChange,
  onApprove,
  onReject,
  actionLoading = false,
  manufacturingTheme,
  approverTheme,
}: TrimmingApproverReviewContentProps) => {
  const dt = manufacturingTheme.manufacturing.trimming.details;
  const palette = manufacturingTheme.palette;
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
    () => motors.filter((motor) => !isTrimmingMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isTrimmingMotorApproverActionable(activeMotor?.motorSubmissionStatus);

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
          title={TR.MOTOR_NAV_TITLE}
          hint={TR.MOTOR_APPROVER_NAV_HINT}
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
            isTrimmingMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isTrimmingMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
              ? TR.MOTOR_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMotor && !isTrimmingMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
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
              {TR.MOTOR_CARD_TITLE} · {activeMotor.motorId}
            </Typography>
            <PremixStatusChip
              status={activeMotor.motorSubmissionStatus as PremixSubmissionStatus}
              statusConfig={statusConfig}
            />
          </Stack>

          {activeMotor.motorSubmissionStatus === "REJECTED" && activeMotor.rejectionReason ? (
            <Typography sx={{ fontSize: "0.72rem", color: palette.danger ?? "#C0392B", mb: 1.25 }}>
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
                {TR.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {TR.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <MotorDetailPanel motor={activeMotor} dt={dt} palette={palette} />
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{TR.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default TrimmingApproverReviewContent;

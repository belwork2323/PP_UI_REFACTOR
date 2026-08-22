import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { getStfTheme } from "../../../../app/theme/custom_themes/user/qualityControl/stf_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  isStfMotorApproverActionable,
  isStfMotorApproverTabDisabled,
  type StfDetailView,
} from "../../../../data/models/user/StaticTestFacilityApiModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import StfMotorPanel from "../../user/qualityControl/StaticTestFacility/StfMotorPanel";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const STF = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.qualityControl.staticTestFacility;

type STFApproverReviewContentProps = {
  detailView: StfDetailView | null;
  loading: boolean;
  activeMotorId: string | null;
  onActiveMotorChange: (motorId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading?: boolean;
  qcTheme: ReturnType<typeof getQualityControlTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const STFApproverReviewContent = ({
  detailView,
  loading,
  activeMotorId,
  onActiveMotorChange,
  onApprove,
  onReject,
  actionLoading = false,
  qcTheme,
  approverTheme,
}: STFApproverReviewContentProps) => {
  const dt = getStfTheme(qcTheme).details;
  const palette = qcTheme.palette;
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
    () => motors.filter((motor) => !isStfMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isStfMotorApproverActionable(activeMotor?.motorSubmissionStatus);

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
          title={STF.MOTOR_NAV_TITLE}
          hint={STF.MOTOR_APPROVER_NAV_HINT}
          tabs={motorNavTabs}
          activeIndex={activeMotorIndex >= 0 ? activeMotorIndex : 0}
          onActiveIndexChange={(index) => onActiveMotorChange(motors[index].motorId)}
          palette={navPalette}
          showStepArrows
          wrapTabs
          onStepBack={() => goToEnabledMotor(-1)}
          onStepNext={() => goToEnabledMotor(1)}
          disableStepBack={enabledMotorIndex <= 0}
          disableStepNext={
            enabledMotorIndex < 0 || enabledMotorIndex >= enabledMotors.length - 1
          }
          isTabDisabled={(_, index) =>
            isStfMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isStfMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
              ? STF.MOTOR_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMotor && !isStfMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
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
              {STF.MOTOR_CARD_TITLE} · {activeMotor.motorId}
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
                {STF.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {STF.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <StfMotorPanel
            value={activeMotor.stfData}
            onChange={() => undefined}
            readOnly
            theme={qcTheme}
            batchId={detailView?.batchId}
            motorId={activeMotor.motorId}
          />
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{STF.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default STFApproverReviewContent;

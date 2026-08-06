import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  canApproverActionEntireCastingCuringForm,
  isCastingCuringMotorApproverActionable,
  isCastingCuringMotorApproverTabDisabled,
  type CastingCuringDetailView,
} from "../../../../data/models/user/CastingCuringFormModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import { MotorDetailPanel } from "../../user/manufacturing/CastingAndCuring/components/CastingCuringDetailsContent";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const CC = STRINGS.MANUFACTURING.CASTING_CURING;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.manufacturing.castingAndCuring;

type MotorProcessTab = "CASTING" | "CURING";

type CastingCuringApproverReviewContentProps = {
  detailView: CastingCuringDetailView | null;
  loading: boolean;
  activeMotorId: string | null;
  onActiveMotorChange: (motorId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onApproveForm?: () => void;
  onRejectForm?: () => void;
  actionLoading?: boolean;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const CastingCuringApproverReviewContent = ({
  detailView,
  loading,
  activeMotorId,
  onActiveMotorChange,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  manufacturingTheme,
  approverTheme,
}: CastingCuringApproverReviewContentProps) => {
  const dt = manufacturingTheme.manufacturing.castingAndCuring.details;
  const palette = manufacturingTheme.palette;
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("CASTING");

  useEffect(() => {
    setActiveProcessTab("CASTING");
  }, [activeMotorId]);

  const motors = detailView?.motors ?? [];

  const derivedMotorCounts = useMemo(() => {
    const counts = {
      pendingMotorCount: detailView?.motorCounts?.pendingMotorCount ?? 0,
      approvedMotorCount: detailView?.motorCounts?.approvedMotorCount ?? 0,
      rejectedMotorCount: detailView?.motorCounts?.rejectedMotorCount ?? 0,
      inProgressMotorCount: detailView?.motorCounts?.inProgressMotorCount ?? 0,
      toBeInitiatedMotorCount: detailView?.motorCounts?.toBeInitiatedMotorCount ?? 0,
      totalMotorCount: detailView?.motorCounts?.totalMotorCount ?? motors.length,
    };

    if (
      counts.pendingMotorCount +
        counts.approvedMotorCount +
        counts.rejectedMotorCount +
        counts.inProgressMotorCount +
        counts.toBeInitiatedMotorCount ===
      0
    ) {
      motors.forEach((motor) => {
        const status = String(motor.motorSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
        if (status === "WAITING_FOR_APPROVAL") counts.pendingMotorCount += 1;
        else if (status === "APPROVED") counts.approvedMotorCount += 1;
        else if (status === "REJECTED") counts.rejectedMotorCount += 1;
        else if (status === "IN_PROGRESS") counts.inProgressMotorCount += 1;
        else counts.toBeInitiatedMotorCount += 1;
      });
      counts.totalMotorCount = Math.max(counts.totalMotorCount, motors.length, 0);
    }

    if (counts.totalMotorCount > motors.length) {
      counts.toBeInitiatedMotorCount += counts.totalMotorCount - motors.length;
    }

    return counts;
  }, [detailView?.motorCounts, motors]);

  const enabledMotors = useMemo(
    () => motors.filter((motor) => !isCastingCuringMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isCastingCuringMotorApproverActionable(activeMotor?.motorSubmissionStatus);
  const canApproveOrRejectForm = canApproverActionEntireCastingCuringForm({
    formSubmissionType: detailView?.formSubmissionType,
    status: detailView?.status,
    motors,
  });

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

      {canApproveOrRejectForm ? (
        <Box
          sx={{
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            px: 1.25,
            py: 1,
            background: palette.surface,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Typography sx={{ fontSize: "0.74rem", color: palette.textSub, fontWeight: 600 }}>
              {CC.FORM_APPROVER_ACTIONS_HINT}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RejectIcon />}
                disabled={actionLoading || !onRejectForm}
                onClick={onRejectForm}
                sx={approverTheme.dialog.rejectAction}
              >
                {CC.FORM_APPROVER_REJECT}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading || !onApproveForm}
                onClick={onApproveForm}
                sx={approverTheme.dialog.approveAction}
              >
                {CC.FORM_APPROVER_APPROVE}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <UserWorkflowNavPanel palette={navPalette}>
        <UserWorkflowTabNav
          title={CC.MOTOR_NAV_TITLE}
          hint={CC.MOTOR_APPROVER_NAV_HINT}
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
            isCastingCuringMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isCastingCuringMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
              ? CC.MOTOR_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMotor && !isCastingCuringMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
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
              {CC.MOTOR_CARD_TITLE} · {activeMotor.motorId}
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
                {CC.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {CC.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeProcessTab}
            onChange={(_, value: MotorProcessTab | null) => value && setActiveProcessTab(value)}
            sx={{ ...dt.processToggle, mb: 1.25 }}
          >
            <ToggleButton value="CASTING">{CC.SECTION_TAB_CASTING}</ToggleButton>
            <ToggleButton value="CURING">{CC.SECTION_TAB_CURING}</ToggleButton>
          </ToggleButtonGroup>

          <MotorDetailPanel
            motor={activeMotor}
            processTab={activeProcessTab}
            dt={dt}
            palette={palette}
          />
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{CC.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default CastingCuringApproverReviewContent;

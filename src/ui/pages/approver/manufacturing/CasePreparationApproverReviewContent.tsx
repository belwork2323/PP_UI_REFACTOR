import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  canApproverActionEntireCasePrepForm,
  isMotorApproverActionable,
  isMotorApproverTabDisabled,
  type CasePreparationDetailView,
} from "../../../../data/models/user/CasePreparationFormModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import { MotorDetailPanel } from "../../user/manufacturing/CasePreparation/components/CasePreparationDetailsContent";

const CP = STRINGS.MANUFACTURING.CASE_PREP;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.manufacturing.casePreparation;

type CasePreparationApproverReviewContentProps = {
  detailView: CasePreparationDetailView | null;
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

const CasePreparationApproverReviewContent = ({
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
}: CasePreparationApproverReviewContentProps) => {
  const dt = manufacturingTheme.manufacturing.casePreparation.details;
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

  const totalMotorCount = derivedMotorCounts.totalMotorCount || motors.length;

  const enabledMotors = useMemo(
    () => motors.filter((motor) => !isMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isMotorApproverActionable(activeMotor?.motorSubmissionStatus);
  const canApproveOrRejectForm = canApproverActionEntireCasePrepForm({
    formSubmissionType: detailView?.formSubmissionType,
    status: detailView?.status,
    motors,
  });

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
              {CP.FORM_APPROVER_ACTIONS_HINT}
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
                {CP.FORM_APPROVER_REJECT}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading || !onApproveForm}
                onClick={onApproveForm}
                sx={approverTheme.dialog.approveAction}
              >
                {CP.FORM_APPROVER_APPROVE}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <Box
        sx={{
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          px: 1.2,
          py: 1,
          background: palette.surface,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            disabled={enabledMotorIndex <= 0}
            onClick={() => goToEnabledMotor(-1)}
          >
            Back
          </Button>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: palette.primary }}>
            Motor {activeMotorIndex >= 0 ? activeMotorIndex + 1 : "—"} of {totalMotorCount || motors.length}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={enabledMotorIndex < 0 || enabledMotorIndex >= enabledMotors.length - 1}
            onClick={() => goToEnabledMotor(1)}
          >
            Next
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          px: 1,
          py: 1,
          background: palette.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: palette.primary, mb: 0.4 }}>
          {CP.MOTOR_NAV_TITLE}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, mb: 0.9 }}>
          {CP.MOTOR_APPROVER_NAV_HINT}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {motors.map((motor) => {
            const disabled = isMotorApproverTabDisabled(motor.motorSubmissionStatus);
            const active = motor.motorId === activeMotorId;
            const button = (
              <Button
                key={`approver-motor-${motor.motorId}`}
                size="small"
                variant={active ? "contained" : "outlined"}
                disabled={disabled}
                onClick={() => onActiveMotorChange(motor.motorId)}
                sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
              >
                <Stack direction="row" alignItems="center" gap={0.75}>
                  {motor.motorId}
                  <PremixStatusChip
                    status={motor.motorSubmissionStatus as PremixSubmissionStatus}
                    statusConfig={statusConfig}
                    showIcon={false}
                    variant="embedded"
                    onAccent={active}
                  />
                </Stack>
              </Button>
            );

            return disabled ? (
              <Tooltip key={`approver-motor-tip-${motor.motorId}`} title={CP.MOTOR_APPROVER_TAB_DISABLED}>
                <span>{button}</span>
              </Tooltip>
            ) : (
              button
            );
          })}
        </Stack>
      </Box>

      {activeMotor && !isMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
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
              {CP.MOTOR_CARD_TITLE} · {activeMotor.motorId}
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
                {CP.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {CP.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <MotorDetailPanel motor={activeMotor} dt={dt} palette={palette} />
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{CP.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default CasePreparationApproverReviewContent;

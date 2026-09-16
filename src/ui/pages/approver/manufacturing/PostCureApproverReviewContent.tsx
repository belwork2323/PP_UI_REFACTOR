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
import { alpha } from "@mui/material/styles";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getPostCureTheme, {
  POST_CURE_BRAND,
} from "../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import { OPERATION_STATUS_UI_TO_API } from "../../../../hooks/operationStatus";
import { POST_CURE_INHIBITOR_TYPE_OPTIONS } from "../../../../hooks/user/manufacturing/postCureConfig";
import {
  canApproverActionEntirePostCureForm,
  isPostCureMotorApproverActionable,
  isPostCureMotorApproverTabDisabled,
  type PostCureDetailView,
} from "../../../../data/models/user/PostCureFormModel";
import { isPostCureInhibitionDetailsRequired } from "../../../../data/models/user/PostCureMotorDataModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import PostCureMotorPanel from "../../user/manufacturing/PostCure/PostCureMotorPanel";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const PC = STRINGS.MANUFACTURING.POST_CURE;
const BL = STRINGS.SOURCING.BATCH_LIST;
const { approved: ApproveIcon, rejected: RejectIcon } = icons.approver.manufacturing.postCure;

const API_OPERATION_STATUS_LABELS = Object.fromEntries(
  Object.entries(OPERATION_STATUS_UI_TO_API).map(([label, apiValue]) => [apiValue, label]),
);

type MotorProcessTab = "LOOSE_FLAP" | "INHIBITION";

type PostCureApproverReviewContentProps = {
  detailView: PostCureDetailView | null;
  loading: boolean;
  activeMotorId: string | null;
  onActiveMotorChange: (motorId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onFormApprove?: () => void;
  onFormReject?: () => void;
  actionLoading?: boolean;
  /** Fallback when details payload omits batch status (e.g. list row pcStatus). */
  formStatus?: string | null;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const formatStatusLabel = (status?: string | null) => {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");
  return API_OPERATION_STATUS_LABELS[normalized] ?? raw;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveInhibitorLabel = (inhibitorType?: string | null) => {
  const raw = String(inhibitorType ?? "").trim();
  if (!raw) return "—";
  return (
    POST_CURE_INHIBITOR_TYPE_OPTIONS.find((option) => option.value === raw)?.label ?? raw
  );
};

const PostCureApproverReviewContent = ({
  detailView,
  loading,
  activeMotorId,
  onActiveMotorChange,
  onApprove,
  onReject,
  onFormApprove,
  onFormReject,
  actionLoading = false,
  formStatus,
  manufacturingTheme,
  approverTheme,
}: PostCureApproverReviewContentProps) => {
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("LOOSE_FLAP");
  const dt = getPostCureTheme(manufacturingTheme).details;
  const palette = manufacturingTheme.palette;
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const motors = detailView?.motors ?? [];

  useEffect(() => {
    setActiveProcessTab("LOOSE_FLAP");
  }, [activeMotorId]);

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
    () =>
      motors.filter((motor) => !isPostCureMotorApproverTabDisabled(motor.motorSubmissionStatus)),
    [motors],
  );

  const activeMotor = useMemo(
    () => motors.find((motor) => motor.motorId === activeMotorId) ?? null,
    [motors, activeMotorId],
  );

  const activeMotorIndex = motors.findIndex((motor) => motor.motorId === activeMotorId);
  const enabledMotorIndex = enabledMotors.findIndex((motor) => motor.motorId === activeMotorId);
  const canApproveOrReject = isPostCureMotorApproverActionable(activeMotor?.motorSubmissionStatus);

  const canActionEntireForm = canApproverActionEntirePostCureForm({
    formSubmissionType: detailView?.formSubmissionType,
    status: detailView?.status ?? formStatus,
    motors: detailView?.motors,
  });

  const navPalette = {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    border: palette.border,
    surface: palette.surface,
    textSub: palette.textSub,
    text: palette.text,
  };

  const sectionToggleSx = {
    width: "100%",
    mb: 1.25,
    display: "flex",
    "& .MuiToggleButtonGroup-grouped": { flex: 1 },
    "& .MuiToggleButton-root": {
      flex: 1,
      px: 2.5,
      py: 0.9,
      fontWeight: 700,
      fontSize: "0.82rem",
      textTransform: "none" as const,
      borderColor: alpha(POST_CURE_BRAND.pc, 0.35),
      "&.Mui-selected": {
        background: alpha(POST_CURE_BRAND.pc, 0.12),
        color: POST_CURE_BRAND.pc,
      },
    },
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
    const nextIndex = Math.min(enabledMotors.length - 1, Math.max(0, currentIndex + direction));
    onActiveMotorChange(enabledMotors[nextIndex].motorId);
  };

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || "—" },
    { label: "Form ID", value: detailView?.formId || "—" },
    { label: "Batch Type", value: detailView?.batchType || "—" },
    {
      label: "Status",
      value: formatStatusLabel(detailView?.status ?? formStatus),
    },
    { label: BL.COL_CREATED_BY, value: detailView?.createdBy || "—" },
    { label: BL.COL_CREATED_ON, value: formatDateTime(detailView?.createdAt) },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    { label: "Submitted On", value: formatDateTime(detailView?.submittedAt) },
    { label: "Last Updated By", value: detailView?.lastUpdatedBy || "—" },
    { label: "Last Updated On", value: formatDateTime(detailView?.lastUpdatedAt) },
  ];

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
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {PC.DETAILS_BATCH_SECTION}
        </Typography>
        <Box sx={dt.metaGrid}>
          {metaFields.map((field) => (
            <Box key={field.label} sx={dt.metaItem}>
              <Typography sx={dt.metaLabel}>{field.label}</Typography>
              <Typography sx={dt.metaValue}>{String(field.value ?? "—")}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

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
          title={PC.MOTOR_NAV_TITLE}
          hint={PC.MOTOR_APPROVER_NAV_HINT}
          tabs={motorNavTabs}
          activeIndex={activeMotorIndex >= 0 ? activeMotorIndex : 0}
          onActiveIndexChange={(index) => {
            const motor = motors[index];
            if (!motor || isPostCureMotorApproverTabDisabled(motor.motorSubmissionStatus)) {
              return;
            }
            onActiveMotorChange(motor.motorId);
          }}
          palette={navPalette}
          showStepArrows
          onStepBack={() => goToEnabledMotor(-1)}
          onStepNext={() => goToEnabledMotor(1)}
          disableStepBack={enabledMotorIndex <= 0}
          disableStepNext={enabledMotorIndex < 0 || enabledMotorIndex >= enabledMotors.length - 1}
          isTabDisabled={(_, index) =>
            isPostCureMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isPostCureMotorApproverTabDisabled(motors[index]?.motorSubmissionStatus)
              ? PC.MOTOR_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMotor && !isPostCureMotorApproverTabDisabled(activeMotor.motorSubmissionStatus) ? (
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
              {PC.MOTOR_CARD_TITLE} · {activeMotor.motorId}
            </Typography>
            <PremixStatusChip
              status={activeMotor.motorSubmissionStatus as PremixSubmissionStatus}
              statusConfig={statusConfig}
            />
          </Stack>

          <Typography sx={{ fontSize: "0.74rem", color: palette.textSub, mb: 1.25 }}>
            {PC.MOTOR_RECEIVED_AT_LABEL}: {activeMotor.motorReceiptDate || "—"}
          </Typography>

          {activeMotor.motorSubmissionStatus === "REJECTED" && activeMotor.rejectionReason ? (
            <Typography sx={{ fontSize: "0.72rem", color: palette.danger ?? "#C0392B", mb: 1.25 }}>
              Rejection reason: {activeMotor.rejectionReason}
            </Typography>
          ) : null}

          {canApproveOrReject ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              mb={1.25}
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                size="small"
                startIcon={<RejectIcon />}
                disabled={actionLoading}
                onClick={onReject}
                sx={approverTheme.dialog.rejectAction}
              >
                {PC.MOTOR_APPROVER_REJECT} {activeMotor.motorId}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {PC.MOTOR_APPROVER_APPROVE} {activeMotor.motorId}
              </Button>
            </Stack>
          ) : null}

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeProcessTab}
            onChange={(_, value: MotorProcessTab | null) => value && setActiveProcessTab(value)}
            sx={sectionToggleSx}
          >
            <ToggleButton value="LOOSE_FLAP">{PC.OPERATION_LOOSE_FLAP_FILLING}</ToggleButton>
            <ToggleButton value="INHIBITION">{PC.OPERATION_INHIBITION}</ToggleButton>
          </ToggleButtonGroup>

          {activeProcessTab === "LOOSE_FLAP" ? (
            <PostCureMotorPanel
              value={activeMotor.looseFlapData}
              onChange={() => undefined}
              readOnly
              theme={manufacturingTheme}
              batchId={detailView?.batchId}
              motorId={activeMotor.motorId}
            />
          ) : null}

          {activeProcessTab === "INHIBITION" ? (
            <Stack spacing={1.25}>
              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${palette.border}`,
                  background: palette.pageBg ?? "#fff",
                  px: 1.25,
                  py: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: palette.primary,
                    mb: 0.75,
                  }}
                >
                  {PC.INHIBITION_SECTION_TITLE}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography sx={{ fontSize: "0.72rem", color: palette.textSub }}>
                    {PC.INHIBITOR_TYPE_LABEL}:
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: palette.text }}>
                    {resolveInhibitorLabel(activeMotor.inhibitorType)}
                  </Typography>
                </Stack>
              </Box>

              {activeMotor.inhibitionData ? (
                <PostCureMotorPanel
                  value={activeMotor.inhibitionData}
                  onChange={() => undefined}
                  readOnly
                  theme={manufacturingTheme}
                  batchId={detailView?.batchId}
                  motorId={activeMotor.motorId}
                />
              ) : (
                <Typography sx={{ ...dt.emptyText, py: 2 }}>
                  {isPostCureInhibitionDetailsRequired(activeMotor.inhibitorType)
                    ? PC.DETAILS_NO_MOTOR_DATA
                    : PC.INHIBITOR_TYPE_NOT_APPLICABLE}
                </Typography>
              )}
            </Stack>
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{PC.MOTOR_APPROVER_NO_ACTIONABLE}</Typography>
      )}

      {canActionEntireForm && onFormApprove && onFormReject ? (
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${palette.border}`,
            background: alpha(POST_CURE_BRAND.pc, 0.04),
            px: 1.5,
            py: 1.25,
          }}
        >
          <Typography sx={{ fontSize: "0.76rem", color: palette.textSub, mb: 1 }}>
            {PC.FORM_APPROVER_ACTIONS_HINT}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="flex-end">
            <Button
              variant="contained"
              size="small"
              startIcon={<RejectIcon />}
              disabled={actionLoading}
              onClick={onFormReject}
              sx={approverTheme.dialog.rejectAction}
            >
              {PC.FORM_APPROVER_REJECT}
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<ApproveIcon />}
              disabled={actionLoading}
              onClick={onFormApprove}
              sx={approverTheme.dialog.approveAction}
            >
              {PC.FORM_APPROVER_APPROVE}
            </Button>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
};

export default PostCureApproverReviewContent;

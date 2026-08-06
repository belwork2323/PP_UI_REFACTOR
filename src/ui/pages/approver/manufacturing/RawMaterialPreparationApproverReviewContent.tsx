import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import OpacityRoundedIcon from "@mui/icons-material/OpacityRounded";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  canApproverActionEntireRawMaterialPrepForm,
  isPremixApproverActionable,
  isPremixApproverTabDisabled,
  type RawMaterialPrepApproverDetailView,
  type RawMaterialPrepApproverProcessView,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import {
  ProcessDetailBlock,
  WeightmentSheetDetailBlock,
} from "../../user/manufacturing/RawMaterial/components/RawMaterialPreparationDetailsContent";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.manufacturing.rawMaterialPreparation;

type MaterialTab = {
  key: string;
  label: string;
  slot: "solid" | "liquid";
  process: RawMaterialPrepApproverProcessView;
};

const buildMaterialTabs = (
  solidProcesses: RawMaterialPrepApproverProcessView[],
  liquidProcesses: RawMaterialPrepApproverProcessView[],
): MaterialTab[] => [
  ...solidProcesses.map((process, index) => ({
    key: `solid-${process.materialCode}-${index}`,
    label: `Premix-${process.materialCode}${process.gradeCode ? ` (${process.gradeCode})` : ""}`,
    slot: "solid" as const,
    process,
  })),
  ...liquidProcesses.map((process, index) => ({
    key: `liquid-${process.materialCode}-${index}`,
    label: `Premix-${process.materialCode}`,
    slot: "liquid" as const,
    process,
  })),
];

type RawMaterialPreparationApproverReviewContentProps = {
  detailView: RawMaterialPrepApproverDetailView | null;
  weightmentSheet: RawMaterialPrepWeightmentSheet;
  loading: boolean;
  activePremixNo: number | null;
  onActivePremixChange: (premixNo: number) => void;
  onApprove: () => void;
  onReject: () => void;
  onApproveForm?: () => void;
  onRejectForm?: () => void;
  actionLoading?: boolean;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const RawMaterialPreparationApproverReviewContent = ({
  detailView,
  weightmentSheet,
  loading,
  activePremixNo,
  onActivePremixChange,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  manufacturingTheme,
  approverTheme,
}: RawMaterialPreparationApproverReviewContentProps) => {
  const dt = manufacturingTheme.manufacturing.rawMaterialPrep.details;
  const palette = manufacturingTheme.palette;
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;
  const [activeMaterialIndex, setActiveMaterialIndex] = useState(0);

  const premixes = detailView?.premixes ?? [];
  const derivedPremixCounts = useMemo(() => {
    const counts = {
      pendingPremixCount: 0,
      approvedPremixCount: 0,
      rejectedPremixCount: 0,
      inProgressPremixCount: 0,
      toBeInitiatedPremixCount: 0,
      totalPremixCount: 0,
    };

    premixes.forEach((premix) => {
      const status = String(premix.premixSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
      if (status === "WAITING_FOR_APPROVAL") counts.pendingPremixCount += 1;
      else if (status === "APPROVED") counts.approvedPremixCount += 1;
      else if (status === "REJECTED") counts.rejectedPremixCount += 1;
      else if (status === "IN_PROGRESS") counts.inProgressPremixCount += 1;
      else counts.toBeInitiatedPremixCount += 1;
    });

    const apiTotal = Number(detailView?.premixCounts?.totalPremixCount ?? 0);
    counts.totalPremixCount = Math.max(apiTotal, premixes.length, 0);
    if (counts.totalPremixCount > premixes.length) {
      counts.toBeInitiatedPremixCount += counts.totalPremixCount - premixes.length;
    }

    return counts;
  }, [detailView?.premixCounts?.totalPremixCount, premixes]);

  const totalPremixCount = derivedPremixCounts.totalPremixCount || premixes.length;

  const enabledPremixes = useMemo(
    () => premixes.filter((premix) => !isPremixApproverTabDisabled(premix.premixSubmissionStatus)),
    [premixes],
  );

  const activePremix = useMemo(
    () => premixes.find((premix) => premix.premixNo === activePremixNo) ?? null,
    [premixes, activePremixNo],
  );

  const materialTabs = useMemo(
    () =>
      activePremix
        ? buildMaterialTabs(activePremix.solidProcesses, activePremix.liquidProcesses)
        : [],
    [activePremix],
  );

  const activeMaterialIndexSafe =
    materialTabs.length > 0 ? Math.min(activeMaterialIndex, materialTabs.length - 1) : 0;
  const activeMaterial = materialTabs[activeMaterialIndexSafe] ?? null;

  const activePremixIndex = premixes.findIndex((premix) => premix.premixNo === activePremixNo);
  const enabledPremixIndex = enabledPremixes.findIndex((premix) => premix.premixNo === activePremixNo);
  const canApproveOrReject = isPremixApproverActionable(activePremix?.premixSubmissionStatus);
  const canApproveOrRejectForm = canApproverActionEntireRawMaterialPrepForm({
    formSubmissionType: detailView?.formSubmissionType,
    status: detailView?.status,
    premixes,
  });

  const navPalette = {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    border: palette.border,
    surface: palette.surface,
    textSub: palette.textSub,
    text: palette.text,
  };

  const premixNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      premixes.map((premix) => ({
        id: `premix-${premix.premixNo}`,
        label: `Premix ${premix.premixNo}`,
        endAdornment: (
          <PremixStatusChip
            status={premix.premixSubmissionStatus}
            statusConfig={statusConfig}
            showIcon={false}
            variant="embedded"
            onAccent={premix.premixNo === activePremixNo}
          />
        ),
      })),
    [activePremixNo, premixes, statusConfig],
  );

  const materialNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      materialTabs.map((entry) => ({
        id: entry.key,
        label: entry.label,
      })),
    [materialTabs],
  );

  useEffect(() => {
    setActiveMaterialIndex(0);
  }, [activePremixNo]);

  const goToEnabledPremix = (direction: -1 | 1) => {
    if (enabledPremixes.length === 0) return;
    const currentIndex = Math.max(
      0,
      enabledPremixes.findIndex((premix) => premix.premixNo === activePremixNo),
    );
    const nextIndex = Math.min(
      enabledPremixes.length - 1,
      Math.max(0, currentIndex + direction),
    );
    onActivePremixChange(enabledPremixes[nextIndex].premixNo);
  };

  if (loading) {
    return (
      <Box sx={approverTheme.dialog.loadingContainer}>
        <CircularProgress size={36} sx={approverTheme.dialog.loadingSpinner} />
        <Typography sx={approverTheme.dialog.loadingText}>Loading submission details…</Typography>
      </Box>
    );
  }

  if (!detailView || premixes.length === 0) {
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
          pending={derivedPremixCounts.pendingPremixCount}
          approved={derivedPremixCounts.approvedPremixCount}
          rejected={derivedPremixCounts.rejectedPremixCount}
          inProgress={derivedPremixCounts.inProgressPremixCount}
          toBeInitiated={derivedPremixCounts.toBeInitiatedPremixCount}
          total={derivedPremixCounts.totalPremixCount}
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
              {RM.FORM_APPROVER_ACTIONS_HINT}
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
                {RM.FORM_APPROVER_REJECT}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading || !onApproveForm}
                onClick={onApproveForm}
                sx={approverTheme.dialog.approveAction}
              >
                {RM.FORM_APPROVER_APPROVE}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      <UserWorkflowNavPanel palette={navPalette}>
        <UserWorkflowTabNav
          title="Premix Navigation"
          hint={RM.PREMIX_APPROVER_NAV_HINT}
          tabs={premixNavTabs}
          activeIndex={activePremixIndex >= 0 ? activePremixIndex : 0}
          onActiveIndexChange={(index) => {
            onActivePremixChange(premixes[index].premixNo);
            setActiveMaterialIndex(0);
          }}
          palette={navPalette}
          showStepArrows
          onStepBack={() => goToEnabledPremix(-1)}
          onStepNext={() => goToEnabledPremix(1)}
          disableStepBack={enabledPremixIndex <= 0}
          disableStepNext={
            enabledPremixIndex < 0 || enabledPremixIndex >= enabledPremixes.length - 1
          }
          isTabDisabled={(_, index) =>
            isPremixApproverTabDisabled(premixes[index]?.premixSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isPremixApproverTabDisabled(premixes[index]?.premixSubmissionStatus)
              ? RM.PREMIX_APPROVER_TAB_DISABLED
              : undefined
          }
          mb={materialNavTabs.length > 0 ? 1 : 0}
        />
        {materialNavTabs.length > 0 ? (
          <UserWorkflowTabNav
            title="Premix Material Navigation"
            tabs={materialNavTabs}
            activeIndex={activeMaterialIndexSafe}
            onActiveIndexChange={setActiveMaterialIndex}
            palette={navPalette}
            showStepArrows
          />
        ) : null}
      </UserWorkflowNavPanel>

      {activePremix && !isPremixApproverTabDisabled(activePremix.premixSubmissionStatus) ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${palette.border}`,
            background: palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: palette.primary }}>
              Premix {activePremix.premixNo}
              {activeMaterial
                ? ` · ${activeMaterial.process.materialCode}${activeMaterial.process.gradeCode ? ` (${activeMaterial.process.gradeCode})` : ""}`
                : ""}
            </Typography>
            <PremixStatusChip
              status={activePremix.premixSubmissionStatus}
              statusConfig={statusConfig}
            />
          </Stack>

          {activePremix.premixSubmissionStatus === "REJECTED" && activePremix.rejectionReason ? (
            <Typography sx={{ fontSize: "0.72rem", color: palette.danger ?? "#C0392B", mb: 1.25 }}>
              Rejection reason: {activePremix.rejectionReason}
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
                {RM.PREMIX_APPROVER_REJECT} {activePremix.premixNo}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {RM.PREMIX_APPROVER_APPROVE} {activePremix.premixNo}
              </Button>
            </Stack>
          ) : null}

          {activeMaterial ? (
            <ProcessDetailBlock
              process={activeMaterial.process}
              slotLabel={activeMaterial.slot === "solid" ? "Solid" : "Liquid"}
              slotIcon={activeMaterial.slot === "solid" ? GrainRoundedIcon : OpacityRoundedIcon}
              slotColor={
                activeMaterial.slot === "solid"
                  ? palette.primary ?? "#1565C0"
                  : palette.primaryLight ?? "#2E86C1"
              }
              dt={dt}
            />
          ) : (
            <Typography sx={dt.emptyText}>No process data recorded for this premix.</Typography>
          )}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{RM.PREMIX_APPROVER_NO_ACTIONABLE}</Typography>
      )}

      <WeightmentSheetDetailBlock
        weightmentSheet={weightmentSheet}
        dt={dt}
        palette={palette}
      />
    </Stack>
  );
};

export default RawMaterialPreparationApproverReviewContent;

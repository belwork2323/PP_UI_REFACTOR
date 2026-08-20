import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getMixingTheme from "../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  buildMixingApproverCards,
  isMixCardApproverActionable,
  isMixCardApproverTabDisabled,
  type MixingDetailView,
} from "../../../../data/models/user/MixingFormModel";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import {
  FinalMixDetailPanel,
  PremixDetailPanel,
} from "../../user/manufacturing/Mixing/components/MixingDetailsContent";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../components/custom/UserWorkflowStepPager";

const MX = STRINGS.MANUFACTURING.MIXING;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.manufacturing.mixing;

type MixingApproverReviewContentProps = {
  detailView: MixingDetailView | null;
  loading: boolean;
  activeMixCardId: string | null;
  onActiveMixCardChange: (mixCardId: string) => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading?: boolean;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const MixingApproverReviewContent = ({
  detailView,
  loading,
  activeMixCardId,
  onActiveMixCardChange,
  onApprove,
  onReject,
  actionLoading = false,
  manufacturingTheme,
  approverTheme,
}: MixingApproverReviewContentProps) => {
  const dt = useMemo(() => getMixingTheme(manufacturingTheme).details, [manufacturingTheme]);
  const palette = manufacturingTheme.palette;
  const statusConfig = dt.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const mixCards = useMemo(() => buildMixingApproverCards(detailView), [detailView]);

  const derivedMixCardCounts = useMemo(() => {
    const counts = {
      pendingMixCardCount: 0,
      approvedMixCardCount: 0,
      rejectedMixCardCount: 0,
      inProgressMixCardCount: 0,
      toBeInitiatedMixCardCount: 0,
      totalMixCardCount: 0,
    };

    mixCards.forEach((card) => {
      const status = String(card.mixCardSubmissionStatus ?? "TO_BE_INITIATED").toUpperCase();
      if (status === "WAITING_FOR_APPROVAL") counts.pendingMixCardCount += 1;
      else if (status === "APPROVED") counts.approvedMixCardCount += 1;
      else if (status === "REJECTED") counts.rejectedMixCardCount += 1;
      else if (status === "IN_PROGRESS") counts.inProgressMixCardCount += 1;
      else counts.toBeInitiatedMixCardCount += 1;
    });

    const apiTotal = Number(detailView?.mixCardCounts?.totalMixCardCount ?? 0);
    counts.totalMixCardCount = Math.max(apiTotal, mixCards.length, 0);
    if (counts.totalMixCardCount > mixCards.length) {
      counts.toBeInitiatedMixCardCount += counts.totalMixCardCount - mixCards.length;
    }

    return counts;
  }, [detailView?.mixCardCounts?.totalMixCardCount, mixCards]);

  const totalMixCardCount = derivedMixCardCounts.totalMixCardCount || mixCards.length;

  const enabledMixCards = useMemo(
    () => mixCards.filter((card) => !isMixCardApproverTabDisabled(card.mixCardSubmissionStatus)),
    [mixCards],
  );

  const activeMixCard = useMemo(
    () => mixCards.find((card) => card.mixCardId === activeMixCardId) ?? null,
    [mixCards, activeMixCardId],
  );

  const activeMixCardIndex = mixCards.findIndex((card) => card.mixCardId === activeMixCardId);
  const enabledMixCardIndex = enabledMixCards.findIndex(
    (card) => card.mixCardId === activeMixCardId,
  );
  const canApproveOrReject = isMixCardApproverActionable(activeMixCard?.mixCardSubmissionStatus);

  const navPalette = {
    primary: palette.primary,
    primaryLight: palette.primaryLight,
    border: palette.border,
    surface: palette.surface,
    textSub: palette.textSub,
    text: palette.text,
  };

  const mixCardNavTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      mixCards.map((card) => ({
        id: card.mixCardId,
        label: card.label,
        endAdornment: (
          <PremixStatusChip
            status={card.mixCardSubmissionStatus as PremixSubmissionStatus}
            statusConfig={statusConfig}
            showIcon={false}
            variant="embedded"
            onAccent={card.mixCardId === activeMixCardId}
          />
        ),
      })),
    [activeMixCardId, mixCards, statusConfig],
  );

  const goToEnabledMixCard = (direction: -1 | 1) => {
    if (enabledMixCards.length === 0) return;
    const currentIndex = Math.max(
      0,
      enabledMixCards.findIndex((card) => card.mixCardId === activeMixCardId),
    );
    const nextIndex = Math.min(
      enabledMixCards.length - 1,
      Math.max(0, currentIndex + direction),
    );
    onActiveMixCardChange(enabledMixCards[nextIndex].mixCardId);
  };

  if (loading) {
    return (
      <Box sx={approverTheme.dialog.loadingContainer}>
        <CircularProgress size={36} sx={approverTheme.dialog.loadingSpinner} />
        <Typography sx={approverTheme.dialog.loadingText}>Loading submission details…</Typography>
      </Box>
    );
  }

  if (!detailView || mixCards.length === 0) {
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
          pending={derivedMixCardCounts.pendingMixCardCount}
          approved={derivedMixCardCounts.approvedMixCardCount}
          rejected={derivedMixCardCounts.rejectedMixCardCount}
          inProgress={derivedMixCardCounts.inProgressMixCardCount}
          toBeInitiated={derivedMixCardCounts.toBeInitiatedMixCardCount}
          total={derivedMixCardCounts.totalMixCardCount}
          statusConfig={statusConfig}
        />
      </Box>

      <UserWorkflowNavPanel palette={navPalette}>
        <UserWorkflowTabNav
          title={MX.MIX_CARD_NAV_TITLE}
          hint={MX.MIX_CARD_APPROVER_NAV_HINT}
          tabs={mixCardNavTabs}
          activeIndex={activeMixCardIndex >= 0 ? activeMixCardIndex : 0}
          onActiveIndexChange={(index) => onActiveMixCardChange(mixCards[index].mixCardId)}
          palette={navPalette}
          showStepArrows
          onStepBack={() => goToEnabledMixCard(-1)}
          onStepNext={() => goToEnabledMixCard(1)}
          disableStepBack={enabledMixCardIndex <= 0}
          disableStepNext={
            enabledMixCardIndex < 0 || enabledMixCardIndex >= enabledMixCards.length - 1
          }
          isTabDisabled={(_, index) =>
            isMixCardApproverTabDisabled(mixCards[index]?.mixCardSubmissionStatus)
          }
          tabTooltip={(_, index) =>
            isMixCardApproverTabDisabled(mixCards[index]?.mixCardSubmissionStatus)
              ? MX.MIX_CARD_APPROVER_TAB_DISABLED
              : undefined
          }
        />
      </UserWorkflowNavPanel>

      {activeMixCard && !isMixCardApproverTabDisabled(activeMixCard.mixCardSubmissionStatus) ? (
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
              {activeMixCard.label}
            </Typography>
            <PremixStatusChip
              status={activeMixCard.mixCardSubmissionStatus as PremixSubmissionStatus}
              statusConfig={statusConfig}
            />
          </Stack>

          {activeMixCard.mixCardSubmissionStatus === "REJECTED" && activeMixCard.rejectionReason ? (
            <Typography sx={{ fontSize: "0.72rem", color: palette.danger ?? "#C0392B", mb: 1.25 }}>
              Rejection reason: {activeMixCard.rejectionReason}
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
                {MX.MIX_CARD_APPROVER_REJECT} {activeMixCard.label}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading}
                onClick={onApprove}
                sx={approverTheme.dialog.approveAction}
              >
                {MX.MIX_CARD_APPROVER_APPROVE} {activeMixCard.label}
              </Button>
            </Stack>
          ) : null}

          {activeMixCard.stageType === "PREMIX" && activeMixCard.premix ? (
            <PremixDetailPanel premix={activeMixCard.premix} dt={dt} />
          ) : activeMixCard.stageType === "FINAL_MIX" && activeMixCard.finalMix ? (
            <FinalMixDetailPanel entry={activeMixCard.finalMix} dt={dt} />
          ) : null}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>{MX.MIX_CARD_APPROVER_NO_ACTIONABLE}</Typography>
      )}
    </Stack>
  );
};

export default MixingApproverReviewContent;

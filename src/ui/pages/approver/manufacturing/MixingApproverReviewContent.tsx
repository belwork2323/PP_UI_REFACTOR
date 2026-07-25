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
import getMixingTheme from "../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import {
  buildMixingApproverCards,
  canApproverActionEntireMixingForm,
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
  onApproveForm?: () => void;
  onRejectForm?: () => void;
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
  onApproveForm,
  onRejectForm,
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
  const canApproveOrRejectForm = canApproverActionEntireMixingForm({
    formSubmissionType: detailView?.formSubmissionType,
    status: detailView?.status,
    mixCards,
  });

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
              {MX.FORM_APPROVER_ACTIONS_HINT}
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
                {MX.FORM_APPROVER_REJECT}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading || !onApproveForm}
                onClick={onApproveForm}
                sx={approverTheme.dialog.approveAction}
              >
                {MX.FORM_APPROVER_APPROVE}
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
            disabled={enabledMixCardIndex <= 0}
            onClick={() => goToEnabledMixCard(-1)}
          >
            Back
          </Button>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: palette.primary }}>
            Card {activeMixCardIndex >= 0 ? activeMixCardIndex + 1 : "—"} of{" "}
            {totalMixCardCount || mixCards.length}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={
              enabledMixCardIndex < 0 || enabledMixCardIndex >= enabledMixCards.length - 1
            }
            onClick={() => goToEnabledMixCard(1)}
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
          {MX.MIX_CARD_NAV_TITLE}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, mb: 0.9 }}>
          {MX.MIX_CARD_APPROVER_NAV_HINT}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {mixCards.map((card) => {
            const disabled = isMixCardApproverTabDisabled(card.mixCardSubmissionStatus);
            const active = card.mixCardId === activeMixCardId;
            const button = (
              <Button
                key={`approver-mix-card-${card.mixCardId}`}
                size="small"
                variant={active ? "contained" : "outlined"}
                disabled={disabled}
                onClick={() => onActiveMixCardChange(card.mixCardId)}
                sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
              >
                <Stack direction="row" alignItems="center" gap={0.75}>
                  {card.label}
                  <PremixStatusChip
                    status={card.mixCardSubmissionStatus as PremixSubmissionStatus}
                    statusConfig={statusConfig}
                    showIcon={false}
                    variant="embedded"
                    onAccent={active}
                  />
                </Stack>
              </Button>
            );

            return disabled ? (
              <Tooltip
                key={`approver-mix-card-tip-${card.mixCardId}`}
                title={MX.MIX_CARD_APPROVER_TAB_DISABLED}
              >
                <span>{button}</span>
              </Tooltip>
            ) : (
              button
            );
          })}
        </Stack>
      </Box>

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

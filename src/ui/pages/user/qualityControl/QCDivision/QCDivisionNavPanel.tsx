import { useMemo } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  type QcPartialItemStatus,
} from "../../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import type { QcDivisionCatalogNavTab } from "../../../../../hooks/user/qualityControl/qcFlowConfig";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import { STRINGS } from "../../../../../app/config/strings";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import {
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

export type QCDivisionNavApprovalActions = {
  show?: boolean;
  actionLoading?: boolean;
  /** Raw Material Revalidation only — other divisions use per-unit submit. */
  showSubmitDivision?: boolean;
  canSubmitDivision?: boolean;
  canViewStatus?: boolean;
  /** Division-scoped Save as Draft (Raw Material Revalidation — no unit nav). */
  showSaveDraft?: boolean;
  canSaveDraft?: boolean;
  onSaveDraft?: () => void;
  onSubmitDivision?: () => void;
  onViewStatus?: () => void;
};

type QCDivisionNavPanelProps = {
  tabs: QcDivisionCatalogNavTab[];
  activeTabKey: string;
  statusByTabKey?: Record<string, QcPartialItemStatus>;
  loading?: boolean;
  onTabChange: (tabKey: string) => void;
  approvalActions?: QCDivisionNavApprovalActions | null;
  isTabEnabled?: (tabKey: string) => boolean;
  getTabDisabledReason?: (tabKey: string) => string | undefined;
};

const QCDivisionNavPanel = ({
  tabs,
  activeTabKey,
  statusByTabKey = {},
  loading = false,
  onTabChange,
  approvalActions = null,
  isTabEnabled,
  getTabDisabledReason,
}: QCDivisionNavPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const showApprovalActions = Boolean(approvalActions?.show);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.tabKey === activeTabKey),
  );

  const navTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      tabs.map((tab) => {
        const status = statusByTabKey[tab.tabKey] ?? "TO_BE_INITIATED";
        const tone = PARTIAL_ITEM_STATUS_CHIP[status] ?? PARTIAL_ITEM_STATUS_CHIP.TO_BE_INITIATED;
        const active = tab.tabKey === activeTabKey;
        return {
          id: tab.tabKey,
          label: tab.label,
          endAdornment: (
            <Chip
              label={tone.label}
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 700,
                background: active ? "rgba(255,255,255,0.22)" : tone.bg,
                color: active ? "#fff" : tone.color,
                border: active
                  ? "1px solid rgba(255,255,255,0.35)"
                  : `1px solid ${tone.border}`,
                "& .MuiChip-label": { px: 0.6 },
              }}
            />
          ),
        };
      }),
    [activeTabKey, statusByTabKey, tabs],
  );

  const navPalette = {
    primary: BRAND.primary,
    primaryLight: BRAND.primaryLight,
    border: BRAND.border,
    surface: BRAND.surface,
    textSub: BRAND.textSub,
    text: BRAND.text,
  };

  if (loading && !tabs.length) {
    return (
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {S.DIVISION_SECTION_TITLE}
        </Typography>
        <Box
          sx={{
            border: `1px solid ${BRAND.border}`,
            borderRadius: 2,
            px: 2,
            py: 2,
            background: BRAND.surface,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={22} />
        </Box>
      </Stack>
    );
  }

  if (!tabs.length) return null;

  return (
    <Stack spacing={1.25} sx={{ mt: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        gap={1}
      >
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {S.DIVISION_SECTION_TITLE}
        </Typography>
        {showApprovalActions ? (
          <ViewStatusButton
            disabled={!approvalActions?.canViewStatus || approvalActions?.actionLoading}
            onClick={approvalActions?.onViewStatus}
            label={S.VIEW_STATUS}
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          />
        ) : null}
      </Stack>

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1.25,
          py: 1.1,
          background: BRAND.surface,
        }}
      >
        <UserWorkflowTabNav
          title={S.DIVISION_NAV_TITLE}
          hint={S.DIVISION_NAV_HINT}
          tabs={navTabs}
          activeIndex={activeIndex}
          onActiveIndexChange={(index) => {
            const tab = tabs[index];
            if (tab) onTabChange(tab.tabKey);
          }}
          palette={navPalette}
          showStepArrows
          wrapTabs
          isTabDisabled={(_tab, index) => {
            const tab = tabs[index];
            if (!tab) return true;
            if (loading) return true;
            return isTabEnabled ? !isTabEnabled(tab.tabKey) : false;
          }}
          tabTooltip={(_tab, index) => {
            const tab = tabs[index];
            if (!tab || loading) return undefined;
            if (isTabEnabled && !isTabEnabled(tab.tabKey)) {
              return getTabDisabledReason?.(tab.tabKey);
            }
            return undefined;
          }}
        />
      </Box>

      {showApprovalActions &&
      (approvalActions?.showSaveDraft || approvalActions?.showSubmitDivision) ? (
        <Stack direction="row" justifyContent="flex-end" gap={1} flexWrap="wrap">
          {approvalActions?.showSaveDraft ? (
            <Button
              size="small"
              variant="outlined"
              disabled={!approvalActions?.canSaveDraft || approvalActions?.actionLoading}
              onClick={approvalActions?.onSaveDraft}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {S.SAVE_UNIT_DRAFT}
            </Button>
          ) : null}
          {approvalActions?.showSubmitDivision ? (
            <Button
              size="small"
              variant="outlined"
              disabled={!approvalActions?.canSubmitDivision || approvalActions?.actionLoading}
              onClick={approvalActions?.onSubmitDivision}
              sx={{ textTransform: "none", whiteSpace: "nowrap" }}
            >
              {S.SUBMIT_DIVISION}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
};

export default QCDivisionNavPanel;

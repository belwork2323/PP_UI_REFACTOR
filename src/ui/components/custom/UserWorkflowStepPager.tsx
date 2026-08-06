import type { ReactNode } from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography, alpha } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

export type UserWorkflowNavPalette = {
  primary: string;
  primaryLight?: string;
  border: string;
  surface: string;
  textSub?: string;
  text?: string;
};

export type UserWorkflowNavTab = {
  id: string;
  label: string;
  /** Optional chip / badge rendered after the label (e.g. status). */
  endAdornment?: ReactNode;
};

type UserWorkflowTabNavProps = {
  title: string;
  hint?: string;
  tabs: UserWorkflowNavTab[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  palette: UserWorkflowNavPalette;
  /** Extra bottom margin when stacking multiple tab strips. */
  mb?: number | string;
  /** Optional content next to the title (e.g. motor count chip). */
  titleEndAdornment?: ReactNode;
  /** Show previous / next arrow buttons flanking the tab strip. */
  showStepArrows?: boolean;
  /** Custom step handlers (e.g. skip disabled approver tabs). */
  onStepBack?: () => void;
  onStepNext?: () => void;
  disableStepBack?: boolean;
  disableStepNext?: boolean;
  isTabDisabled?: (tab: UserWorkflowNavTab, index: number) => boolean;
  tabTooltip?: (tab: UserWorkflowNavTab, index: number) => string | undefined;
};

/**
 * Shared horizontal entity tab strip — Premix / Motor / Material navigation, etc.
 * Callers pass title, hint, and tab data so labels stay department-specific.
 */
export const UserWorkflowTabNav = ({
  title,
  hint,
  tabs,
  activeIndex,
  onActiveIndexChange,
  palette,
  mb = 0,
  titleEndAdornment,
  showStepArrows = false,
  onStepBack,
  onStepNext,
  disableStepBack,
  disableStepNext,
  isTabDisabled,
  tabTooltip,
}: UserWorkflowTabNavProps) => {
  if (tabs.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), tabs.length - 1);
  const accent = palette.primaryLight ?? palette.primary;
  const canStep = showStepArrows && tabs.length > 1;

  const handleStepBack = () => {
    if (onStepBack) {
      onStepBack();
      return;
    }
    onActiveIndexChange(safeIndex - 1);
  };

  const handleStepNext = () => {
    if (onStepNext) {
      onStepNext();
      return;
    }
    onActiveIndexChange(safeIndex + 1);
  };

  const stepBackDisabled = disableStepBack ?? safeIndex <= 0;
  const stepNextDisabled = disableStepNext ?? safeIndex >= tabs.length - 1;

  return (
    <Box sx={{ mb }}>
      <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 0.4 }}>
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: palette.primary }}>
          {title}
        </Typography>
        {titleEndAdornment ?? null}
      </Stack>
      {hint ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub ?? palette.primary, mb: 0.9 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 0.75 }} />
      )}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ pb: 0.5 }}>
        {canStep ? (
          <IconButton
            size="small"
            aria-label="Previous"
            disabled={stepBackDisabled}
            onClick={handleStepBack}
            sx={{
              color: palette.primary,
              border: `1px solid ${alpha(palette.border, 0.9)}`,
              borderRadius: 1.25,
              width: 28,
              height: 28,
              flexShrink: 0,
            }}
          >
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        ) : null}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", flex: 1, minWidth: 0 }}>
          {tabs.map((tab, index) => {
            const active = index === safeIndex;
            const disabled = isTabDisabled?.(tab, index) ?? false;
            const tooltip = tabTooltip?.(tab, index);
            const button = (
              <Button
                key={tab.id}
                size="small"
                variant={active ? "contained" : "outlined"}
                disabled={disabled}
                onClick={() => onActiveIndexChange(index)}
                sx={{
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  textTransform: "none",
                  fontWeight: 700,
                  ...(active
                    ? {
                        background: `linear-gradient(135deg, ${palette.primary}, ${accent})`,
                        "&:hover": {
                          background: `linear-gradient(135deg, ${palette.primary}, ${accent})`,
                        },
                      }
                    : {
                        borderColor: alpha(palette.border, 0.9),
                        color: palette.text ?? palette.primary,
                      }),
                }}
              >
                <Stack direction="row" alignItems="center" gap={0.75}>
                  {tab.label}
                  {tab.endAdornment ?? null}
                </Stack>
              </Button>
            );

            if (disabled && tooltip) {
              return (
                <Tooltip key={tab.id} title={tooltip}>
                  <span>{button}</span>
                </Tooltip>
              );
            }

            return button;
          })}
        </Stack>
        {canStep ? (
          <IconButton
            size="small"
            aria-label="Next"
            disabled={stepNextDisabled}
            onClick={handleStepNext}
            sx={{
              color: palette.primary,
              border: `1px solid ${alpha(palette.border, 0.9)}`,
              borderRadius: 1.25,
              width: 28,
              height: 28,
              flexShrink: 0,
            }}
          >
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        ) : null}
      </Stack>
    </Box>
  );
};

type UserWorkflowNavPanelProps = {
  palette: UserWorkflowNavPalette;
  children: ReactNode;
};

/** Blue-bordered panel that groups one or more tab nav strips. */
export const UserWorkflowNavPanel = ({ palette, children }: UserWorkflowNavPanelProps) => {
  const accent = palette.primaryLight ?? palette.primary;
  return (
    <Box
      sx={{
        border: `1.5px solid ${alpha(accent, 0.55)}`,
        borderRadius: 2,
        px: 1.25,
        py: 1.1,
        background: palette.surface,
        boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.08)}`,
      }}
    >
      {children}
    </Box>
  );
};

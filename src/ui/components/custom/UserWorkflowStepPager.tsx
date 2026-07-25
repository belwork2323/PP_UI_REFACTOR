import type { ReactNode } from "react";
import { Box, Button, Stack, Typography, alpha } from "@mui/material";

export type UserWorkflowNavPalette = {
  primary: string;
  primaryLight?: string;
  border: string;
  surface: string;
  textSub?: string;
  text?: string;
};

type UserWorkflowStepPagerProps = {
  /** 1-based current step index */
  current: number;
  total: number;
  /**
   * Entity name used in the default counter, e.g. "Premix" → "Premix 1 of 3".
   * Prefer this when the counter pattern is always "{label} {n} of {total}".
   */
  entityLabel?: string;
  /** Full counter override (e.g. "Motor Stage 2 of 5"). Wins over entityLabel. */
  counterLabel?: string;
  backLabel?: string;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  disableBack?: boolean;
  disableNext?: boolean;
  /** When false, hide the pager if total <= 1. Default true. */
  alwaysShow?: boolean;
  palette: UserWorkflowNavPalette;
};

/**
 * Shared Back / "{entity} n of total" / Next pager for workflow forms
 * (premix, motor, stage, etc.).
 */
const UserWorkflowStepPager = ({
  current,
  total,
  entityLabel,
  counterLabel,
  backLabel = "Back",
  nextLabel = "Next",
  onBack,
  onNext,
  disableBack,
  disableNext,
  alwaysShow = true,
  palette,
}: UserWorkflowStepPagerProps) => {
  if (!alwaysShow && total <= 1) return null;

  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 1), safeTotal);
  const resolvedCounter =
    counterLabel?.trim() ||
    (entityLabel?.trim()
      ? `${entityLabel.trim()} ${safeCurrent} of ${safeTotal}`
      : `${safeCurrent} of ${safeTotal}`);

  const accent = palette.primaryLight ?? palette.primary;

  return (
    <Box
      sx={{
        border: `1.5px solid ${alpha(accent, 0.55)}`,
        borderRadius: 2,
        px: 1.25,
        py: 1,
        background: palette.surface,
        boxShadow: `inset 0 0 0 1px ${alpha(accent, 0.08)}`,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Button
          variant="outlined"
          size="small"
          disabled={disableBack ?? safeCurrent <= 1}
          onClick={onBack}
          sx={{ textTransform: "none", minWidth: 72, fontWeight: 700 }}
        >
          {backLabel}
        </Button>
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: palette.primary,
            textAlign: "center",
          }}
        >
          {resolvedCounter}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          disabled={disableNext ?? safeCurrent >= safeTotal}
          onClick={onNext}
          sx={{ textTransform: "none", minWidth: 72, fontWeight: 700 }}
        >
          {nextLabel}
        </Button>
      </Stack>
    </Box>
  );
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
}: UserWorkflowTabNavProps) => {
  if (tabs.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), tabs.length - 1);
  const accent = palette.primaryLight ?? palette.primary;

  return (
    <Box sx={{ mb }}>
      <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: palette.primary, mb: 0.4 }}>
        {title}
      </Typography>
      {hint ? (
        <Typography sx={{ fontSize: "0.72rem", color: palette.textSub ?? palette.primary, mb: 0.9 }}>
          {hint}
        </Typography>
      ) : (
        <Box sx={{ mb: 0.75 }} />
      )}
      <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
        {tabs.map((tab, index) => {
          const active = index === safeIndex;
          return (
            <Button
              key={tab.id}
              size="small"
              variant={active ? "contained" : "outlined"}
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
        })}
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

export default UserWorkflowStepPager;

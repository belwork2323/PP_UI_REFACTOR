// src/ui/pages/systemManager/components/StageStatusPanel.tsx
//
// Renders the stageProcessed payload as a rich per-department card list.
// • Logic-free — all data comes from the hook via props.
// • Styles from t.stagePanel, strings from the strings prop.

import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import ProgressBar from "../../../components/common/ProgressBar";
import { icons } from "../../../../app/theme/icons";

type StageEntry = {
  stage: string;
  batchCount: number;
  percentage: number;
  pending: number;
  color: string;
  iconKey: string;
};

type StageData = {
  totalBatches: number;
  filterType: string;
  stages: StageEntry[];
};

type Props = {
  stageData: StageData;
  t: any;
  strings: any;
};

const STAGE_ICON_MAP: Record<string, React.ElementType> = {
  Inventory2:     icons.systemManager.Inventory2,
  Science:        icons.systemManager.Science,
  Verified:       icons.systemManager.Verified,
  LocalShipping:  icons.systemManager.LocalShipping,
};

function resolveIcon(iconKey: string): React.ElementType {
  return STAGE_ICON_MAP[iconKey] ?? icons.systemManager.Inventory2;
}

export default function StageStatusPanel({ stageData, t, strings }: Props) {
  const sp = t.stagePanel;
  const { totalBatches, filterType, stages } = stageData;
  const periodLabel = (strings.PERIOD as Record<string, string>)?.[filterType] ?? filterType;

  return (
    <Box sx={sp.inner}>
      {/* ── Summary header ── */}
      <Box sx={sp.summaryRow}>
        <Box>
          <Typography sx={sp.summarySubLabel}>{strings.TOTAL_BATCHES}</Typography>
          <Typography sx={sp.summaryTotal}>{totalBatches}</Typography>
        </Box>
        <Box sx={sp.periodBadge}>
          <Typography sx={sp.periodText}>{periodLabel}</Typography>
        </Box>
      </Box>

      {/* ── Horizontal carousel ── */}
      {stages.length === 0 ? (
        <Typography sx={sp.emptyText}>{strings.EMPTY}</Typography>
      ) : (
        <Box sx={sp.carouselWrap}>
          {stages.map(({ stage, batchCount, percentage, pending, color, iconKey }) => {
            const Icon = resolveIcon(iconKey);
            return (
              <Box key={stage} sx={sp.card(color)}>
                {/* Row: avatar + pct badge */}
                <Box sx={sp.cardHeader}>
                  <Avatar sx={sp.avatar(color)}>
                    <Icon sx={sp.avatarIcon(color)} />
                  </Avatar>
                  <Box component="span" sx={sp.pctBadge(color)}>
                    {percentage}%
                  </Box>
                </Box>
                {/* Stage name */}
                <Typography sx={sp.stageName}>{stage}</Typography>
                {/* Counts row */}
                <Box sx={sp.statsRow}>
                  <Box>
                    <Typography sx={sp.batchCount(color)}>{batchCount}</Typography>
                    <Typography sx={sp.countLabel}>{strings.COMPLETED}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={sp.pendingCount}>{pending}</Typography>
                    <Typography sx={sp.countLabel}>{strings.PENDING}</Typography>
                  </Box>
                </Box>
                {/* Progress bar */}
                <ProgressBar
                  value={percentage}
                  color={color}
                  trackColor={sp.progressTrackColor}
                  valueColor={sp.progressValueColor}
                  height={5}
                  showValue={false}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

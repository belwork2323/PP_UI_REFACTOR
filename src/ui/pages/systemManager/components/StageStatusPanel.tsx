// src/ui/pages/systemManager/components/StageStatusPanel.tsx
//
// Renders stageProcessed as a vertical pipeline of horizontal stage rows.
// • Logic-free — all data comes from the hook via props.
// • Styles from t.stagePanel, strings from the strings prop.

import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { icons } from "../../../../app/theme/icons";

type StageEntry = {
  stage: string;
  batchCount: number;
  percentage: number;
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
  Inventory2: icons.systemManager.Inventory2,
  Science: icons.systemManager.Science,
  Verified: icons.systemManager.Verified,
  LocalShipping: icons.systemManager.LocalShipping,
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
      <Box sx={sp.summaryRow}>
        <Box>
          <Typography sx={sp.summarySubLabel}>{strings.TOTAL_BATCHES}</Typography>
          <Typography sx={sp.summaryTotal}>{totalBatches}</Typography>
        </Box>
        <Box sx={sp.periodBadge}>
          <Typography sx={sp.periodText}>{periodLabel}</Typography>
        </Box>
      </Box>

      {stages.length > 0 && strings.DISTRIBUTION_LABEL && (
        <Typography sx={sp.distributionLabel}>{strings.DISTRIBUTION_LABEL}</Typography>
      )}

      {stages.length === 0 ? (
        <Typography sx={sp.emptyText}>{strings.EMPTY}</Typography>
      ) : (
        <Box sx={sp.pipelineWrap}>
          {stages.map(({ stage, batchCount, percentage, color, iconKey }, index) => {
            const Icon = resolveIcon(iconKey);
            const nextStage = stages[index + 1];
            const showConnector = index < stages.length - 1;

            return (
              <Box key={stage} sx={sp.stageBlock}>
                <Box sx={sp.stageRow(color)}>
                  <Box sx={sp.stageRowLeft}>
                    <Avatar sx={sp.avatar(color)}>
                      <Icon sx={sp.avatarIcon(color)} />
                    </Avatar>
                  </Box>

                  <Box sx={sp.stageRowCenter}>
                    <Typography sx={sp.stageName}>{stage}</Typography>
                    <Box sx={sp.progressTrack(color)}>
                      <Box sx={sp.progressFill(color, percentage)} />
                    </Box>
                  </Box>

                  <Box sx={sp.stageRowRight}>
                    <Typography sx={sp.batchPill(color)}>{batchCount}</Typography>
                    <Typography sx={sp.batchLabel}>{strings.BATCHES}</Typography>
                    <Box component="span" sx={sp.pctPill(color)}>
                      {percentage}%
                    </Box>
                  </Box>
                </Box>

                {showConnector && nextStage && (
                  <Box sx={sp.connector(color, nextStage.color)}>
                    <Box sx={sp.connectorLine(color, nextStage.color)} />
                    <Typography sx={sp.connectorArrow(nextStage.color)}>↓</Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

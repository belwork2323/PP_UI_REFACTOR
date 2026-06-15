import { Box, Typography, Chip, Stack, SxProps, Theme } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';

interface FilterPanelHeaderProps {
  title: string;
  count: number;
  onClear: () => void;
  clearLabel: string;
  recordText?: string;
  containerSx: SxProps<Theme>;
  iconSx: SxProps<Theme>;
  labelSx: SxProps<Theme>;
  badgeSx: SxProps<Theme>;
  metaTextSx?: SxProps<Theme>;
  clearChipSx: SxProps<Theme>;
}

const FilterPanelHeader = ({
  title, count, onClear, clearLabel, recordText,
  containerSx, iconSx, labelSx, badgeSx, metaTextSx, clearChipSx,
}: FilterPanelHeaderProps) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={containerSx}>
    <Stack direction="row" alignItems="center" gap={0.8}>
      <TuneIcon sx={iconSx} />
      <Typography sx={labelSx}>{title}</Typography>
      {count > 0 && <Box sx={badgeSx}>{count}</Box>}
      {recordText && metaTextSx && (
        <Typography sx={metaTextSx}>{recordText}</Typography>
      )}
    </Stack>
    {count > 0 && (
      <Chip label={clearLabel} size="small" clickable onClick={onClear} sx={clearChipSx} />
    )}
  </Stack>
);

export default FilterPanelHeader;

import { Box, Typography, SxProps, Theme } from '@mui/material';
import { icons } from '@app/theme/icons';

interface FilterToggleButtonProps {
  label: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
  sx: SxProps<Theme>;
  iconSx: SxProps<Theme>;
  textSx: SxProps<Theme>;
  badgeSx: SxProps<Theme>;
  chevronSx: SxProps<Theme>;
}

const FilterToggleButton = ({
  label, count, isOpen, onClick,
  sx, iconSx, textSx, badgeSx, chevronSx,
}: FilterToggleButtonProps) => {
  const ChevronIcon = isOpen ? icons.filter.chevronUp : icons.filter.chevronDown;

  return (
    <Box onClick={onClick} sx={sx}>
      <icons.filter.tune sx={iconSx} />
      <Typography sx={textSx}>{label}</Typography>
      {count > 0 && <Box sx={badgeSx}>{count}</Box>}
      <ChevronIcon sx={chevronSx} />
    </Box>
  );
};

export default FilterToggleButton;

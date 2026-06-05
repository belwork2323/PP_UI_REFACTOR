import { Box, Typography, SxProps, Theme } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
}: FilterToggleButtonProps) => (
  <Box onClick={onClick} sx={sx}>
    <TuneIcon sx={iconSx} />
    <Typography sx={textSx}>{label}</Typography>
    {count > 0 && <Box sx={badgeSx}>{count}</Box>}
    {isOpen
      ? <KeyboardArrowUpIcon sx={chevronSx} />
      : <KeyboardArrowDownIcon sx={chevronSx} />
    }
  </Box>
);

export default FilterToggleButton;

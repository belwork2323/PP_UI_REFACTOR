import { Box, Typography, SxProps, Theme, Chip } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

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
  selectedValue?: string;
}

const FilterToggleButton = ({
  label,
  count,
  isOpen,
  onClick,
  sx,
  iconSx,
  textSx,
  badgeSx,
  chevronSx,
  selectedValue,
}: FilterToggleButtonProps) => {
  const selectedFilterChip: SxProps<Theme> = {
    height: "auto",
    px: 0.1,
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    bgcolor: "primary.main",
    color: "primary.contrastText",
    "& .MuiChip-label": {
      px: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: 180,
    },
  };
  return (
    <Box onClick={onClick} sx={sx}>
      <TuneIcon sx={iconSx} />
      <Typography sx={textSx}>{label}</Typography>
      {count > 0 && <Box sx={badgeSx}>{count}</Box>}
      {isOpen ? <KeyboardArrowUpIcon sx={chevronSx} /> : <KeyboardArrowDownIcon sx={chevronSx} />}
      {selectedValue && <Chip label={selectedValue} size="small" sx={selectedFilterChip} />}
    </Box>
  );
};

export default FilterToggleButton;

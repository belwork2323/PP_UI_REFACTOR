import { Stack, Typography, TextField, Chip, SxProps, Theme } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface DateRangeRowProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  currentMonthOnly: boolean;
  onToggleMonth?: () => void;
  fromLabel: string;
  toLabel: string;
  separatorLabel: string;
  thisMonthLabel?: string;
  calendarIconSx: SxProps<Theme>;
  datePickerSx: (disabled: boolean) => SxProps<Theme>;
  separatorSx: SxProps<Theme>;
  thisMonthChipSx?: (active: boolean) => SxProps<Theme>;
  dateInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const DateRangeRow = ({
  from, to, onFromChange, onToChange,
  currentMonthOnly, onToggleMonth,
  fromLabel, toLabel, separatorLabel, thisMonthLabel,
  calendarIconSx, datePickerSx, separatorSx, thisMonthChipSx, dateInputProps,
}: DateRangeRowProps) => (
  <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
    <CalendarMonthIcon sx={calendarIconSx} />
    <TextField
      size="small" type="date" label={fromLabel}
      value={from}
      onChange={(e) => onFromChange(e.target.value)}
      disabled={currentMonthOnly}
      InputLabelProps={{ shrink: true }}
      inputProps={dateInputProps}
      sx={datePickerSx(currentMonthOnly)}
    />
    <Typography sx={separatorSx}>{separatorLabel}</Typography>
    <TextField
      size="small" type="date" label={toLabel}
      value={to}
      onChange={(e) => onToChange(e.target.value)}
      disabled={currentMonthOnly}
      InputLabelProps={{ shrink: true }}
      inputProps={dateInputProps}
      sx={datePickerSx(currentMonthOnly)}
    />
    {onToggleMonth && thisMonthLabel && thisMonthChipSx && (
      <Chip
        label={thisMonthLabel} size="small" clickable
        onClick={onToggleMonth}
        sx={thisMonthChipSx(currentMonthOnly)}
      />
    )}
  </Stack>
);

export default DateRangeRow;

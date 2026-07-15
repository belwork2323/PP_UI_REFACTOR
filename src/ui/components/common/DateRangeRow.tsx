import { Stack, Typography, Chip, SxProps, Theme, TextFieldProps } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

interface DateRangeRowProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;

  currentMonthOnly?: boolean;
  onToggleMonth?: () => void;

  fromLabel?: string;
  toLabel?: string;
  separatorLabel?: string;
  thisMonthLabel?: string;

  /** Hide the leading decorative calendar icon (pickers already have one). */
  showLeadingIcon?: boolean;
  calendarIconSx?: SxProps<Theme>;
  datePickerSx?: SxProps<Theme>;
  separatorSx?: SxProps<Theme>;
  thisMonthChipSx?: (active: boolean) => SxProps<Theme>;
  textFieldProps?: Partial<TextFieldProps>;
  /** Compact height / font to match adjacent filter controls. */
  controlHeight?: number;
}

/** DD-MM-YYYY -> YYYY-MM-DD */
const toInputValue = (ddmmyyyy: string) => {
  if (!ddmmyyyy || ddmmyyyy.length !== 10) return "";
  const [dd, mm, yyyy] = ddmmyyyy.split("-");
  return `${yyyy}-${mm}-${dd}`;
};

/** YYYY-MM-DD -> DD-MM-YYYY */
const toApiDate = (yyyymmdd: string) => {
  if (!yyyymmdd) return "";
  const [yyyy, mm, dd] = yyyymmdd.split("-");
  return `${dd}-${mm}-${yyyy}`;
};

const toDayjsValue = (date: string) => {
  const input = toInputValue(date);
  return input ? dayjs(input) : null;
};

const DateRangeRow = ({
  from,
  to,
  onFromChange,
  onToChange,

  currentMonthOnly = false,
  onToggleMonth,

  fromLabel = "From",
  toLabel = "To",
  separatorLabel = "to",
  thisMonthLabel = "This Month",

  showLeadingIcon = true,
  calendarIconSx,
  datePickerSx,
  separatorSx,
  thisMonthChipSx,
  textFieldProps,
  controlHeight = 36,
}: DateRangeRowProps) => {
  const compactFieldSx = {
    width: 152,
    minWidth: 152,
    ...(datePickerSx as object),
    "& .MuiOutlinedInput-root": {
      ...((datePickerSx as any)?.["& .MuiOutlinedInput-root"] || {}),
      height: controlHeight,
      minHeight: controlHeight,
      fontSize: "0.8125rem",
      pr: 0.5,
    },
    "& .MuiOutlinedInput-input": {
      py: 0,
      px: 1.25,
      fontSize: "0.8125rem",
      letterSpacing: "0.01em",
    },
    "& .MuiInputLabel-root": {
      ...((datePickerSx as any)?.["& .MuiInputLabel-root"] || {}),
      fontSize: "0.8125rem",
    },
    "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
      transform: "translate(12px, 8px) scale(1)",
    },
    "& .MuiInputAdornment-root": {
      ml: 0,
    },
    "& .MuiIconButton-root": {
      padding: "4px",
    },
    "& .MuiSvgIcon-root": {
      fontSize: 18,
    },
  };

  const sharedSlotProps = {
    textField: {
      size: "small" as const,
      sx: compactFieldSx as SxProps<Theme>,
      ...textFieldProps,
    },
    openPickerButton: {
      size: "small" as const,
      sx: { p: 0.5 },
    },
    openPickerIcon: {
      sx: { fontSize: 18 },
    },
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
        {showLeadingIcon && (
          <CalendarMonthIcon sx={{ fontSize: 18, opacity: 0.7, ...((calendarIconSx as object) || {}) }} />
        )}

        <DatePicker
          label={fromLabel}
          format="DD/MM/YYYY"
          disabled={currentMonthOnly}
          value={toDayjsValue(from)}
          onChange={(value) => {
            const start = value ? toApiDate(value.format("YYYY-MM-DD")) : "";

            onFromChange(start);

            if (to && value && toDayjsValue(to)?.isBefore(value, "day")) {
              onToChange("");
            }
          }}
          slotProps={sharedSlotProps}
        />

        <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", px: 0.25, ...((separatorSx as object) || {}) }}>
          {separatorLabel}
        </Typography>

        <DatePicker
          label={toLabel}
          format="DD/MM/YYYY"
          disabled={currentMonthOnly}
          value={toDayjsValue(to)}
          minDate={toDayjsValue(from) ?? undefined}
          onChange={(value) => onToChange(value ? toApiDate(value.format("YYYY-MM-DD")) : "")}
          slotProps={sharedSlotProps}
        />

        {onToggleMonth && thisMonthChipSx && (
          <Chip
            clickable
            size="small"
            label={thisMonthLabel}
            onClick={onToggleMonth}
            sx={thisMonthChipSx(currentMonthOnly)}
          />
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default DateRangeRow;

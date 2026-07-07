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

  calendarIconSx?: SxProps<Theme>;
  datePickerSx?: SxProps<Theme>;
  separatorSx?: SxProps<Theme>;
  thisMonthChipSx?: (active: boolean) => SxProps<Theme>;
  textFieldProps?: Partial<TextFieldProps>;
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

  calendarIconSx,
  datePickerSx,
  separatorSx,
  thisMonthChipSx,
  textFieldProps,
}: DateRangeRowProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
        <CalendarMonthIcon sx={calendarIconSx} />

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
          slotProps={{
            textField: {
              size: "small",
              sx: datePickerSx,
              ...textFieldProps,
            },
          }}
        />

        <Typography sx={separatorSx}>{separatorLabel}</Typography>

        <DatePicker
          label={toLabel}
          format="DD/MM/YYYY"
          disabled={currentMonthOnly}
          value={toDayjsValue(to)}
          minDate={toDayjsValue(from) ?? undefined}
          onChange={(value) => onToChange(value ? toApiDate(value.format("YYYY-MM-DD")) : "")}
          slotProps={{
            textField: {
              size: "small",
              sx: datePickerSx,
              ...textFieldProps,
            },
          }}
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

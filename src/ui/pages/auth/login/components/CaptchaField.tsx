import type { CSSProperties } from "react";
import {
  Box,
  TextField,
  CircularProgress,
  Typography,
  InputAdornment,
  type SxProps,
  type Theme,
} from "@mui/material";
import { icons } from "@app/theme";
import getLoginTheme from "@app/theme/custom_themes/auth/login_theme";
import { useThemeStore } from "@app/store/themeStore";
import { STRINGS } from "@app/config/strings";
import type { CaptchaModel } from "@data/models/auth/login/CaptchaModel";

const S = STRINGS.CAPTCHA;

export type CaptchaFieldProps = {
  captcha: CaptchaModel | null;
  loading: boolean;
  fetchErr: string | null;
  value: string;
  error?: string;
  touched?: boolean;
  onReload: () => void;
  onInputChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  sx?: SxProps<Theme>;
  inputSx?: SxProps<Theme>;
};

function resolveCaptchaFieldState(value: string, touched: boolean, error?: string) {
  const showSuccess = touched && value.trim().length > 0 && !error;
  const hasError = Boolean(error);
  const helperText = hasError
    ? error!
    : showSuccess
      ? S.HELPER_ENTERED
      : touched && !value
        ? S.HELPER_EMPTY
        : S.HELPER_PLACEHOLDER;
  const helperColor = hasError
    ? "error.main"
    : showSuccess
      ? "success.main"
      : "text.secondary";
  const focusBorderColor = hasError
    ? "error.main"
    : showSuccess
      ? "success.main"
      : "primary.main";

  return { showSuccess, hasError, helperText, helperColor, focusBorderColor };
}

const CaptchaField = ({
  captcha,
  loading,
  fetchErr,
  value,
  error,
  touched = false,
  onReload,
  onInputChange,
  onBlur,
  label = S.LABEL,
  required = false,
  disabled = false,
  sx = {},
  inputSx = {},
}: CaptchaFieldProps) => {
  const mode = useThemeStore((s) => s.mode);
  const t = getLoginTheme(mode).captcha;
  const captchaIcons = icons.auth.login.captcha;
  const { showSuccess, hasError, helperText, helperColor, focusBorderColor } =
    resolveCaptchaFieldState(value, touched, error);

  return (
    <Box sx={{ ...t.wrapper, ...sx } as SxProps<Theme>}>
      <Box sx={t.row}>
        <Box sx={t.leftCol}>
          <Box sx={{ ...t.imageBox, ...(fetchErr ? t.imageBoxError : {}) }}>
            {loading && <CircularProgress size={18} thickness={4} />}

            {!loading && fetchErr && (
              <Typography variant="caption" color="error" sx={t.imageErrorText}>
                {fetchErr}
              </Typography>
            )}

            {!loading && !fetchErr && captcha && (
              <img
                src={captcha.imageUrl}
                alt={S.ALT_TEXT}
                draggable={false}
                style={t.image as CSSProperties}
              />
            )}
          </Box>

          <Box
            onClick={!loading && !disabled ? onReload : undefined}
            sx={{
              ...t.reloadLink,
              ...(loading || disabled ? t.reloadLink.inactive : t.reloadLink.active),
            }}
          >
            <captchaIcons.reload
              sx={{
                ...t.reloadIcon,
                ...(loading ? t.reloadIcon.spin : {}),
              }}
            />
            <Typography sx={t.reloadText}>
              {loading ? S.LOADING_TEXT : S.RELOAD_BUTTON}
            </Typography>
          </Box>
        </Box>

        <Box sx={t.rightCol}>
          <TextField
            fullWidth
            label={label}
            value={value}
            required={required}
            disabled={disabled || loading || !!fetchErr}
            onChange={(e) => onInputChange(e.target.value)}
            onBlur={onBlur}
            autoComplete="off"
            inputProps={{ maxLength: 6, spellCheck: false }}
            InputLabelProps={{ sx: t.inputLabel }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {showSuccess && <captchaIcons.success sx={t.successIcon} />}
                  {hasError && <captchaIcons.error sx={t.errorIcon} />}
                </InputAdornment>
              ),
            }}
            error={hasError}
            sx={{
              ...t.input,
              "& .MuiOutlinedInput-root": {
                ...t.input["& .MuiOutlinedInput-root"],
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: focusBorderColor,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: hasError ? "error.main" : "primary.main",
                },
              },
              ...inputSx,
            }}
          />

          <Typography
            variant="caption"
            sx={{
              ...t.helperText,
              color: helperColor,
            }}
          >
            {helperText}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CaptchaField;

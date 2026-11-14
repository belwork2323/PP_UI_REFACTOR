import type { CSSProperties, ReactNode } from "react";
import { Box, TextField, CircularProgress, Typography, InputAdornment } from "@mui/material";
import { icons } from "../../../../app/theme";
import getLoginTheme from "../../../../app/theme/custom_themes/auth/login_theme";
import { useThemeStore } from "../../../../app/store/themeStore";
import { STRINGS } from "../../../../app/config/strings";
import { useCaptchaHook } from "../../../../hooks/auth/useCaptchaHook";

const S = STRINGS.CAPTCHA;

const CaptchaField = ({
  onChange,
  onCaptchaId,
  reloadKey = 0,
  label = S.LABEL,
  required = false,
  disabled = false,
  // ── External validation props (from LoginPage) ──
  error = false,
  helperText = "",
  sx = {},
  inputSx = {},
}: {
  onChange?: (val: string, isValid?: boolean) => void;
  onCaptchaId?: (id: string) => void;
  reloadKey?: number;
  label?: ReactNode; // Updated to ReactNode so it accepts JSX from ControlledField
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: object;
  inputSx?: object;
}) => {
  const mode = useThemeStore((s) => s.mode);
  const t = getLoginTheme(mode).captcha;
  const {
    captcha,
    loading,
    fetchErr,
    value,
    internalShowSuccess,
    resolvedError,
    resolvedHelperText,
    resolvedHelperColor,
    focusBorderColor,
    load,
    handleInputChange,
    markTouched,
  } = useCaptchaHook({
    onChange,
    onCaptchaId,
    reloadKey,
    error,
    helperText,
  });

  return (
    <Box sx={{ ...t.wrapper, ...sx }}>
      {/* ── Row: [image col] [input col] ── */}
      <Box sx={t.row}>
        {/* Left col: image + reload */}
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

          {/* Reload link */}
          <Box
            onClick={!loading && !disabled ? load : undefined}
            sx={{
              ...t.reloadLink,
              ...(loading || disabled ? t.reloadLink.inactive : t.reloadLink.active),
            }}
          >
            <icons.captchaReload
              sx={{
                ...t.reloadIcon,
                ...(loading ? t.reloadIcon.spin : {}),
              }}
            />
            <Typography sx={t.reloadText}>{loading ? S.LOADING_TEXT : S.RELOAD_BUTTON}</Typography>
          </Box>
        </Box>

        {/* Right col: input + helper */}
        <Box sx={t.rightCol}>
          <TextField
            fullWidth
            label={label}
            value={value}
            disabled={disabled || loading || !!fetchErr}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={markTouched}
            autoComplete="off"
            inputProps={{
              maxLength: 6,
              spellCheck: false,
              onKeyPress: (e) => {
                if (!/^[a-zA-Z0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              },
            }}
            InputLabelProps={{ sx: t.inputLabel }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {internalShowSuccess && !resolvedError && (
                    <icons.captchaSuccess sx={t.successIcon} />
                  )}
                  {resolvedError && <icons.captchaError sx={t.errorIcon} />}
                </InputAdornment>
              ),
            }}
            error={resolvedError}
            helperText={resolvedError ? resolvedHelperText : ""}
            sx={{
              ...t.input,
              "& .MuiOutlinedInput-root": {
                ...t.input["& .MuiOutlinedInput-root"],
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: focusBorderColor },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: resolvedError ? "error.main" : "primary.main",
                },
              },
              ...inputSx,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CaptchaField;

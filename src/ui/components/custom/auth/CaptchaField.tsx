import type { CSSProperties, ReactNode } from "react";
import { Box, CircularProgress, InputAdornment, TextField, Typography } from "@mui/material";
import { icons } from "@app/theme/icons";
import type { LoginTheme } from "@app/theme/custom_themes/auth/login_theme";
import { STRINGS } from "@app/config/strings";
import { useCaptchaHook } from "@hooks/auth/useCaptchaHook";

const S = STRINGS.CAPTCHA;

type CaptchaFieldProps = {
  theme: LoginTheme["captcha"];
  onChange?: (val: string, isValid?: boolean) => void;
  onCaptchaId?: (id: string) => void;
  reloadKey?: number;
  label?: ReactNode;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  sx?: object;
  inputSx?: object;
};

const CaptchaField = ({
  theme: t,
  onChange,
  onCaptchaId,
  reloadKey = 0,
  label = S.LABEL,
  disabled = false,
  error = false,
  helperText = "",
  sx = {},
  inputSx = {},
}: CaptchaFieldProps) => {
  const {
    captcha,
    loading,
    fetchErr,
    value,
    internalShowSuccess,
    resolvedError,
    resolvedHelperText,
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
              onKeyPress: (e: { key: string; preventDefault: () => void }) => {
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

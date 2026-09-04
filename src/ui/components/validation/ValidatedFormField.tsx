import { alpha, Box, FormHelperText, Typography } from "@mui/material";

export const mandatoryAsteriskSx = (theme: { palette: { danger: string } }) => ({
  color: theme.palette.danger,
  ml: 0.25,
  fontWeight: 700,
});

export const mandatoryFieldInputSx = (baseSx: object, hasError: boolean, theme: any) => ({
  ...baseSx,
  ...(hasError
    ? {
        "& .MuiOutlinedInput-root": {
          background: alpha(theme.palette.danger, 0.04),
          "& fieldset": { borderColor: theme.palette.danger },
          "&:hover fieldset": { borderColor: theme.palette.danger },
          "&.Mui-focused fieldset": { borderColor: theme.palette.danger, borderWidth: 1.5 },
        },
        "& .MuiPickersOutlinedInput-root": {
          background: alpha(theme.palette.danger, 0.04),
          "& .MuiPickersOutlinedInput-notchedOutline": { borderColor: theme.palette.danger },
          "&:hover .MuiPickersOutlinedInput-notchedOutline": { borderColor: theme.palette.danger },
          "&.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
            borderColor: theme.palette.danger,
            borderWidth: 1.5,
          },
        },
      }
    : {}),
});

type ValidatedFormFieldProps = {
  label: string;
  error?: string | null;
  children: React.ReactNode;
  theme: any;
  flex?: number | string;
  required?: boolean;
};

const ValidatedFormField = ({
  label,
  error,
  children,
  theme,
  flex,
  required = true,
}: ValidatedFormFieldProps) => (
  <Box flex={flex ?? 1}>
    <Typography sx={theme.workflow.formElements.fieldLabel}>
      {label}
      {required ? (
        <Box component="span" sx={mandatoryAsteriskSx(theme)}>
          {" "}
          *
        </Box>
      ) : null}
    </Typography>
    {children}
    {error ? (
      <FormHelperText error sx={{ mx: 0, mt: 0.5, fontSize: "0.72rem", fontWeight: 500 }}>
        {error}
      </FormHelperText>
    ) : null}
  </Box>
);

export default ValidatedFormField;

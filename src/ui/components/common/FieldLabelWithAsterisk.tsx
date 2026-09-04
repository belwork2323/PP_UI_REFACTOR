import { Box, FormHelperText, Typography } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export const FieldLabelWithAsterisk = ({
  label,
  required = false,
  sx,
}: {
  label: string;
  required?: boolean;
  sx?: object;
}) => (
  <Typography variant="body2" component="span" sx={{ ...sx, mb: 0.5, fontWeight: 500 }}>
    {label}
    {required && (
      <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
        *
      </Typography>
    )}
  </Typography>
);
export interface ControlledFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: (fieldProps: any, hasError: boolean, errorMessage?: string) => React.ReactNode;
}

export const ControlledField = ({ name, label, required, children }: ControlledFieldProps) => {
  const methods = useFormContext();

  // Safely return null or empty box if context isn't ready yet
  if (!methods?.control) {
    return null;
  }

  const { control } = methods;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Box>
          {label && <FieldLabelWithAsterisk label={label} required={required} />}
          {children(
            { value: field.value ?? "", onChange: field.onChange },
            !!error,
            error?.message,
          )}
        </Box>
      )}
    />
  );
};

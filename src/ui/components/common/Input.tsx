import { useState, type ReactNode } from "react";
import {
  TextField,
  InputAdornment,
  IconButton,
  type TextFieldProps,
} from "@mui/material";
import { icons, colors } from "../../../app/theme";

export type InputProps = TextFieldProps & {
  icon?: ReactNode;
};

const Input = ({
  label,
  value,
  onChange,
  type = "text",
  icon,
  select = false,
  children,
  ...rest
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const EndIcon = showPassword ? icons.visibilityOff : icons.visibility;

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      type={isPassword && showPassword ? "text" : type}
      select={select}
      onChange={onChange}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">{icon}</InputAdornment>
        ) : undefined,
        endAdornment: isPassword ? (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
              sx={{ color: colors.grey[700] }}
            >
              <EndIcon />
            </IconButton>
          </InputAdornment>
        ) : undefined,
      }}
      {...rest}
    >
      {children}
    </TextField>
  );
};

export default Input;
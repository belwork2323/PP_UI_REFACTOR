import { TextField } from "@mui/material";
import { spacing } from "../../../app/theme";

const FormInput = ({ label, value, onChange, ...props }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value}
    onChange={onChange}
    variant="outlined"
    sx={{ mb: spacing.sm }}
    {...props}
  />
);

export default FormInput;

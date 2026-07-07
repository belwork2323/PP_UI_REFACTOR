import { TextField, type SxProps, type TextFieldProps, type Theme } from "@mui/material";
import { schemaFieldInputProps, schemaFieldLabelProps, schemaFieldSx } from "./fieldStyles";

const FormInput = ({ sx, InputLabelProps, inputProps, ...props }: TextFieldProps) => (
  <TextField
    fullWidth
    size="small"
    variant="outlined"
    InputLabelProps={{ ...schemaFieldLabelProps, ...InputLabelProps }}
    inputProps={{ ...schemaFieldInputProps, ...inputProps }}
    sx={[schemaFieldSx, sx] as SxProps<Theme>}
    {...props}
  />
);

export default FormInput;

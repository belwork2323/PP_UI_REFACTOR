import { Typography } from "@mui/material";

type FieldErrorTextProps = {
  message?: string;
};

const FieldErrorText = ({ message }: FieldErrorTextProps) =>
  message ? (
    <Typography sx={{ fontSize: "0.68rem", color: "error.main", mt: 0.35, lineHeight: 1.3 }}>
      {message}
    </Typography>
  ) : null;

export default FieldErrorText;

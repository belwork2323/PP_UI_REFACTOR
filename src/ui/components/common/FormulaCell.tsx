import { Typography } from "@mui/material";

type FormulaCellProps = {
  value: string;
  unit?: string;
  color?: string;
};

const FormulaCell = ({ value, unit, color }: FormulaCellProps) => {
  const display = value && unit ? `${value} ${unit}` : value;
  return (
    <Typography
      sx={{
        fontSize: "0.78rem",
        color: color ?? "inherit",
        fontWeight: 500,
        whiteSpace: "pre-line",
        wordBreak: "break-word",
        lineHeight: 1.45,
      }}
    >
      {display || ""}
    </Typography>
  );
};

export default FormulaCell;

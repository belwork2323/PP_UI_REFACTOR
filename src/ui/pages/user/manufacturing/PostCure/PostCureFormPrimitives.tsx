import type { ReactNode } from "react";
import { Box, TextField, Typography, alpha } from "@mui/material";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import { Controller, useFormContext } from "react-hook-form";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

export {
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SubsectionHeading,
  TableSelectInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableInputSx,
  postCureTableRowSx,
} from "./postCureFormPrimitivesShared";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  theme?: any;
  mb?: number;
};

export const SectionCard = ({ title, children, theme, mb = 3 }: SectionCardProps) => {
  const details = theme?.manufacturing?.postCure?.details;
  const BRAND = POST_CURE_BRAND;
  return (
    <Box
      sx={{
        ...(details?.section ?? {
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha(BRAND.border, 0.65)}`,
          background: "#fff",
        }),
        mb,
      }}
    >
      <Typography
        sx={
          details?.sectionTitle ?? {
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: BRAND.primaryLight,
            mb: 1.5,
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }
        }
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export const TableTextInput = ({
  value,
  onChange,
  disabled,
  readOnly,
  type = "text",
  multiline = false,
  minRows,
  error = false,
  helperText,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  multiline?: boolean;
  minRows?: number;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}) => (
  <Box sx={{ width: "100%" }}>
    <TextField
      size="small"
      fullWidth
      type={type}
      value={value ?? ""}
      disabled={disabled || readOnly}
      multiline={multiline}
      minRows={minRows}
      placeholder={placeholder}
      error={error}
      helperText={helperText}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        "& .MuiInputBase-root": { fontSize: "0.82rem" },
        "& .MuiFormHelperText-root": { mx: 0, mt: 0.5 },
      }}
    />
  </Box>
);

import type { ChangeEventHandler, ElementType } from "react";
import { Button, type ButtonProps } from "@mui/material";

type FileUploadButtonProps = Omit<ButtonProps<"label">, "onChange" | "component"> & {
  label?: string;
  icon?: ElementType;
  accept?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

/**
 * Modernized FileUploadButton
 * Handles missing icons gracefully and adds better UI feedback
 */
const FileUploadButton = ({ label, icon: Icon, onChange, accept, ...props }: FileUploadButtonProps) => {
  return (
    <Button
      variant="outlined"
      fullWidth
      // Defensive check: only render Icon if it is a valid component
      startIcon={Icon ? <Icon /> : null}
      sx={{
        textTransform: "none",
        borderRadius: 2,
        borderStyle: "dashed", // Modern "drop-zone" feel
        py: 1.5,
        backgroundColor: "rgba(0, 0, 0, 0.02)",
        "&:hover": {
          borderStyle: "solid",
          backgroundColor: "rgba(25, 118, 210, 0.04)",
        },
      }}
      {...props}
      component="label"
    >
      {label || "Choose File"}
      <input
        hidden
        type="file"
        accept={accept}
        onChange={onChange}
        // Reset value on click so selecting the same file triggers onChange
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
    </Button>
  );
};

export default FileUploadButton;

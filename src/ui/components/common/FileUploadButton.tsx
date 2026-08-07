import type { ChangeEventHandler, ElementType } from "react";
import { useRef } from "react";
import { Button, type ButtonProps } from "@mui/material";

type FileUploadButtonProps = Omit<ButtonProps<"button">, "onChange" | "component" | "onClick"> & {
  label?: string;
  icon?: ElementType;
  /** Kept for API compatibility; not applied to the native input (picker latency). */
  accept?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

/**
 * File upload trigger. Opens the native picker via input.click() without an
 * `accept` attribute so Linux Chromium dialogs stay responsive.
 */
const FileUploadButton = ({
  label,
  icon: Icon,
  onChange,
  accept: _accept,
  ...props
}: FileUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onChange}
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outlined"
        fullWidth
        disableRipple
        startIcon={Icon ? <Icon /> : null}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
          }
        }}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          borderStyle: "dashed",
          py: 1.5,
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          "&:hover": {
            borderStyle: "solid",
            backgroundColor: "rgba(25, 118, 210, 0.04)",
          },
        }}
        {...props}
      >
        {label || "Choose File"}
      </Button>
    </>
  );
};

export default FileUploadButton;

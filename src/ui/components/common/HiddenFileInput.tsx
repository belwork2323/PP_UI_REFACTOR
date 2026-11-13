import { forwardRef, type ChangeEvent, type Ref } from "react";

type HiddenFileInputProps = {
  id: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  disabled?: boolean;
};

/** Hidden file input; activated via <label htmlFor={id}> (works with display:none).
 *  No `accept` attribute — keeps the native picker fast on Linux Chromium. */
const HiddenFileInput = forwardRef(function HiddenFileInput(
  { id, onChange, multiple = true, disabled = false }: HiddenFileInputProps,
  ref: Ref<HTMLInputElement>,
) {
  return (
    <input
      id={id}
      ref={ref}
      type="file"
      multiple={multiple}
      onChange={onChange}
      style={{ display: "none" }}
      disabled={disabled}
    />
  );
});

export default HiddenFileInput;

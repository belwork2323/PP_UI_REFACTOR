import { forwardRef, type ChangeEvent, type Ref } from "react";

/** Match prior accept list; keep broad for OS that omit MIME on pick. */
export const CERTIFICATE_FILE_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/zip,application/x-zip-compressed";

type CertificateFileInputProps = {
  id: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
};

/** Hidden file input; activated via <label htmlFor={id}> (works with display:none).
 *  No `accept` attribute — keeps the native picker fast on Linux Chromium. */
const CertificateFileInput = forwardRef(function CertificateFileInput(
  { id, onChange, multiple = true }: CertificateFileInputProps,
  ref: Ref<HTMLInputElement>
) {
  return (
    <input
      id={id}
      ref={ref}
      type="file"
      multiple={multiple}
      onChange={onChange}
      style={{ display: "none" }}
    />
  );
});

export default CertificateFileInput;

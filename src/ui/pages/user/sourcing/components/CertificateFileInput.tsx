import { forwardRef, type ChangeEvent, type Ref } from "react";

import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";

/** RMS lot certificates: PDF, images, and video only. */
export const CERTIFICATE_FILE_ACCEPT = FILE_PICKER_ACCEPT.IMAGE_VIDEO_PDF;

type CertificateFileInputProps = {
  id: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  disabled?: boolean;
};

/** Hidden file input; activated via <label htmlFor={id}> (works with display:none).
 *  No `accept` attribute — keeps the native picker fast on Linux Chromium. */
const CertificateFileInput = forwardRef(function CertificateFileInput(
  { id, onChange, multiple = true, disabled = false }: CertificateFileInputProps,
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

export default CertificateFileInput;

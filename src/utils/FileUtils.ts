const RMS_CERTIFICATE_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
] as const;

/**
 * Extension-only accept hints for post-pick validation / UI copy.
 * Do NOT put MIME wildcards (`image/*`) or long MIME lists on `<input accept>` —
 * Linux Chrome/Chromium + xdg-desktop-portal can take several seconds to open.
 * Prefer omitting `accept` on the input and filtering after selection.
 */
export const FILE_PICKER_ACCEPT = {
  IMAGE: ".jpg,.jpeg,.png,.webp,.gif,.bmp",
  IMAGE_VIDEO: ".jpg,.jpeg,.png,.webp,.gif,.bmp,.mp4,.webm,.mov",
  IMAGE_VIDEO_PDF: ".jpg,.jpeg,.png,.webp,.gif,.bmp,.mp4,.webm,.mov,.pdf",
  IMAGE_PDF: ".jpg,.jpeg,.png,.webp,.pdf",
  PDF: ".pdf",
} as const;

/** Extensions from an accept string (ignores MIME tokens). */
export const extractFileExtensions = (accept?: string | null): string[] =>
  String(accept ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.startsWith(".") && part.length > 1);

export const fileNameMatchesAccept = (fileName: string, accept?: string | null): boolean => {
  const extensions = extractFileExtensions(accept);
  if (!extensions.length) return true;
  const lower = String(fileName ?? "").toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
};

/**
 * Utility to handle file validations and formatting
 */
export const fileUtils = {
  ALLOWED_TYPES: {
    DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
    CERTIFICATES: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
  },

  CERTIFICATE_MAX_MB: 20,

  validateFile: (file, allowedTypes = null, maxSizeMB = 50) => {
    // Default to DOCUMENTS if no types provided
    const types = allowedTypes || fileUtils.ALLOWED_TYPES.DOCUMENTS;

    if (!file) return { valid: false, error: "No file selected" };

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB` };
    }

    if (!types.includes(file.type)) {
      return { valid: false, error: "Invalid format. Only PDF, Word, or Images allowed." };
    }

    return { valid: true };
  },

  /** Extension fallback when OS reports empty/wrong MIME (common on Windows). */
  hasAllowedCertificateExtension(fileName: string): boolean {
    const name = String(fileName ?? "").toLowerCase();
    return RMS_CERTIFICATE_EXTENSIONS.some((ext) => name.endsWith(ext));
  },

  validateCertificateFile(file: File, maxSizeMB = fileUtils.CERTIFICATE_MAX_MB) {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSizeMB) {
      return { valid: false as const, error: `File size exceeds ${maxSizeMB}MB` };
    }
    if (
      fileUtils.ALLOWED_TYPES.CERTIFICATES.includes(file.type) ||
      fileUtils.hasAllowedCertificateExtension(file.name)
    ) {
      return { valid: true as const };
    }
    return { valid: false as const, error: undefined };
  },

  /** True when URL can be opened in browser (not blob/pending/placeholder). */
  isOpenableCertificateUrl(url: string): boolean {
    const trimmed = String(url ?? "").trim();
    if (!trimmed) return false;
    if (/^blob:/i.test(trimmed)) return false;
    if (/^pending-upload:\/\//i.test(trimmed)) return false;
    if (/example\.invalid/i.test(trimmed)) return false;
    return /^https?:\/\//i.test(trimmed);
  },

  getExtension(fileName?: string | null): string {
    const base = String(fileName ?? "").split(/[/\\]/).pop() ?? "";
    const parts = base.split(".");
    if (parts.length < 2) return "";
    return parts.pop()!.toLowerCase();
  },

  /** Classify a file for view vs download behaviour. */
  getFileKind(
    fileName?: string | null,
    mimeType?: string | null,
  ): "pdf" | "image" | "document" | "video" | "other" {
    const mime = String(mimeType ?? "").toLowerCase();
    const ext = fileUtils.getExtension(fileName);

    if (mime.startsWith("video/") || ["mp4", "webm", "mov", "m4v", "avi"].includes(ext)) {
      return "video";
    }
    if (mime === "application/pdf" || ext === "pdf") return "pdf";
    if (
      mime.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)
    ) {
      return "image";
    }
    if (
      [
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "txt",
        "csv",
        "rtf",
      ].includes(ext) ||
      mime.includes("word") ||
      mime.includes("excel") ||
      mime.includes("spreadsheet") ||
      mime.includes("presentation") ||
      mime === "text/plain" ||
      mime === "text/csv"
    ) {
      return "document";
    }
    return "other";
  },

  /** PDF, images, and office docs open in the in-app viewer; videos download. */
  isInAppPreviewable(fileName?: string | null, mimeType?: string | null): boolean {
    const kind = fileUtils.getFileKind(fileName, mimeType);
    return kind === "pdf" || kind === "image" || kind === "document";
  },

  base64ToBlob(base64: string, mimeType = "application/octet-stream"): Blob {
    const normalizedBase64 = base64.includes(",") ? base64.split(",").pop() ?? "" : base64;
    const binary = window.atob(normalizedBase64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new Blob([bytes], { type: mimeType });
  },

  resolveMimeType(fileName?: string | null, mimeType?: string | null): string {
    const mime = String(mimeType ?? "").trim();
    if (mime && mime !== "application/octet-stream") return mime;

    const kind = fileUtils.getFileKind(fileName, mimeType);
    if (kind === "pdf") return "application/pdf";
    if (kind === "image") return "image/*";
    if (kind === "video") return "video/mp4";
    return mime || "application/octet-stream";
  },
};

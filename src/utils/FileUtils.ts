const CERTIFICATE_EXTENSION_FALLBACK = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
  ".zip",
] as const;

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
    ],
    CERTIFICATES: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "image/jpeg",
      "image/png",
      "application/zip",
      "application/x-zip-compressed",
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

  prepareFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      // Only append if data exists
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },

  /** Extension fallback when OS reports empty/wrong MIME (common on Windows). */
  hasAllowedCertificateExtension(fileName: string): boolean {
    const name = String(fileName ?? "").toLowerCase();
    return CERTIFICATE_EXTENSION_FALLBACK.some((ext) => name.endsWith(ext));
  },

  validateCertificateFile(file: File, maxSizeMB = fileUtils.CERTIFICATE_MAX_MB) {
    const primary = fileUtils.validateFile(
      file,
      fileUtils.ALLOWED_TYPES.CERTIFICATES,
      maxSizeMB
    );
    if (primary.valid) return { valid: true as const };
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSizeMB) return { valid: false as const, error: primary.error };
    if (fileUtils.hasAllowedCertificateExtension(file.name)) {
      return { valid: true as const };
    }
    return { valid: false as const, error: primary.error };
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
};

/**
 * Utility for handling media files (Images/Visual Records)
 */
export const mediaUtils = {
  ALLOWED_MEDIA_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_SIZE_MB: 50,

  validateMedia: (file) => {
    if (!file) return { valid: false, error: "No media file selected" };

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > mediaUtils.MAX_SIZE_MB) {
      return { valid: false, error: `Media exceeds ${mediaUtils.MAX_SIZE_MB}MB` };
    }

    if (!mediaUtils.ALLOWED_MEDIA_TYPES.includes(file.type)) {
      return { valid: false, error: "Invalid media format. Use JPG, PNG, or WEBP." };
    }

    return { valid: true };
  },

  /**
   * Generates a local preview URL for images
   */
  generatePreview: (file) => {
    return URL.createObjectURL(file);
  },
};

export type FileAttachmentStatus = "uploading" | "uploaded" | "failed";

export type FileAttachment = {
  fileId: string | null;
  fileName: string;
  status: FileAttachmentStatus;
  isTemp: boolean;
};

export type FileIdRequest = {
  subDepartmentId: number;
  fileId: string;
};

export type UploadedFile = {
  fileId: string;
  originalFileName?: string;
  fileName?: string;
  status?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  errorMessage?: string;
};

export type FileDownloadData = {
  fileId: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  base64Content?: string;
};

export function extractUploadedFileId(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const root = payload as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const file =
    nested?.file && typeof nested.file === "object"
      ? (nested.file as Record<string, unknown>)
      : root.file && typeof root.file === "object"
        ? (root.file as Record<string, unknown>)
        : null;

  const raw =
    root.fileId ??
    nested?.fileId ??
    file?.fileId ??
    (nested?.uploadedFile as Record<string, unknown> | undefined)?.fileId;

  return String(raw ?? "").trim();
}

export function extractUploadedFileName(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const root = payload as Record<string, unknown>;
  const nested =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const raw =
    root.originalFileName ??
    root.fileName ??
    nested?.originalFileName ??
    nested?.fileName;
  return String(raw ?? "").trim() || fallback;
}

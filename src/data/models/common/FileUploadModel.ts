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

/** Form-state file ref after /files/upload (name/url/mime kept for UI; submit sends fileId only). */
export type FileRef = {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  storedFileName?: string;
  originalFileName?: string;
  fileId?: string | null;
  localId?: string;
  status?: FileAttachmentStatus;
  uploadProgress?: number;
  isTemp?: boolean;
  file?: File | null;
};

/** Create/update API file field — id only; backend returns metadata on form details. */
export type FileIdPayload = {
  fileId: string;
};

export const newFileLocalId = (): string =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const isFileUploadIncomplete = (ref: FileRef | null | undefined): boolean =>
  ref?.status === "uploading" || ref?.status === "failed";

export const isFileReady = (ref: FileRef | null | undefined): boolean => {
  if (!ref || isFileUploadIncomplete(ref)) return false;
  const fileId = String(ref.fileId ?? "").trim();
  if (fileId) return true;
  const url = String(ref.fileUrl ?? "").trim();
  return Boolean(url) && !/^pending-upload:\/\//i.test(url);
};

export const parseFileRef = (value: unknown): FileRef | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[object Object]") return null;
    // API sometimes returns bare fileId strings (e.g. "FILE_…") in certificate arrays.
    if (/^FILE_/i.test(trimmed)) {
      return {
        fileName: trimmed,
        fileUrl: trimmed,
        mimeType: "application/octet-stream",
        fileId: trimmed,
        localId: newFileLocalId(),
        status: "uploaded",
        isTemp: false,
        file: null,
      };
    }
    // Legacy filename-only values — not openable without fileId.
    return {
      fileName: trimmed,
      fileUrl: "",
      mimeType: "application/octet-stream",
      localId: newFileLocalId(),
      status: "uploaded",
      isTemp: false,
      file: null,
    };
  }
  if (typeof value !== "object" || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const fileId = String(o.fileId ?? "").trim() || null;
  const fileUrl = String(o.fileUrl ?? o.filePath ?? o.downloadUrl ?? fileId ?? "").trim();
  const rawName = o.fileName ?? o.originalFileName ?? o.name ?? "";
  const fileName =
    (typeof rawName === "string" ? rawName.trim() : "") ||
    String(fileUrl.split("/").pop() || "").trim();
  if (!fileId && !fileName && !fileUrl) return null;
  const existingLocalId = String(o.localId ?? "").trim();
  const rawStatus = o.status;
  const status: FileAttachmentStatus | undefined =
    rawStatus === "uploading" || rawStatus === "uploaded" || rawStatus === "failed"
      ? rawStatus
      : fileId
        ? "uploaded"
        : undefined;
  return {
    fileName: fileName || fileId || "file",
    fileUrl: fileUrl || fileId || "",
    mimeType: String(o.mimeType ?? "").trim() || "application/octet-stream",
    storedFileName: String(o.storedFileName ?? "").trim() || undefined,
    originalFileName:
      typeof o.originalFileName === "string" ? o.originalFileName.trim() || undefined : undefined,
    fileId,
    // Preserve localId so in-flight upload patches (patchByLocalId) still match after re-parse.
    localId: existingLocalId || newFileLocalId(),
    status,
    isTemp: typeof o.isTemp === "boolean" ? o.isTemp : fileId ? false : undefined,
    file: o.file instanceof File ? o.file : null,
  };
};

export const parseFileRefs = (value: unknown): FileRef[] => {
  if (value == null || value === "") return [];
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => parseFileRef(part.trim()))
      .filter((r): r is FileRef => Boolean(r));
  }
  if (Array.isArray(value)) {
    return value.map(parseFileRef).filter((r): r is FileRef => Boolean(r));
  }
  const single = parseFileRef(value);
  return single ? [single] : [];
};

export const toFileIdPayload = (ref: FileRef): FileIdPayload | null => {
  if (!ref || ref.status === "failed") return null;
  const fileId = String(ref.fileId ?? "").trim();
  if (!fileId) return null;
  return { fileId };
};

/**
 * Create/update attachments from current form refs only.
 * Files removed in the UI are omitted; the server deletes those fileIds on save.
 * Temp delete API is only for unsaved uploads (see useFileService.removeStoredFile).
 */
export const fileIdsFromFormRefs = (refs: FileRef[] | null | undefined): FileIdPayload[] => {
  if (!Array.isArray(refs) || refs.length === 0) return [];
  return refs.map(toFileIdPayload).filter((p): p is FileIdPayload => Boolean(p));
};

/**
 * Merge file-ref lists for seed/hydration only — NOT for QCDivisionFileField onChange.
 * File-field onChange should assign the incoming list directly (Hardware pattern).
 * Only preserves actively uploading/failed refs missing from incoming.
 */
export const mergeFileRefsPreferLive = (
  current: FileRef[] | null | undefined,
  incoming: FileRef[] | null | undefined,
): FileRef[] => {
  const curr = Array.isArray(current) ? current : [];
  const next = Array.isArray(incoming) ? incoming : [];
  const byKey = new Map<string, FileRef>();
  const keyOf = (ref: FileRef) =>
    String(ref.localId ?? "").trim() || String(ref.fileId ?? "").trim() || "";

  for (const ref of curr) {
    const key = keyOf(ref);
    if (key) byKey.set(key, ref);
  }
  for (const ref of next) {
    const key = keyOf(ref);
    if (!key) continue;
    const prev = byKey.get(key);
    byKey.set(key, prev ? { ...prev, ...ref } : ref);
  }

  const incomingKeys = new Set(next.map(keyOf).filter(Boolean));
  for (const ref of curr) {
    const key = keyOf(ref);
    if (!key || incomingKeys.has(key)) continue;
    if (ref.status === "uploading" || ref.status === "failed") {
      byKey.set(key, ref);
    }
  }

  const ordered: FileRef[] = [];
  const seen = new Set<string>();
  for (const ref of next) {
    const key = keyOf(ref);
    const merged = key ? byKey.get(key) ?? ref : ref;
    ordered.push(merged);
    if (key) seen.add(key);
  }
  for (const [key, ref] of byKey) {
    if (seen.has(key)) continue;
    if (ref.status === "uploading" || ref.status === "failed") {
      ordered.push(ref);
    }
  }
  return ordered;
};

/** After a successful save, mark uploaded fileIds as persisted (UI-only delete until next save). */
export const markFileRefsPersisted = (refs: FileRef[] | null | undefined): FileRef[] => {
  if (!Array.isArray(refs)) return [];
  return refs.map((ref) => {
    const fileId = String(ref.fileId ?? "").trim();
    if (!fileId || ref.status === "uploading" || ref.status === "failed") return ref;
    return ref.isTemp === false ? ref : { ...ref, isTemp: false };
  });
};

/** Walk nested form values and mark any FileRef lists as persisted. */
export const markPersistedFileRefsDeep = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every(
        (item) => item && typeof item === "object" && ("fileName" in item || "fileId" in item),
      )
    ) {
      return markFileRefsPersisted(value as FileRef[]);
    }
    return value.map(markPersistedFileRefsDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => [
        key,
        markPersistedFileRefsDeep(child),
      ]),
    );
  }
  return value;
};

export const toFileIdListPayload = (value: unknown): FileIdPayload[] =>
  fileIdsFromFormRefs(parseFileRefs(value));

export const toFileIdPayloadOrNull = (value: unknown): FileIdPayload | null => {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return toFileIdListPayload(value)[0] ?? null;
  }
  if (typeof value === "object" && value !== null && "fileName" in (value as object)) {
    return toFileIdPayload(value as FileRef);
  }
  const refs = parseFileRefs(value);
  return refs[0] ? toFileIdPayload(refs[0]) : null;
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

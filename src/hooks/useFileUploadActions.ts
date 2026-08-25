import { useCallback, useRef, type ChangeEvent } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import { useFileService } from "@hooks/useFileService";
import { useFilePreview } from "@hooks/useFilePreview";
import {
  newFileLocalId,
  type FileRef,
} from "@data/models/common/FileUploadModel";

const MAX_SIZE_MB = 50;

export type FileAcceptMode = "image" | "imageVideo" | "pdf" | "imageVideoPdf";

export type UseFileUploadActionsOptions = {
  acceptMode?: FileAcceptMode;
  /** Auth store sub-department slug used for /files/upload. */
  subDeptSlug: string;
  /** Shown when the signed-in user has no matching sub-department. */
  missingSubDeptMessage?: string;
};

const validateUploadFile = (
  file: File,
  mode: FileAcceptMode,
): { valid: boolean; error?: string } => {
  if (!file) return { valid: false, error: "No file selected" };
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_SIZE_MB) {
    return { valid: false, error: `File size exceeds ${MAX_SIZE_MB}MB` };
  }
  const mime = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(name);
  const isImage = mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name);
  const isVideo = mime.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(name);
  let ok = false;
  let error = "Invalid format.";
  if (mode === "image") {
    ok = isImage;
    error = "Invalid format. Use an image file.";
  } else if (mode === "pdf") {
    ok = isPdf;
    error = "Invalid format. Use a PDF file.";
  } else if (mode === "imageVideoPdf") {
    ok = isImage || isVideo || isPdf;
    error = "Invalid format. Use image, video, or PDF.";
  } else {
    ok = isImage || isVideo;
    error = "Invalid format. Use image or video.";
  }
  if (!ok) return { valid: false, error };
  return { valid: true };
};

/** Upload / retry / remove / open for form `FileRef` lists. */
export function useFileUploadActions(
  files: FileRef[],
  onChange: (next: FileRef[]) => void,
  options: UseFileUploadActionsOptions,
) {
  const acceptMode = options.acceptMode ?? "imageVideoPdf";
  const subDeptSlug = options.subDeptSlug;
  const missingSubDeptMessage =
    options.missingSubDeptMessage ?? "Sub-department is missing. Cannot upload files.";
  const filesRef = useRef(files);
  filesRef.current = files;
  const showAlert = useAlertStore((state) => state.showAlert);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === subDeptSlug)?.subDepartmentId,
  );
  const { upload, removeStoredFile } = useFileService();
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const patchByLocalId = useCallback(
    (localId: string, patch: Partial<FileRef>) => {
      const next = filesRef.current.map((ref) =>
        ref.localId === localId ? { ...ref, ...patch } : ref,
      );
      filesRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const uploadOne = useCallback(
    async (localId: string, file: File) => {
      if (!subDepartmentId) {
        patchByLocalId(localId, { status: "failed", fileId: null, uploadProgress: undefined });
        showAlert(missingSubDeptMessage, "error");
        return;
      }
      patchByLocalId(localId, { status: "uploading", uploadProgress: 0, fileId: null });
      const result = await upload(file, subDepartmentId, (progress) => {
        patchByLocalId(localId, { uploadProgress: progress });
      });
      if (!result?.fileId) {
        patchByLocalId(localId, { status: "failed", fileId: null, uploadProgress: undefined });
        return;
      }
      patchByLocalId(localId, {
        fileId: result.fileId,
        fileName: result.fileName || file.name,
        fileUrl: result.fileId,
        mimeType: file.type || "application/octet-stream",
        status: "uploaded",
        isTemp: true,
        file,
        uploadProgress: undefined,
      });
    },
    [missingSubDeptMessage, patchByLocalId, showAlert, subDepartmentId, upload],
  );

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const incoming = input.files ? Array.from(input.files) : [];
      if (!incoming.length) return;

      const accepted: FileRef[] = [];
      for (const file of incoming) {
        const { valid, error } = validateUploadFile(file, acceptMode);
        if (!valid) {
          showAlert(`${file.name}: ${error ?? "Invalid file"}`, "warning");
          continue;
        }
        accepted.push({
          localId: newFileLocalId(),
          fileId: null,
          fileName: file.name,
          fileUrl: "",
          mimeType: file.type || "application/octet-stream",
          file,
          status: "uploading",
          uploadProgress: 0,
          isTemp: true,
        });
      }

      if (accepted.length) {
        const next = [...filesRef.current, ...accepted];
        filesRef.current = next;
        onChange(next);
        accepted.forEach((ref) => {
          if (ref.file && ref.localId) void uploadOne(ref.localId, ref.file);
        });
      }

      queueMicrotask(() => {
        input.value = "";
      });
    },
    [acceptMode, onChange, showAlert, uploadOne],
  );

  const uploadSingleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        filesRef.current = [];
        onChange([]);
        return;
      }
      const { valid, error } = validateUploadFile(file, acceptMode);
      if (!valid) {
        showAlert(`${file.name}: ${error ?? "Invalid file"}`, "warning");
        return;
      }
      const localId = newFileLocalId();
      const next: FileRef[] = [
        {
          localId,
          fileId: null,
          fileName: file.name,
          fileUrl: "",
          mimeType: file.type || "application/octet-stream",
          file,
          status: "uploading",
          uploadProgress: 0,
          isTemp: true,
        },
      ];
      filesRef.current = next;
      onChange(next);
      void uploadOne(localId, file);
    },
    [acceptMode, onChange, showAlert, uploadOne],
  );

  const handleRetry = useCallback(
    (index: number) => {
      const ref = filesRef.current[index];
      if (!ref?.file || !ref.localId) return;
      patchByLocalId(ref.localId, { status: "uploading", uploadProgress: 0, fileId: null });
      void uploadOne(ref.localId, ref.file);
    },
    [patchByLocalId, uploadOne],
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const ref = filesRef.current[index];
      if (!ref) return;
      const fileId = String(ref.fileId ?? "").trim();
      // Temp uploads: delete via temp API. Files loaded from form details are
      // persisted server-side — drop from UI only; save payload omits their fileId.
      const isTempUpload = ref.isTemp !== false;
      if (fileId && subDepartmentId && isTempUpload) {
        const removed = await removeStoredFile(fileId, subDepartmentId, true);
        if (!removed) return;
      }
      const next = filesRef.current.filter((_, i) => i !== index);
      filesRef.current = next;
      onChange(next);
    },
    [onChange, removeStoredFile, subDepartmentId],
  );

  const handleOpen = useCallback(
    (index: number) => {
      const ref = filesRef.current[index];
      const fileId = String(ref?.fileId ?? "").trim();
      if (fileId && subDepartmentId) {
        void openFile(fileId, subDepartmentId, ref.fileName);
        return;
      }
      const url = String(ref?.fileUrl ?? "").trim();
      if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    },
    [openFile, subDepartmentId],
  );

  return {
    handleFilesSelected,
    uploadSingleFile,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview: preview,
    closeFilePreview: closePreview,
    downloadFilePreview: downloadCurrent,
    subDepartmentId,
  };
}

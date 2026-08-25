import { useCallback, useRef, type ChangeEvent } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import { STRINGS } from "@app/config/strings";
import { useFileService } from "@hooks/useFileService";
import { useFilePreview } from "@hooks/useFilePreview";
import {
  newCasingFileLocalId,
  type UploadedFileRef,
} from "@data/models/user/RocketMotorCasingFormModel";

const S = STRINGS.SOURCING.CASING_CREATE;
const MAX_SIZE_MB = 50;

const validateCasingUploadFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) return { valid: false, error: "No file selected" };
  const sizeMb = file.size / (1024 * 1024);
  if (sizeMb > MAX_SIZE_MB) {
    return { valid: false, error: `File size exceeds ${MAX_SIZE_MB}MB` };
  }
  const mime = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const ok =
    mime === "application/pdf" ||
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    /\.(pdf|jpe?g|png|webp|mp4|webm|mov)$/i.test(name);
  if (!ok) {
    return { valid: false, error: "Invalid format. Use PDF, JPG, PNG, WEBP, MP4, or WEBM." };
  }
  return { valid: true };
};

/** Eager upload / retry / remove / open for RMC `UploadedFileRef` lists (RMS certificate parity). */
export function useCasingFileActions(
  files: UploadedFileRef[],
  onChange: (next: UploadedFileRef[]) => void,
) {
  const filesRef = useRef(files);
  filesRef.current = files;
  const showAlert = useAlertStore((state) => state.showAlert);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "rocket-motor")?.subDepartmentId,
  );
  const { upload, removeStoredFile } = useFileService();
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const patchByLocalId = useCallback(
    (localId: string, patch: Partial<UploadedFileRef>) => {
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
        showAlert(
          S.SUB_DEPARTMENT_MISSING ?? "Sub-department is required to upload files.",
          "error",
        );
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
    [patchByLocalId, showAlert, subDepartmentId, upload],
  );

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const incoming = input.files ? Array.from(input.files) : [];
      if (!incoming.length) return;

      const accepted: UploadedFileRef[] = [];
      for (const file of incoming) {
        const { valid, error } = validateCasingUploadFile(file);
        if (!valid) {
          showAlert(`${file.name}: ${error ?? "Invalid file"}`, "warning");
          continue;
        }
        accepted.push({
          localId: newCasingFileLocalId(),
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
    [onChange, showAlert, uploadOne],
  );

  /** Replace list with a single uploading file (insulation / visual inspection media). */
  const uploadSingleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        filesRef.current = [];
        onChange([]);
        return;
      }
      const { valid, error } = validateCasingUploadFile(file);
      if (!valid) {
        showAlert(`${file.name}: ${error ?? "Invalid file"}`, "warning");
        return;
      }
      const localId = newCasingFileLocalId();
      const next: UploadedFileRef[] = [
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
    [onChange, showAlert, uploadOne],
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
      // Temp uploads: delete via temp API. Details files: UI-only (save omits fileId).
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

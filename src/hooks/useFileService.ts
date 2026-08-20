import { useCallback } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { fileController } from "@controllers/common/fileController";
import { fileUtils } from "@utils/FileUtils";

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
};

const openBlobInNewTab = (blob: Blob) => {
  const href = URL.createObjectURL(blob);
  window.open(href, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
};

export type UploadedFileResult = {
  fileId: string;
  fileName: string;
};

export const useFileService = () => {
  const showAlert = useAlertStore((state) => state.showAlert);

  const upload = useCallback(
    async (
      file: File,
      subDepartmentId: number,
      onProgress?: (progress: number) => void,
    ): Promise<UploadedFileResult | null> => {
      if (!subDepartmentId) {
        showAlert("Sub-department is required to upload files.", "error");
        return null;
      }

      const response = await fileController.uploadFile(file, subDepartmentId, onProgress);
      const fileId = String(response.data?.fileId ?? "").trim();
      if (!response.success || !fileId) {
        showAlert(response.message || "File upload failed.", "error");
        return null;
      }

      return {
        fileId,
        fileName: response.data?.originalFileName || response.data?.fileName || file.name,
      };
    },
    [showAlert],
  );

  const download = useCallback(
    async (fileId: string, subDepartmentId: number, suggestedFileName?: string) => {
      try {
        const { blob, fileName } = await fileController.downloadFile(fileId, subDepartmentId);
        triggerBrowserDownload(blob, suggestedFileName || fileName || fileId);
      } catch {
        showAlert("Failed to download file.", "error");
      }
    },
    [showAlert],
  );

  const preview = useCallback(
    async (fileId: string, subDepartmentId: number, suggestedFileName?: string) => {
      try {
        const name = suggestedFileName || fileId;
        const kind = fileUtils.getFileKind(name);

        // Videos use the stream endpoint and save to disk.
        if (kind === "video") {
          const { blob, fileName } = await fileController.downloadStream(fileId, subDepartmentId);
          triggerBrowserDownload(blob, fileName || name);
          return;
        }

        const { blob, fileName } = await fileController.downloadFile(fileId, subDepartmentId);
        openBlobInNewTab(blob);
      } catch {
        showAlert("Failed to open file.", "error");
      }
    },
    [showAlert],
  );

  const deleteFile = useCallback(
    async (fileId: string, subDepartmentId: number): Promise<boolean> => {
      const response = await fileController.deleteFile(fileId, subDepartmentId);
      if (!response.success) {
        showAlert(response.message || "Failed to delete file.", "error");
        return false;
      }
      return true;
    },
    [showAlert],
  );

  const deleteTemp = useCallback(
    async (fileId: string, subDepartmentId: number): Promise<boolean> => {
      const response = await fileController.deleteTempFile(fileId, subDepartmentId);
      if (!response.success) {
        showAlert(response.message || "Failed to delete file.", "error");
        return false;
      }
      return true;
    },
    [showAlert],
  );

  const removeStoredFile = useCallback(
    async (fileId: string, subDepartmentId: number, isTemp: boolean): Promise<boolean> => {
      return isTemp
        ? deleteTemp(fileId, subDepartmentId)
        : deleteFile(fileId, subDepartmentId);
    },
    [deleteFile, deleteTemp],
  );

  return {
    upload,
    download,
    preview,
    deleteFile,
    deleteTemp,
    removeStoredFile,
  };
};

export default useFileService;

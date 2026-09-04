import { useCallback, useEffect, useState } from "react";
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

export type FilePreviewState = {
  open: boolean;
  loading: boolean;
  downloading: boolean;
  fileName: string;
  blobUrl: string | null;
  mimeType: string | null;
  kind: "pdf" | "image" | "document" | "video" | "other";
};

const EMPTY_PREVIEW: FilePreviewState = {
  open: false,
  loading: false,
  downloading: false,
  fileName: "",
  blobUrl: null,
  mimeType: null,
  kind: "other",
};

/**
 * Opens files for viewing (PDF / docs / images) in an in-app dialog,
 * or downloads videos via the stream endpoint.
 */
export function useFilePreview() {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [preview, setPreview] = useState<FilePreviewState>(EMPTY_PREVIEW);
  const [blobCache, setBlobCache] = useState<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (preview.blobUrl) URL.revokeObjectURL(preview.blobUrl);
    };
  }, [preview.blobUrl]);

  const closePreview = useCallback(() => {
    setPreview((prev) => {
      if (prev.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return EMPTY_PREVIEW;
    });
    setBlobCache(null);
  }, []);

  const downloadCurrent = useCallback(async () => {
    if (!blobCache) return;
    setPreview((prev) => ({ ...prev, downloading: true }));
    try {
      triggerBrowserDownload(blobCache, preview.fileName || "download");
    } finally {
      setPreview((prev) => ({ ...prev, downloading: false }));
    }
  }, [blobCache, preview.fileName]);

  const openFile = useCallback(
    async (fileId: string, subDepartmentId: number, fileName?: string) => {
      const id = String(fileId ?? "").trim();
      if (!id || !subDepartmentId) {
        showAlert("Unable to open file.", "error");
        return;
      }

      const name = String(fileName ?? id).trim() || id;
      const kind = fileUtils.getFileKind(name);

      // Videos: stream endpoint → save to disk (no in-app player).
      if (kind === "video") {
        try {
          const { blob, fileName: downloadedName } = await fileController.downloadStream(
            id,
            subDepartmentId,
          );
          triggerBrowserDownload(blob, downloadedName && downloadedName !== id ? downloadedName : name);
        } catch {
          showAlert("Failed to download video.", "error");
        }
        return;
      }

      // PDF / docs / images: download endpoint → in-app viewer dialog.
      setPreview({
        open: true,
        loading: true,
        downloading: false,
        fileName: name,
        blobUrl: null,
        mimeType: null,
        kind,
      });
      setBlobCache(null);

      try {
        const { blob, fileName: downloadedName, mimeType } = await fileController.downloadFile(
          id,
          subDepartmentId,
        );
        const displayName = downloadedName && downloadedName !== id ? downloadedName : name;
        const typedBlob =
          blob.type && blob.type !== "application/octet-stream"
            ? blob
            : new Blob([blob], { type: mimeType });

        const href = URL.createObjectURL(typedBlob);
        setBlobCache(typedBlob);
        setPreview({
          open: true,
          loading: false,
          downloading: false,
          fileName: displayName,
          blobUrl: href,
          mimeType: typedBlob.type || mimeType,
          kind: fileUtils.getFileKind(displayName, typedBlob.type || mimeType),
        });
      } catch {
        setPreview(EMPTY_PREVIEW);
        setBlobCache(null);
        showAlert("Failed to open file.", "error");
      }
    },
    [showAlert],
  );

  return {
    preview,
    openFile,
    closePreview,
    downloadCurrent,
  };
}

export default useFilePreview;

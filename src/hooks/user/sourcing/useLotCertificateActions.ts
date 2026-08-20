import { useCallback, useRef, type ChangeEvent } from "react";
import { useAlertStore } from "@app/store/alertStore";
import { useAuthStore } from "@app/store/authStore";
import { STRINGS } from "@app/config/strings";
import { useFileService } from "@hooks/useFileService";
import { useFilePreview } from "@hooks/useFilePreview";
import {
  newCertificateLocalId,
  type LotCertificate,
} from "@data/models/user/RawMaterialProcurementModel";
import { fileUtils } from "@utils/FileUtils";

const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;

export function useLotCertificateActions(
  certificates: LotCertificate[],
  onChange: (next: LotCertificate[]) => void,
) {
  const certificatesRef = useRef(certificates);
  certificatesRef.current = certificates;
  const showAlert = useAlertStore((state) => state.showAlert);
  const subDepartmentId = useAuthStore(
    (s) => s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")?.subDepartmentId,
  );
  const { upload, removeStoredFile } = useFileService();
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const patchByLocalId = useCallback(
    (localId: string, patch: Partial<LotCertificate>) => {
      const next = certificatesRef.current.map((cert) =>
        cert.localId === localId ? { ...cert, ...patch } : cert,
      );
      certificatesRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const uploadCertificate = useCallback(
    async (localId: string, file: File) => {
      if (!subDepartmentId) {
        patchByLocalId(localId, { status: "failed", fileId: null, uploadProgress: undefined });
        showAlert(formStrings.SUB_DEPARTMENT_MISSING, "error");
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

      const accepted: LotCertificate[] = [];
      for (const file of incoming) {
        const { valid, error } = fileUtils.validateCertificateFile(file);
        if (!valid) {
          showAlert(`${file.name}: ${error ?? formStrings.CERT_INVALID_FILE}`, "warning");
          continue;
        }
        accepted.push({
          localId: newCertificateLocalId(),
          fileId: null,
          fileName: file.name,
          fileUrl: "",
          certificateType: "",
          file,
          status: "uploading",
          uploadProgress: 0,
          isTemp: true,
        });
      }

      if (accepted.length) {
        const next = [...certificatesRef.current, ...accepted];
        certificatesRef.current = next;
        onChange(next);
        accepted.forEach((cert) => {
          if (cert.file) void uploadCertificate(cert.localId!, cert.file);
        });
      }

      queueMicrotask(() => {
        input.value = "";
      });
    },
    [onChange, showAlert, uploadCertificate],
  );

  const handleRetry = useCallback(
    (index: number) => {
      const cert = certificatesRef.current[index];
      if (!cert?.file || !cert.localId) return;
      patchByLocalId(cert.localId, { status: "uploading", uploadProgress: 0, fileId: null });
      void uploadCertificate(cert.localId, cert.file);
    },
    [patchByLocalId, uploadCertificate],
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const cert = certificatesRef.current[index];
      if (!cert) return;
      const fileId = String(cert.fileId ?? "").trim();
      if (fileId && subDepartmentId) {
        const removed = await removeStoredFile(fileId, subDepartmentId, cert.isTemp !== false);
        if (!removed) return;
      }
      const next = certificatesRef.current.filter((_, i) => i !== index);
      certificatesRef.current = next;
      onChange(next);
    },
    [onChange, removeStoredFile, subDepartmentId],
  );

  const handleOpen = useCallback(
    (index: number) => {
      const cert = certificatesRef.current[index];
      const fileId = String(cert?.fileId ?? "").trim();
      if (!fileId || !subDepartmentId) return;
      void openFile(fileId, subDepartmentId, cert.fileName);
    },
    [openFile, subDepartmentId],
  );

  return {
    handleFilesSelected,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview: preview,
    closeFilePreview: closePreview,
    downloadFilePreview: downloadCurrent,
  };
}

import type { LotCertificate } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import type { DocumentAttachment } from "@ui/components/custom/DocumentAttachmentList";
import { fileUtils } from "@utils/FileUtils";

type OpenStoredFile = (fileId: string, subDepartmentId: number, fileName?: string) => unknown;

/** Maps lot certificates to read-only attachment rows; stored files open via `openFile`, others via URL. */
export const toLotCertificateAttachments = (
  certificates: LotCertificate[],
  {
    subDepartmentId,
    openFile,
    resolveFileName,
  }: {
    subDepartmentId?: number | null;
    openFile: OpenStoredFile;
    resolveFileName: (cert: LotCertificate) => string;
  },
): DocumentAttachment[] =>
  certificates.map((cert, index) => {
    const fileId = String(cert.fileId ?? "").trim();
    const fileName = resolveFileName(cert);
    return {
      key: `${cert.fileId || fileName}-${index}`,
      fileName,
      typeValue: cert.certificateType?.trim() || "—",
      isVideo: fileUtils.getFileKind(fileName, cert.mimeType) === "video",
      onOpen:
        fileId && subDepartmentId
          ? () => void openFile(fileId, subDepartmentId, fileName)
          : undefined,
      url: fileUtils.isOpenableCertificateUrl(cert.fileUrl) ? cert.fileUrl : undefined,
    };
  });

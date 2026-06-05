import type { MaterialBlock, MaterialFormGroup, MaterialLotBlock } from "../data/models/user/RawMaterialProcurementModel";

const PREFIX = "[RM-CertUpload]";

export const RM_CERT_UPLOAD_DEBUG =
  typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

function summarizeCert(cert: { fileName?: string; fileUrl?: string; file?: File | null }) {
  return {
    fileName: cert.fileName,
    fileUrl: String(cert.fileUrl ?? "").slice(0, 48),
    hasFileRef: Boolean(cert.file),
    fileSize: cert.file?.size,
    fileType: cert.file?.type,
  };
}

export function summarizeLotCerts(lot: MaterialLotBlock) {
  return {
    lotNo: lot.lotNo,
    certCount: (lot.certificates ?? []).length,
    certificates: (lot.certificates ?? []).map(summarizeCert),
  };
}

export function summarizeMaterialGroups(groups: MaterialFormGroup[]) {
  return groups.map((g) => ({
    material: g.material,
    lots: g.lots.map(summarizeLotCerts),
  }));
}

export function summarizeBlocks(blocks: MaterialBlock[]) {
  return blocks.map((b) => ({
    material: b.material,
    lotNo: b.lotNo,
    certCount: (b.certificates ?? []).length,
    certificates: (b.certificates ?? []).map(summarizeCert),
  }));
}

export function rmCertDebug(step: string, data?: Record<string, unknown>) {
  if (!RM_CERT_UPLOAD_DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23);
  if (data !== undefined) {
    console.log(`${PREFIX} ${ts} ${step}`, data);
  } else {
    console.log(`${PREFIX} ${ts} ${step}`);
  }
}

export function rmCertDebugFile(step: string, file: File, extra?: Record<string, unknown>) {
  if (!RM_CERT_UPLOAD_DEBUG) return;
  rmCertDebug(step, {
    name: file.name,
    size: file.size,
    type: file.type || "(empty mime)",
    lastModified: file.lastModified,
    ...extra,
  });
}

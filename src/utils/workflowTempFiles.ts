import type { LotCertificate, MaterialBlock } from "@data/models/user/RawMaterialProcurementModel";

export type TempFileIdExtractor<T = unknown> = (state: T) => string[];

export function diffNewTempFileIds(currentIds: string[], baselineIds: string[]): string[] {
  const baseline = new Set(baselineIds.map((id) => id.trim()).filter(Boolean));
  return [...new Set(currentIds.map((id) => id.trim()).filter(Boolean))].filter(
    (id) => !baseline.has(id),
  );
}

export function extractTempFileIdsFromMaterialBlocks(blocks: MaterialBlock[]): string[] {
  const ids: string[] = [];
  for (const block of blocks ?? []) {
    for (const cert of block.certificates ?? []) {
      const fileId = String(cert.fileId ?? "").trim();
      if (fileId && cert.isTemp !== false) {
        ids.push(fileId);
      }
    }
  }
  return ids;
}

export function extractPersistedCertificateFileIds(blocks: MaterialBlock[]): string[] {
  const ids: string[] = [];
  for (const block of blocks ?? []) {
    for (const cert of block.certificates ?? []) {
      const fileId = String(cert.fileId ?? "").trim();
      if (fileId && cert.isTemp === false) {
        ids.push(fileId);
      }
    }
  }
  return ids;
}

export function extractTempFileIdsFromCertificates(certs: LotCertificate[]): string[] {
  return (certs ?? [])
    .map((cert) => String(cert.fileId ?? "").trim())
    .filter((fileId) => fileId.length > 0);
}

export const noopTempFileExtractor: TempFileIdExtractor = () => [];

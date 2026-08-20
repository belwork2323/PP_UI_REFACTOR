import { post } from "@data/api/httpClient";
import { FILE_ENDPOINTS } from "@data/api/endPoints";
import type { FileIdRequest } from "@data/models/common/FileUploadModel";

const FILE_UPLOAD_TIMEOUT_MS = 120000;

export type FileUploadProgressOptions = {
  onUploadProgress?: (progress: number) => void;
};

/** Let axios set the multipart boundary; do not force Content-Type. */
const formDataRequestOptions = {
  timeout: FILE_UPLOAD_TIMEOUT_MS,
  transformRequest: [
    (data: unknown, headers: { delete?: (name: string) => void; ["Content-Type"]?: unknown }) => {
      if (data instanceof FormData) {
        headers?.delete?.("Content-Type");
        if (headers && "Content-Type" in headers) {
          delete headers["Content-Type"];
        }
      }
      return data;
    },
  ],
};

export const uploadFileApi = async (formData: FormData, options?: FileUploadProgressOptions) =>
  post(FILE_ENDPOINTS.UPLOAD, formData, {
    ...formDataRequestOptions,
    onUploadProgress: (event: { loaded?: number; total?: number }) => {
      const total = event.total ?? 0;
      const loaded = event.loaded ?? 0;
      if (total > 0 && options?.onUploadProgress) {
        options.onUploadProgress(Math.min(100, Math.round((loaded * 100) / total)));
      }
    },
  });

export const downloadFileApi = async (payload: FileIdRequest) =>
  post(FILE_ENDPOINTS.DOWNLOAD, payload);

export const downloadStreamApi = async (payload: FileIdRequest) =>
  post(FILE_ENDPOINTS.DOWNLOAD_STREAM, payload, { responseType: "blob" });

export const deleteFileApi = async (payload: FileIdRequest) =>
  post(FILE_ENDPOINTS.DELETE, payload);

export const deleteTempFileApi = async (payload: FileIdRequest) =>
  post(FILE_ENDPOINTS.DELETE_TEMP, payload);

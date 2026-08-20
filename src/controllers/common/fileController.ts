import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import {
  deleteFileApi,
  deleteTempFileApi,
  downloadFileApi,
  downloadStreamApi,
  uploadFileApi,
} from "@data/api/common/fileApi";
import {
  extractUploadedFileId,
  extractUploadedFileName,
  type FileDownloadData,
  type FileIdRequest,
  type UploadedFile,
} from "@data/models/common/FileUploadModel";
import { fileUtils } from "@utils/FileUtils";

export type DownloadedFileResult = {
  blob: Blob;
  fileName: string;
  mimeType: string;
};

const toFileIdRequest = (fileId: string, subDepartmentId: number): FileIdRequest => ({
  subDepartmentId,
  fileId,
});

export const fileController = {
  uploadFile: async (
    file: File,
    subDepartmentId: number,
    onUploadProgress?: (progress: number) => void,
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subDepartmentId", String(subDepartmentId));

      const response = await uploadFileApi(formData, { onUploadProgress });
      const wrapped = new ApiResponseModel<UploadedFile>(response);
      const fileId = extractUploadedFileId(response) || extractUploadedFileId(wrapped.data);
      if (wrapped.success && fileId) {
        wrapped.data = {
          fileId,
          originalFileName: extractUploadedFileName(response, file.name),
          fileName: extractUploadedFileName(response, file.name),
        };
      }
      return wrapped;
    } catch (error) {
      return new ApiResponseModel<UploadedFile>(error);
    }
  },

  downloadFile: async (fileId: string, subDepartmentId: number): Promise<DownloadedFileResult> => {
    const response = await downloadFileApi(toFileIdRequest(fileId, subDepartmentId));
    const wrapped = new ApiResponseModel<FileDownloadData>(response);
    const base64 = String(wrapped.data?.base64Content ?? "").trim();

    if (!wrapped.success || !base64) {
      throw new Error(wrapped.message || "File download failed");
    }

    const fileName =
      String(wrapped.data?.originalFileName ?? "").trim() || fileId;
    const mimeType = fileUtils.resolveMimeType(fileName, wrapped.data?.mimeType);

    return {
      blob: fileUtils.base64ToBlob(base64, mimeType),
      fileName,
      mimeType,
    };
  },

  downloadStream: async (fileId: string, subDepartmentId: number): Promise<DownloadedFileResult> => {
    const response = await downloadStreamApi(toFileIdRequest(fileId, subDepartmentId));

    if (response instanceof Blob) {
      const mimeType =
        response.type && response.type !== "application/octet-stream"
          ? response.type
          : "video/mp4";
      return {
        blob: response.type && response.type !== "application/octet-stream"
          ? response
          : new Blob([response], { type: mimeType }),
        fileName: fileId,
        mimeType,
      };
    }

    const wrapped = new ApiResponseModel<FileDownloadData>(response);
    const base64 = String(wrapped.data?.base64Content ?? "").trim();

    if (!wrapped.success || !base64) {
      throw new Error(wrapped.message || "File stream download failed");
    }

    const fileName =
      String(wrapped.data?.originalFileName ?? "").trim() || fileId;
    const mimeType = fileUtils.resolveMimeType(fileName, wrapped.data?.mimeType);

    return {
      blob: fileUtils.base64ToBlob(base64, mimeType),
      fileName,
      mimeType,
    };
  },

  deleteFile: async (fileId: string, subDepartmentId: number) => {
    try {
      const response = await deleteFileApi(toFileIdRequest(fileId, subDepartmentId));
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },

  deleteTempFile: async (fileId: string, subDepartmentId: number) => {
    try {
      const response = await deleteTempFileApi(toFileIdRequest(fileId, subDepartmentId));
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },
};

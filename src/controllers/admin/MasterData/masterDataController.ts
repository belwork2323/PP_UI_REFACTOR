import {
  fetchMasterDataTypes,
  fetchMasterDataList,
  createMasterData,
  updateMasterData,
  deleteMasterData,
} from "@data/api/admin/MasterData/masterDataApi";
import {
  MasterDataListModel,
  MasterDataTypeModel,
  buildCreatePayload,
  buildUpdatePayload,
  type MasterDataFormState,
  type MasterDataTypeDescriptor,
} from "@data/models/admin/MasterData/MasterDataModel";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";

export const masterDataController = {
  getTypes: async () => {
    try {
      const resp = await fetchMasterDataTypes();
      return new ApiResponseModel(resp, (res) => {
        const raw = res?.data;
        return Array.isArray(raw) ? raw.map(MasterDataTypeModel.fromApi) : [];
      });
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  list: async (type: string, payload: { search?: string; isActive?: boolean | null } = {}) => {
    try {
      const body: Record<string, unknown> = {};
      if (payload.search?.trim()) body.search = payload.search.trim();
      if (payload.isActive === true || payload.isActive === false) body.isActive = payload.isActive;
      const resp = await fetchMasterDataList(type, body);
      return new ApiResponseModel(resp, MasterDataListModel.fromApi);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  create: async (type: string, form: MasterDataFormState, schema: MasterDataTypeDescriptor | null) => {
    try {
      const resp = await createMasterData(type, buildCreatePayload(form, schema));
      return new ApiResponseModel(resp);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  update: async (type: string, form: MasterDataFormState, schema: MasterDataTypeDescriptor | null) => {
    try {
      const resp = await updateMasterData(type, buildUpdatePayload(form, schema));
      return new ApiResponseModel(resp);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },

  disable: async (type: string, id: number) => {
    try {
      const resp = await deleteMasterData(type, { id });
      return new ApiResponseModel(resp);
    } catch (error) {
      return new ApiResponseModel<null>(error);
    }
  },
};

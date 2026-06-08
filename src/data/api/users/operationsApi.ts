import { get, post } from "../httpClient";
import { USER_OPERATIONS_ENDPOINTS } from "../endPoints";
import type { MaterialsListRequest } from "../../models/user/MaterialsListModel";
import type { SubdepartmentBatchListRequest } from "../../models/user/SubdepartmentBatchModel";

export const fetchSubdepartmentBatchesApi = async (payload: SubdepartmentBatchListRequest) => {
  return await post(USER_OPERATIONS_ENDPOINTS.BATCH_LIST, payload);
};

export const fetchMaterialsListApi = async (payload: MaterialsListRequest) => {
  return await post(USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST, payload);
};

export const fetchMaterialSpecificationListApi = async (payload: { materialCode: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.MATERIAL_SPECIFICATION_LIST, payload);
};

export const fetchDimensionalParametersListApi = async (payload: { motorType: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.DIMENSIONAL_PARAMETERS_LIST, payload);
};

export const fetchSolidProcessesListApi = async (payload: { materialType: string }) => {
  return await post(USER_OPERATIONS_ENDPOINTS.SOLID_PROCESSES_LIST, payload);
};

export const fetchMotorsStageListApi = async (params?: { projectId?: string }) => {
  return await get(USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST, params ?? {});
};

export const fetchApprovedMotorsListApi = async (payload: {
  projectId: string;
  motorStage: string;
}) => {
  return await post(USER_OPERATIONS_ENDPOINTS.APPROVED_MOTORS_LIST, payload);
};

export const fetchCastingStationsApi = async () => {
  return await get(USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST);
};

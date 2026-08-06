import { post, put } from "../../httpClient";
import { USER_SUBSCALE_FORM_ENDPOINTS } from "../../endPoints";
import type {
  CreateSubscaleProcessingRequest,
  UpdateSubscaleProcessingRequest,
} from "../../models/user/subscaleApiPayloadMapper";

export const createSubscaleFormApi = async (payload: CreateSubscaleProcessingRequest) => {
  return await post(USER_SUBSCALE_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchSubscaleFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_SUBSCALE_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updateSubscaleFormApi = async (payload: UpdateSubscaleProcessingRequest) => {
  return await put(USER_SUBSCALE_FORM_ENDPOINTS.UPDATE_FORM, payload);
};

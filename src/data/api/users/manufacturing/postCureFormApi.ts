import { post, put } from "../../httpClient";
import { USER_POST_CURE_FORM_ENDPOINTS } from "../../endPoints";

export const createPostCureFormApi = async (payload: any) => {
  return await post(USER_POST_CURE_FORM_ENDPOINTS.CREATE_FORM, payload);
};

export const fetchPostCureFormDetailsApi = async (payload: {
  formId: string;
  subDepartmentId: number;
}) => {
  return await post(USER_POST_CURE_FORM_ENDPOINTS.FORM_DETAILS, payload);
};

export const updatePostCureFormApi = async (payload: any) => {
  return await put(USER_POST_CURE_FORM_ENDPOINTS.UPDATE_FORM, payload);
};

import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  PostCureDetailsModel,
  PostCureSubmitResponseModel,
  type PostCureFormBody,
} from "../../../data/models/user/PostCureFormModel";
import {
  createPostCureFormApi,
  fetchPostCureFormDetailsApi,
  updatePostCureFormApi,
} from "../../../data/api/users/manufacturing/postCureFormApi";

export type PostCureCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  operationType: "LOOSE_FLAP_FILLING" | "INHIBITION";
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE";
} & PostCureFormBody;

export type PostCureUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  operationType: "LOOSE_FLAP_FILLING" | "INHIBITION";
  inhibitorType?: "IR1" | "HEMCOAT_3K" | "NOT_APPLICABLE";
} & PostCureFormBody;


export type PostCureDetailsPayload = {
  formId: string;
  // subDepartmentId: number;
};

export const postCureController = {
  createForm: async (payload: PostCureCreatePayload) => {
    try {
      const response = await createPostCureFormApi(payload);
      return new ApiResponseModel<PostCureSubmitResponseModel>(response, (res) =>
        PostCureSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create post-cure form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: PostCureDetailsPayload) => {
    try {
      const response = await fetchPostCureFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => PostCureDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch post-cure form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: PostCureUpdatePayload) => {
    try {
      const response = await updatePostCureFormApi(payload);
      return new ApiResponseModel<PostCureSubmitResponseModel>(response, (res) =>
        PostCureSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update post-cure form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default postCureController;

import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  PostCureDetailsModel,
  PostCureSubmitResponseModel,
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
  motorId: string;
  decoring: {
    decoringLoad: string;
  };
  trimming: {
    trimmedZoneDimension: string;
  };
  lfFilling: {
    inspection: string;
    weight: {
      heSideAndDate: string;
      neSideAndDate: string;
      total: string;
    };
  };
  inhibitionResin: {
    irType: string;
    weight: {
      heSideAndDate: string;
      neSideAndDate: string;
      total: string;
    };
  };
};

export type PostCureUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  motorId: string;
  decoring: PostCureCreatePayload["decoring"];
  trimming: PostCureCreatePayload["trimming"];
  lfFilling: PostCureCreatePayload["lfFilling"];
  inhibitionResin: PostCureCreatePayload["inhibitionResin"];
};

export type PostCureDetailsPayload = {
  formId: string;
  subDepartmentId: number;
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

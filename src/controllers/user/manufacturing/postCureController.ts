import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  PostCureDetailsModel,
  PostCureSubmitResponseModel,
  type PostCureFormBody,
} from "../../../data/models/user/PostCureFormModel";
import {
  createPostCureFormApi,
  fetchPostCureFormDetailsApi,
  fetchPostCureIngredientsApi,
  updatePostCureFormApi,
} from "../../../data/api/users/manufacturing/postCureFormApi";
import type { PostCureIngredientsApiResponse } from "../../../data/models/user/postCureIngredientRecipes";

export type PostCureCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
} & PostCureFormBody;

export type PostCureUpdatePayload = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
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

  fetchIngredients: async (recipeType: string) => {
    try {
      const response = await fetchPostCureIngredientsApi({ recipeType });
      return new ApiResponseModel<PostCureIngredientsApiResponse>(response, (res) => {
        const data = (res as { data?: PostCureIngredientsApiResponse })?.data ?? res;
        return data as PostCureIngredientsApiResponse;
      });
    } catch (error) {
      console.error("Failed to fetch post-cure ingredients:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default postCureController;

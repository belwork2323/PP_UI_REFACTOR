import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  DispatchDetailsModel,
  DispatchSubmitResponseModel,
} from "../../../data/models/user/DispatchApiModel";
import {
  createDispatchFormApi,
  fetchDispatchFormDetailsApi,
  updateDispatchFormApi,
} from "../../../data/api/users/dispatch/dispatchAPI";

// Fully aligned with the backend's explicit JSON schema structure
export type BackendMotorDispatchDetails = {
  projectName: string;
  stage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: {
    accorded: string;
    momNo?: string;
  };
  finalAcceptanceCommitteeClearance: {
    accorded: string;
    momNo?: string;
  };
  propellantProperties: any[];
  waiverDetails: {
    available: boolean;
    details: string;
    uploadedDocuments: string[];
  };
  rocketMotorInspection: any[];
  vehicleDetails: any[];
  rocketMotorPackingDetails: any[];
  uploadDispatchPhotos: string[];
  safetyClearance: {
    accorded: string;
    clearanceCertificate: string;
  };
  dispatchTeam: {
    qaRepresentative: string;
    safetyRepresentative: string;
    projectRepresentative: string;
  };
};

export type BackendMotorPayload = {
  motorId: string;
  dispatchDetails: BackendMotorDispatchDetails;
};

// Main Controller Interface Payloads
export type DispatchCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: BackendMotorPayload[];
};

export type DispatchUpdatePayload = {
  formId: string; // Used to identify the target document route
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  motors: BackendMotorPayload[];
};

export type DispatchDetailsPayload = {
  formId: string;
  // subDepartmentId: number;
};

export const dispatchController = {
  createForm: async (payload: DispatchCreatePayload) => {
    try {
      const response = await createDispatchFormApi(payload);
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to create Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: DispatchDetailsPayload) => {
    try {
      const response = await fetchDispatchFormDetailsApi(payload);
      return new ApiResponseModel<DispatchDetailsModel>(response, (res) =>
        DispatchDetailsModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to fetch Dispatch form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: DispatchUpdatePayload) => {
    try {
      // Stripping formId wrapper if your direct API endpoint expects only the body layout
      const { formId, ...bodyPayload } = payload;
      
      // Pass standard body layout down to your endpoint instance wrapper
      const response = await updateDispatchFormApi({ formId, ...bodyPayload });
      return new ApiResponseModel<DispatchSubmitResponseModel>(response, (res) =>
        DispatchSubmitResponseModel.fromApi(res),
      );
    } catch (error) {
      console.error("Failed to update Dispatch form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default dispatchController;
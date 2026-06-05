import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import {
  CastingCuringDetailsModel,
  CastingCuringSubmitResponseModel,
} from "../../../data/models/user/CastingCuringFormModel";
import {
  createCastingCuringFormApi,
  fetchCastingCuringFormDetailsApi,
  updateCastingCuringFormApi,
} from "../../../data/api/users/manufacturing/castingCuringFormApi";

type Pair = { m1: string; m2: string };

export type CastingCuringCreatePayload = {
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "SUBMIT";
  bowlDetails: {
    motorIds: Pair;
    rows: Array<{
      bowlNo: string;
      propellantQty: string;
      viscosity: string;
      viscosityTemp: string;
      arrivalTime: string;
      slurry: Pair;
    }>;
  };
  castingDetails: {
    motorIds: Pair;
    vacuumBuildUp: Pair;
    startCasting: Pair;
    vacuumCheckIntervals: Array<{ label: string; m1: string; m2: string }>;
    castingDuration: { parameter: string; m1: string; m2: string };
    loadCellReading: { initial: Pair; final: Pair };
    totalWeight: { parameter: string; m1: string; m2: string };
  };
  curingDetails: {
    motorIds: Pair;
    achievingDesiredTemp: Pair;
    curingCycleFollow: Pair;
    soaking: Pair;
    hardness: Pair;
  };
};

export type CastingCuringUpdatePayload = {
  formId: string;
  subDepartmentId: number;
  formSubmissionType: "DRAFT" | "UPDATE";
  bowlDetails: CastingCuringCreatePayload["bowlDetails"];
  castingDetails: CastingCuringCreatePayload["castingDetails"];
  curingDetails: CastingCuringCreatePayload["curingDetails"];
};

export type CastingCuringDetailsPayload = {
  formId: string;
  subDepartmentId: number;
};

export const castingCuringController = {
  createForm: async (payload: CastingCuringCreatePayload) => {
    try {
      const response = await createCastingCuringFormApi(payload);
      return new ApiResponseModel<CastingCuringSubmitResponseModel>(response, (res) =>
        CastingCuringSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to create casting and curing form:", error);
      return new ApiResponseModel(error);
    }
  },

  fetchFormDetails: async (payload: CastingCuringDetailsPayload) => {
    try {
      const response = await fetchCastingCuringFormDetailsApi(payload);
      return new ApiResponseModel(response, (res) => CastingCuringDetailsModel.fromApi(res));
    } catch (error) {
      console.error("Failed to fetch casting and curing form details:", error);
      return new ApiResponseModel(error);
    }
  },

  updateForm: async (payload: CastingCuringUpdatePayload) => {
    try {
      const response = await updateCastingCuringFormApi(payload);
      return new ApiResponseModel<CastingCuringSubmitResponseModel>(response, (res) =>
        CastingCuringSubmitResponseModel.fromApi(res)
      );
    } catch (error) {
      console.error("Failed to update casting and curing form:", error);
      return new ApiResponseModel(error);
    }
  },
};

export default castingCuringController;

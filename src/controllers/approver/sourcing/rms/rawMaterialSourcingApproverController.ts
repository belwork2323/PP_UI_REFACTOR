import {
  changeRawMaterialSourcingApproverStatusApi,
  fetchRawMaterialSourcingApproverListApi,
  type RawMaterialSourcingApproverChangeStatusPayload,
  type RawMaterialSourcingApproverListPayload,
} from "@data/api/approver/sourcing/rms/rawMaterialSourcingApproverApi";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import { normalizeListStatusFilter } from "@hooks/operationStatus";
import { RawMaterialSourcingApproverListModel } from "@data/models/approver/sourcing/rms/RawMaterialSourcingApproverModel";

const rawMaterialSourcingApproverController = {
  fetchLotList: async (payload: RawMaterialSourcingApproverListPayload) => {
    try {
      const response = await fetchRawMaterialSourcingApproverListApi({
        ...payload,
        ...(payload.status ? { status: normalizeListStatusFilter(payload.status) } : {}),
      });
      return new ApiResponseModel(response, (res) =>
        RawMaterialSourcingApproverListModel.fromApi(res),
      );
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },

  changeStatus: async (payload: RawMaterialSourcingApproverChangeStatusPayload) => {
    try {
      const response = await changeRawMaterialSourcingApproverStatusApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialSourcingApproverController;

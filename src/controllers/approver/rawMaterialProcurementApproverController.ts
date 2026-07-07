import {
  changeRawMaterialProcurementApproverStatusApi,
  fetchRawMaterialProcurementApproverListApi,
  type RawMaterialProcurementApproverChangeStatusPayload,
  type RawMaterialProcurementApproverListPayload,
} from "../../data/api/approver/rawMaterialProcurementApproverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";
import { normalizeListStatusFilter } from "../../hooks/operationStatus";
import { RawMaterialProcurementApproverListModel } from "../../data/models/approver/RawMaterialProcurementApproverModel";

const rawMaterialProcurementApproverController = {
  fetchLotList: async (payload: RawMaterialProcurementApproverListPayload) => {
    try {
      const response = await fetchRawMaterialProcurementApproverListApi({
        ...payload,
        ...(payload.status ? { status: normalizeListStatusFilter(payload.status) } : {}),
      });
      return new ApiResponseModel(response, (res) =>
        RawMaterialProcurementApproverListModel.fromApi(res),
      );
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },

  changeStatus: async (payload: RawMaterialProcurementApproverChangeStatusPayload) => {
    try {
      const response = await changeRawMaterialProcurementApproverStatusApi(payload);
      return new ApiResponseModel(response);
    } catch (error) {
      return new ApiResponseModel(error);
    }
  },
};

export default rawMaterialProcurementApproverController;

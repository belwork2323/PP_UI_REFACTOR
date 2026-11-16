import {
  fetchRawMaterialSourcingApproverListApi,
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
};

export default rawMaterialSourcingApproverController;

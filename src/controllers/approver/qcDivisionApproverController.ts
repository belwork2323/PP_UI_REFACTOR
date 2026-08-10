import {
  changeQcDivisionApproverUnitStatus,
  fetchQcDivisionCatalogApi,
  type QcDivisionApproverChangeStatusPayload,
  type QcDivisionApproverUnitChangeStatusResponse,
} from "../../data/api/approver/qcDivisionApproverApi";
import {
  changeApproverFormStatus,
  type ApproverChangeStatusPayload,
} from "../../data/api/approver/approverApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

/** Load QC division catalog (ids/names) for resolving change-status divisionId. */
export const fetchQcDivisionApproverCatalog = async () => {
  try {
    const response = await fetchQcDivisionCatalogApi();
    return new ApiResponseModel<unknown>(response, (res) => res?.data ?? res ?? []);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

/** Approve/reject a QC division unit (premix, final mix, motor) or division-level workflow. */
export const submitQcDivisionApproverUnitStatusChange = async (
  payload: QcDivisionApproverChangeStatusPayload,
) => {
  try {
    const response = await changeQcDivisionApproverUnitStatus(payload);
    return new ApiResponseModel<QcDivisionApproverUnitChangeStatusResponse>(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

/** Final form-level approve/reject (entire QC form). */
export const submitQcDivisionApproverFormStatusChange = async (
  payload: ApproverChangeStatusPayload,
) => {
  try {
    const response = await changeApproverFormStatus(payload);
    return new ApiResponseModel(response);
  } catch (error) {
    return new ApiResponseModel(error);
  }
};

export default {
  fetchDivisionCatalog: fetchQcDivisionApproverCatalog,
  submitUnitStatusChange: submitQcDivisionApproverUnitStatusChange,
  submitFormStatusChange: submitQcDivisionApproverFormStatusChange,
  // Back-compat aliases
  submitMotorStatusChange: submitQcDivisionApproverUnitStatusChange,
  submitPremixStatusChange: submitQcDivisionApproverUnitStatusChange,
  submitDivisionStatusChange: submitQcDivisionApproverUnitStatusChange,
};

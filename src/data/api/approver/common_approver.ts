import { USER_MANUFACTURING_APPROVER } from "../endPoints";
import { get, post } from "../httpClient";


export const fetchSolidApprovalList = () => get(USER_MANUFACTURING_APPROVER.APPROVER.SOLID_PREP_LIST);

export const fetchCasePrepApprovalList = () => get(USER_MANUFACTURING_APPROVER.APPROVER.CASE_PREP_LIST);

export const fetchMixingApprovalList = () => get(USER_MANUFACTURING_APPROVER.APPROVER.MIXING_DATA_LIST);

export const fetchCastingCuringApprovalList = () => get(USER_MANUFACTURING_APPROVER.APPROVER.CASTING_CURING_LIST);

export const fetchPostCureApprovalList = () => get(USER_MANUFACTURING_APPROVER.APPROVER.POST_CURE_LIST);

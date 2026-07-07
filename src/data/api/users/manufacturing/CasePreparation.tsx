import { USER_MANUFACTURING } from "../../endPoints";
import { get, post } from "../../httpClient";

export const fetchAllCasePrep = () =>
  get(USER_MANUFACTURING.CASEPREPARATION.CASE_PREP_ALL);
export const fetchAllCasePrepSolidApproved = () =>
  get(USER_MANUFACTURING.CASEPREPARATION.FETCH_SOLID_APPROVED);
export const SubmitCasePrep = (payload) =>
  post(USER_MANUFACTURING.CASEPREPARATION.SUBMIT_CASE_PREP, payload);

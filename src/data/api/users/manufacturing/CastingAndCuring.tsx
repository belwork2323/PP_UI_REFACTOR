import { USER_MANUFACTURING } from "../endPoints";
import { get, post } from "../httpClient";

export const fetchAllCasting = () =>
  get(USER_MANUFACTURING.CASEPREPARATION.CASE_PREP_ALL);
export const fetchAllCastingApproved = () =>
  get(USER_MANUFACTURING.CASTING.FETCH_APPROVED);
export const SubmitCastingPrep = (payload) =>
  post(USER_MANUFACTURING.CASTING.SUBMIT, { payload });

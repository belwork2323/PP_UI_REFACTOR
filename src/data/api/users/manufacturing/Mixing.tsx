import { USER_MANUFACTURING } from "../endPoints";
import { get } from "../httpClient";

export const fetchAllMixing = () => get(USER_MANUFACTURING.CASEPREPARATION.CASE_PREP_ALL);
export const fetchAllMixingApproved = () =>
  get(USER_MANUFACTURING.MIXING.FETCH_APPROVED);

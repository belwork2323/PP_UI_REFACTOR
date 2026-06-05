import { USER_MANUFACTURING } from "../endPoints";
import { get, post } from "../httpClient";

export const fetchAllPostCure = () => get(USER_MANUFACTURING.POST_CURE.LIST);
export const fetchAllPostCureApproved = () =>
  get(USER_MANUFACTURING.POST_CURE.FETCH_APPROVED);
export const SubmitPostCure = (payload) =>
  post(USER_MANUFACTURING.POST_CURE.SUBMIT, { payload });

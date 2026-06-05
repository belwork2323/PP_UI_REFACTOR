import {
  fetchSolidApprovalList,
  fetchCasePrepApprovalList,
  fetchMixingApprovalList,
  fetchCastingCuringApprovalList,
  fetchPostCureApprovalList,
} from "../../data/api/approver_manufacturing/common_approver";
import { useAlertStore } from "../../app/store/alertStore";

export const manufactureApproverController = {
  getAllApprovals: async () => {
    const showAlert = useAlertStore.getState().showAlert;

    try {
      const [
        solidList,
        casePrepList,
        mixingList,
        castingCuringList,
        postCureList,
      ] = await Promise.all([
        fetchSolidApprovalList(),
        fetchCasePrepApprovalList(),
        fetchMixingApprovalList(),
        fetchCastingCuringApprovalList(),
        fetchPostCureApprovalList(),
      ]);

      // Map each list with its type
      const formattedSolid = (solidList || []).map((item) => ({
        ...item,
        materialType: "Solid Preparation",
        type: 1,
      }));

      const formattedCasePrep = (casePrepList || []).map((item) => ({
        ...item,
        materialType: "Case Preparation",
        type: 3,
      }));

      const formattedMixing = (mixingList || []).map((item) => ({
        ...item,
        materialType: "Mixing Data",
        type: 4,
      }));

      const formattedCasting = (castingCuringList || []).map((item) => ({
        ...item,
        materialType: "Casting And Curing",
        type: 5,
      }));

      const formattedPostCure = (postCureList || []).map((item) => ({
        ...item,
        materialType: "Postcure Operation",
        type: 6,
      }));

      return [
        ...formattedSolid,
        ...formattedCasePrep,
        ...formattedMixing,
        ...formattedCasting,
        ...formattedPostCure,
      ];
    } catch (error) {
      showAlert("Failed to fetch manufacturing approval lists", "error");
      return [];
    }
  },
};
import React from "react";
import { useParams } from "react-router-dom";

import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import ApproverDashboardShell from "../../../components/custom/ApproverDashboardShell";
import RawMaterialPreparationApproverPage from "./RawMaterialPreparationApproverPage";
import CasePreparationApproverPage from "./CasePreparationApproverPage";
import CastingCuringApproverPage from "./CastingAndCuringApproverPage";
import PostCureApproverPage from "./PostCureApproverPage";
import SubscaleApproverPage from "./SubscaleApproverPage";
import TrimmingApproverPage from "./TrimmingApproverPage";
import MixingApproverPage from "./MixingApproverPage";

const {
  precisionManufacturing: PrecisionManufacturingRoundedIcon,
  science: ScienceRoundedIcon,
  layers: LayersRoundedIcon,
  blender: BlenderRoundedIcon,
  localFireDepartment: LocalFireDepartmentRoundedIcon,
  build: BuildRoundedIcon,
  scale: ScaleRoundedIcon,
  straighten: StraightenRoundedIcon,
} = icons.approver.manufacturing.dashboard;

const S = STRINGS.APPROVER.DASHBOARD.MANUFACTURING;

const SUB_DEPARTMENTS = [
  {
    key: "raw-material-prep",
    label: S.RAW_MATERIAL_LABEL,
    sectionLabel: S.RAW_MATERIAL_SECTION,
    icon: BuildRoundedIcon,
    color: "#117A65",
    description: S.RAW_MATERIAL_DESCRIPTION,
  },
  {
    key: "case-preparation",
    label: S.CASE_PREP_LABEL,
    sectionLabel: S.CASE_PREP_SECTION,
    icon: LayersRoundedIcon,
    color: "#1A5276",
    description: S.CASE_PREP_DESCRIPTION,
  },
  {
    key: "mixing",
    label: S.MIXING_LABEL,
    sectionLabel: S.MIXING_SECTION,
    icon: BlenderRoundedIcon,
    color: "#6C3483",
    description: S.MIXING_DESCRIPTION,
  },
  {
    key: "casting-and-curing",
    label: S.CASTING_LABEL,
    sectionLabel: S.CASTING_SECTION,
    icon: LocalFireDepartmentRoundedIcon,
    color: "#B7770D",
    description: S.CASTING_DESCRIPTION,
  },
  {
    key: "post-cure-operations",
    label: S.POST_CURE_LABEL,
    sectionLabel: S.POST_CURE_SECTION,
    icon: ScienceRoundedIcon,
    color: "#922B21",
    description: S.POST_CURE_DESCRIPTION,
  },
  {
    key: "subscale",
    label: S.SUBSCALE_LABEL,
    sectionLabel: S.SUBSCALE_SECTION,
    icon: ScaleRoundedIcon,
    color: "#117A65",
    description: S.SUBSCALE_DESCRIPTION,
  },
  {
    key: "trimming",
    label: S.TRIMMING_LABEL,
    sectionLabel: S.TRIMMING_SECTION,
    icon: StraightenRoundedIcon,
    color: "#6A1B9A",
    description: S.TRIMMING_DESCRIPTION,
  },
];
const ManufacturingApproverDashboard = () => {
  const { subDept } = useParams();

  return (
    <ApproverDashboardShell
      department="manufacturing"
      departmentName={S.DEPARTMENT_NAME}
      emptyIcon={PrecisionManufacturingRoundedIcon}
      routeBase="/approver/manufacturing"
      sectionTitle={STRINGS.APPROVER.DASHBOARD.SECTION_TITLE}
      subDepartment={subDept}
      subDepartments={SUB_DEPARTMENTS}
      renderSubPage={(value) => {
        switch (value) {
          case "raw-material-prep":
            return <RawMaterialPreparationApproverPage />;
          case "case-preparation":
            return <CasePreparationApproverPage />;
          case "mixing":
            return <MixingApproverPage />;
          case "casting-and-curing":
            return <CastingCuringApproverPage />;
          case "post-cure-operations":
            return <PostCureApproverPage />;
          case "subscale":
            return <SubscaleApproverPage />;
          case "trimming":
            return <TrimmingApproverPage />;
          default:
            return null;
        }
      }}
    />
  );
};

export default ManufacturingApproverDashboard;

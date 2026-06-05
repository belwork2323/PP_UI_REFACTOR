import React from "react";
import { useParams } from "react-router-dom";

import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import ApproverDashboardShell from "../../../components/custom/ApproverDashboardShell";
import RawMaterialRevalidationApproverPage from "./RawMaterialRevalidationApproverPage";
import QCDivisionApproverPage from "./QCDivisionApproverPage";
import NDTApproverPage from "./NDTApproverPage";
import STFApproverPage from "./StaticTestFacilityApproverPage";

const {
  science: ScienceRoundedIcon,
  verified: VerifiedRoundedIcon,
  medicalServices: MedicalServicesRoundedIcon,
  speed: SpeedRoundedIcon,
  radar: RadarRoundedIcon,
} = icons.approver.qualityControl.dashboard;

const S = STRINGS.APPROVER.DASHBOARD.QUALITY_CONTROL;

const SUB_DEPARTMENTS = [
  {
    key: "raw-material-revalidation",
    label: S.RAW_MATERIAL_LABEL,
    sectionLabel: S.RAW_MATERIAL_SECTION,
    icon: VerifiedRoundedIcon,
    color: "#117A65",
    description: S.RAW_MATERIAL_DESCRIPTION,
    pending:  2,
    approved: 1,
    rejected: 1,
  },
  {
    key: "qc-division",
    label: S.QC_DIVISION_LABEL,
    sectionLabel: S.QC_DIVISION_SECTION,
    icon: MedicalServicesRoundedIcon,
    color: "#1A5276",
    description: S.QC_DIVISION_DESCRIPTION,
    pending:  3,
    approved: 7,
    rejected: 0,
  },
  {
    key: "ndt",
    label: S.NDT_LABEL,
    sectionLabel: S.NDT_SECTION,
    icon: RadarRoundedIcon,
    color: "#6C3483",
    description: S.NDT_DESCRIPTION,
    pending:  1,
    approved: 4,
    rejected: 2,
  },
  {
    key: "static-test-facility",
    label: S.STF_LABEL,
    sectionLabel: S.STF_SECTION,
    icon: SpeedRoundedIcon,
    color: "#922B21",
    description: S.STF_DESCRIPTION,
    pending:  0,
    approved: 5,
    rejected: 1,
  },
];
const QualityControlApproverDashboard = () => {
  const { subDept } = useParams();

  return (
    <ApproverDashboardShell
      department="qualityControl"
      departmentName={S.DEPARTMENT_NAME}
      emptyIcon={ScienceRoundedIcon}
      routeBase="/approver/quality-control"
      sectionTitle={STRINGS.APPROVER.DASHBOARD.SECTION_TITLE}
      subDepartment={subDept}
      subDepartments={SUB_DEPARTMENTS}
      renderSubPage={(value) => {
        switch (value) {
          case "raw-material-revalidation":
            return <RawMaterialRevalidationApproverPage />;
          case "qc-division":
            return <QCDivisionApproverPage />;
          case "ndt":
            return <NDTApproverPage />;
          case "static-test-facility":
            return <STFApproverPage />;
          default:
            return null;
        }
      }}
    />
  );
};

export default QualityControlApproverDashboard;
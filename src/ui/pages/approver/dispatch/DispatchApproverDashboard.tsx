import React from "react";
import { useParams } from "react-router-dom";

import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import ApproverDashboardShell from "../../../components/custom/ApproverDashboardShell";

import DispatchApproverPage from "./DispatchApproverPage";

const {
  localShipping: LocalShippingRoundedIcon,
} = icons.approver.dispatch.dashboard;

const S = STRINGS.APPROVER.DASHBOARD.DISPATCH;

const SUB_DEPARTMENTS = [
  {
    key: "dispatch",
    label: S.LABEL,
    sectionLabel: S.SECTION,
    icon: LocalShippingRoundedIcon,
    color: "#A04000",
    description: S.DESCRIPTION,
    pending: 1,
    approved: 1,
    rejected: 1,
  },
];
const DispatchApproverDashboard = () => {
  const { subDept } = useParams();

  return (
    <ApproverDashboardShell
      department="dispatch"
      departmentName={S.DEPARTMENT_NAME}
      emptyIcon={LocalShippingRoundedIcon}
      routeBase="/approver/dispatch"
      sectionTitle={STRINGS.APPROVER.DASHBOARD.SECTION_TITLE}
      subDepartment={subDept}
      subDepartments={SUB_DEPARTMENTS}
      renderSubPage={(value) => (value === "dispatch" ? <DispatchApproverPage /> : null)}
    />
  );
};

export default DispatchApproverDashboard;
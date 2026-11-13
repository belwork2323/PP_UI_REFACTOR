import useSourcingDepartmentHeaderHook from "@hooks/user/sourcing/shared/useSourcingDepartmentHeaderHook";
import useUserDepartmentHeaderHook from "@hooks/user/useUserDepartmentHeaderHook";

const useSourcingHeader = (_dept: string, subDept?: string) =>
  useSourcingDepartmentHeaderHook(subDept ?? "");

const useSubDepartmentHeader = (dept: string, subDept?: string) =>
  useUserDepartmentHeaderHook({ deptSlug: dept, subDeptSlug: subDept });

/** `dept` must stay fixed for the lifetime of the calling component (remount with `key={dept}`). */
export const useDepartmentHeader = (dept: string, subDept?: string) => {
  const useHeader = dept === "sourcing" ? useSourcingHeader : useSubDepartmentHeader;
  return useHeader(dept, subDept);
};

export default useDepartmentHeader;

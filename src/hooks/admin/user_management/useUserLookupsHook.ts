import { useState, useCallback, useEffect } from "react";
import { generalController } from "../../../controllers/admin/common/generalController";
import { STRINGS } from "../../../app/config/strings";

export const useUserLookups = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [allSubDepts, setAllSubDepts] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  const loadLookups = useCallback(async () => {
    try {
      const [d, s, r] = await Promise.all([
        generalController.getDepartments(),
        generalController.getSubDepartments(),
        generalController.getRoles(),
      ]);
      setDepartments(d?.data || []);
      setAllSubDepts(s?.data || []);
      setRoles(r?.data || []);
    } catch (err) {
      console.error(STRINGS.USER_MANAGEMENT.ERRORS.LOAD_LOOKUPS_FAILED, err);
    }
  }, []);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName);
  const roleNames = roles.map((r: any) => r.roleName);

  return { departments, allSubDepts, roles, deptNames, roleNames };
};

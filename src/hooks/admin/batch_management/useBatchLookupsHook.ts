import { useState, useCallback, useEffect } from "react";
import { generalController } from "../../../controllers/admin/common/generalController";
import { userManagementController } from "../../../controllers/admin/user_management/userManagementController";
import { projectManagementController } from "../../../controllers/admin/project_management/projectManagementController";
import { operationsController } from "../../../controllers/user/operationsController";
import { STRINGS } from "../../../app/config/strings";

const S = STRINGS.BATCH_MANAGEMENT;

export const useBatchLookups = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [subDepts, setSubDepts]       = useState<any[]>([]);
  const [users, setUsers]             = useState<any[]>([]);
  const [projects, setProjects]         = useState<any[]>([]);
  const [motorStages, setMotorStages]   = useState<any[]>([]);
  const [availableMotors, setAvailableMotors] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [availableMotorsLoading, setAvailableMotorsLoading] = useState(false);

  const loadLookups = useCallback(async () => {
    setLoading(true);
    try {
      const [deptResp, subDeptResp, userResp, projectResp, motorStageResp] =
        await Promise.all([
        generalController.getDepartments(),
        generalController.getSubDepartments(),
        userManagementController.getAllUsers({
          search: "",
          role: "System Manager",
          department: "All",
          status: "Active",
          page: 1,
          pageSize: 1000,
        }),
        projectManagementController.getAllProjects({
          page: 1,
          limit: 1000,
          sortBy: "createdOn",
          sortOrder: "desc",
        }),
        operationsController.fetchMotorsStageList(),
      ]);

      setDepartments(deptResp?.data || []);
      setSubDepts(subDeptResp?.data || []);

      if (userResp?.success && userResp.data) {
        const rawUsers = Array.isArray(userResp.data)
          ? userResp.data
          : (userResp.data as any).users || [];
        setUsers(rawUsers);
      } else {
        setUsers([]);
      }

      if (projectResp?.success && projectResp.data) {
        setProjects(projectResp.data.projects ?? []);
      } else {
        setProjects([]);
      }

      if (motorStageResp?.success && motorStageResp.data) {
        setMotorStages(motorStageResp.data.stages ?? []);
      } else {
        setMotorStages([]);
      }
    } catch (err) {
      console.error(S.ERRORS.LOAD_LOOKUPS_FAILED, err);
      setProjects([]);
      setMotorStages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchApprovedMotors = useCallback(async (projectId: string, motorStage: string) => {
    const pid = String(projectId ?? "").trim();
    const stage = String(motorStage ?? "").trim();
    if (!pid || !stage) {
      setAvailableMotors([]);
      return;
    }

    setAvailableMotorsLoading(true);
    try {
      const resp = await operationsController.fetchApprovedMotorsList({
        projectId: pid,
        motorStage: stage,
      });

      if (resp?.success && resp.data) {
        setAvailableMotors(resp.data.motors ?? []);
      } else {
        setAvailableMotors([]);
      }
    } catch (err) {
      console.error("Failed to fetch approved motors:", err);
      setAvailableMotors([]);
    } finally {
      setAvailableMotorsLoading(false);
    }
  }, []);

  const clearApprovedMotors = useCallback(() => {
    setAvailableMotors([]);
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const deptNames = departments.map((d: any) => d.departmentName || d.name).filter(Boolean);

  const userOptions = users.map((u: any) => ({
    id:       u.userId || u.userUUID || u.id,
    userUUID: u.userUUID || u.id || "",
    fullName: u.username || u.fullName || u.name,
    name:     u.username || u.fullName || u.name || "",
    username: u.username,
  }));

  const projectOptions = projects.map((p: any) => ({
    projectId: p.projectId ?? "",
    projectName: p.projectName ?? p.projectId ?? "",
  }));

  const motorStageOptions = motorStages.map((stage: any) => ({
    motorStage: stage.motorStage ?? "",
    noOfmotors: stage.noOfmotors ?? 0,
    motorTypeId: stage.motorTypeId ?? 0,
  }));

  const availableMotorOptions = availableMotors.map((motor: any) => ({
    motorCasingId: motor.motorCasingId ?? "",
    motorId: motor.motorId ?? motor.motorNo ?? "",
    motorStage: motor.motorStage ?? "",
    motorNo: motor.motorNo ?? motor.motorId ?? "",
    projectId: motor.projectId ?? "",
    status: motor.status ?? "",
  }));

  return {
    departments,
    subDepts,
    users,
    projects,
    motorStages,
    userOptions,
    projectOptions,
    motorStageOptions,
    availableMotorOptions,
    availableMotorsLoading,
    fetchApprovedMotors,
    clearApprovedMotors,
    deptNames,
    loading,
    loadLookups,
  };
};

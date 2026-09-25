import { useEffect, useState } from "react";
import { projectManagementController } from "@/controllers/admin/ProjectManagement/projectManagementController";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

export type MasterDataProjectOption = {
  projectId: string;
  projectName: string;
};

export default function useProjectForMotorStageOptions(enabled: boolean) {
  const [projects, setProjects] = useState<MasterDataProjectOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setProjects([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    projectManagementController
      .getAllProjects({
        page: 1,
        limit: 1000,
        sortBy: "createdOn",
        sortOrder: "desc",
      })
      .then((res) => {
        if (cancelled) return;
        const responseData = res?.data?.data ? res.data.data : res?.data;
        const projectList = responseData?.projects || [];

        setProjects(
          projectList.map((item: { projectId?: string; projectName?: string }) => ({
            projectId: item.projectId ?? "",
            projectName: item.projectName || item.projectId || "",
          })),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const options: AppDropdownOption[] = projects.map((p) => ({
    value: p.projectId,
    label: p.projectName || p.projectId,
  }));

  return { projects, options, loading };
}

export class ProjectListItemModel {
  projectId: string = "";
  projectName: string = "";
  projectDescription: string = "";
  projectDate: string = "";
  createdOn: string = "";

  static fromApi(data: any): ProjectListItemModel {
    const item = new ProjectListItemModel();
    item.projectId = data?.projectId || "";
    item.projectName = data?.projectName || "";
    item.projectDescription = data?.projectDescription || "";
    item.projectDate = data?.projectDate || "";
    item.createdOn = data?.createdOn || "";
    return item;
  }
}

export class ProjectStatsModel {
  totalProjects: number = 0;
  projectsCreatedToday: number = 0;
  projectsCreatedThisMonth: number = 0;
  activeProjects: number = 0;
  idleProjects: number = 0;

  static fromApi(data: any): ProjectStatsModel {
    const stats = new ProjectStatsModel();
    stats.totalProjects = data?.totalProjects || 0;
    stats.projectsCreatedToday = data?.projectsCreatedToday || 0;
    stats.projectsCreatedThisMonth = data?.projectsCreatedThisMonth || 0;
    stats.activeProjects = data?.activeProjects || 0;
    stats.idleProjects = data?.idleProjects || 0;
    return stats;
  }
}

export class CreateProjectPayload {
  projectName: string = "";
  projectDescription: string = "";
}

export class UpdateProjectPayload extends CreateProjectPayload {
  projectId: string = "";
}

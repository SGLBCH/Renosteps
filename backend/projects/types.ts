export interface Project {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface UpdateProjectRequest {
  name?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ProjectsResponse {
  projects: Project[];
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateTaskRequest {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ListTasksResponse {
  tasks: Task[];
}

export interface GetTaskParams {
  id: string;
}

export interface DeleteTaskParams {
  id: string;
}

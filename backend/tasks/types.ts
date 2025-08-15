export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
  subtasks?: Subtask[];
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
  projectId?: string;
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
  projectId?: string;
}

export interface CreateSubtaskRequest {
  taskId: string;
  title: string;
  projectId?: string;
}

export interface UpdateSubtaskRequest {
  id: string;
  title?: string;
  completed?: boolean;
  projectId?: string;
}

export interface ListTasksRequest {
  projectId?: string;
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

export interface GetSubtaskParams {
  id: string;
}

export interface DeleteSubtaskParams {
  id: string;
}

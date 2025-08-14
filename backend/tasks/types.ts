export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'completed' | 'in-progress' | 'not-started';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
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

export interface CreateSubtaskRequest {
  taskId: string;
  title: string;
}

export interface UpdateSubtaskRequest {
  id: string;
  title?: string;
  completed?: boolean;
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

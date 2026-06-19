export enum ETaskStatus {
  PENDING = "pending",
  DONE = "done",
}

export interface Task {
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  status: ETaskStatus;
  dueDate: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskPublic extends Task {
  id: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assignedTo: string;
  dueDate?: string;
}

export interface CreateTaskResult {
  taskId: string;
  task: TaskPublic;
}

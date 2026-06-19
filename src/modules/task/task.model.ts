export enum ETaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  DONE = "done",
}

export enum ETaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface Task {
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  status: ETaskStatus;
  priority: ETaskPriority;
  dueDate: Date | null;
  startedAt?: Date | null;
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
  priority?: ETaskPriority;
}

export interface CreateTaskResult {
  taskId: string;
  task: TaskPublic;
}


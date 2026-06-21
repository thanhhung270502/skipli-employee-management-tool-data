import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../common/services/firebase";
import { AppError } from "../../common/errors/app-error";
import type {
  PageableResponse,
  PaginationQueryParams,
} from "../../common/types/pagination";
import { paginateFirestoreQuery } from "../../common/utils/firestore-pagination.util";
import {
  ETaskStatus,
  ETaskPriority,
  type CreateTaskRequest,
  type CreateTaskResult,
  type TaskPublic,
} from "./task.model";

export interface ListTasksOptions {
  pagination?: PaginationQueryParams | null;
  status?: ETaskStatus;
}

const mapTaskDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot): TaskPublic =>
  ({ id: doc.id, ...doc.data() } as TaskPublic);

const buildTasksQuery = (
  db: FirebaseFirestore.Firestore,
  employeeId?: string,
  status?: ETaskStatus
) => {
  let query: FirebaseFirestore.Query = db.collection("tasks");

  if (employeeId) {
    query = query.where("assignedTo", "==", employeeId);
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  return query.orderBy("createdAt", "desc");
};

export const createTask = async (
  data: CreateTaskRequest
): Promise<CreateTaskResult> => {
  const { title, description, assignedTo, dueDate, priority } = data;
  const db = getDb();
  const empDoc = await db.collection("employees").doc(assignedTo).get();

  if (!empDoc.exists) {
    throw new AppError("Assigned employee not found", 404);
  }

  const taskId = uuidv4();
  const task = {
    title,
    description: description ?? "",
    assignedTo,
    assignedToName: empDoc.data()!.name as string,
    status: ETaskStatus.PENDING,
    priority: priority ?? ETaskPriority.MEDIUM,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("tasks").doc(taskId).set(task);

  return { taskId, task: { id: taskId, ...task } };
};

export const listAllTasks = async (
  options: ListTasksOptions = {}
): Promise<PageableResponse<TaskPublic>> => {
  const db = getDb();
  const query = buildTasksQuery(db, undefined, options.status);

  if (!options.pagination) {
    const snapshot = await query.get();
    const data = snapshot.docs.map(mapTaskDoc);
    return { total_record: data.length, data };
  }

  return paginateFirestoreQuery(query, options.pagination, mapTaskDoc);
};

export const listMyTasks = async (
  employeeId: string,
  options: ListTasksOptions = {}
): Promise<PageableResponse<TaskPublic>> => {
  const db = getDb();
  const query = buildTasksQuery(db, employeeId, options.status);

  if (!options.pagination) {
    const snapshot = await query.get();
    const data = snapshot.docs.map(mapTaskDoc);
    return { total_record: data.length, data };
  }

  return paginateFirestoreQuery(query, options.pagination, mapTaskDoc);
};

export const markTaskInProgress = async (
  taskId: string,
  employeeId: string
): Promise<TaskPublic> => {
  const db = getDb();
  const taskDocRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const task = taskDoc.data()!;
  if (task.assignedTo !== employeeId) {
    throw new AppError("This task is not assigned to you", 403);
  }

  const updates = {
    status: ETaskStatus.IN_PROGRESS,
    startedAt: new Date(),
    completedAt: null,
    updatedAt: new Date(),
  };

  await taskDocRef.update(updates);
  return { id: taskId, ...task, ...updates } as TaskPublic;
};

export const markTaskPending = async (
  taskId: string,
  employeeId: string
): Promise<TaskPublic> => {
  const db = getDb();
  const taskDocRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const task = taskDoc.data()!;
  if (task.assignedTo !== employeeId) {
    throw new AppError("This task is not assigned to you", 403);
  }

  const updates = {
    status: ETaskStatus.PENDING,
    startedAt: null,
    completedAt: null,
    updatedAt: new Date(),
  };

  await taskDocRef.update(updates);
  return { id: taskId, ...task, ...updates } as TaskPublic;
};

export const markTaskDone = async (
  taskId: string,
  employeeId: string
): Promise<TaskPublic> => {
  const db = getDb();
  const taskDocRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const task = taskDoc.data()!;
  if (task.assignedTo !== employeeId) {
    throw new AppError("This task is not assigned to you", 403);
  }

  const updates = {
    status: ETaskStatus.DONE,
    completedAt: new Date(),
    updatedAt: new Date(),
  };

  await taskDocRef.update(updates);
  return { id: taskId, ...task, ...updates } as TaskPublic;
};

export const updateTask = async (
  taskId: string,
  updateData: Partial<CreateTaskRequest> & { status?: ETaskStatus }
): Promise<TaskPublic> => {
  const db = getDb();
  const taskDocRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const updates: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updateData.title !== undefined) updates.title = updateData.title;
  if (updateData.description !== undefined) updates.description = updateData.description;
  if (updateData.priority !== undefined) updates.priority = updateData.priority;
  if (updateData.status !== undefined) {
    updates.status = updateData.status;
    if (updateData.status === ETaskStatus.DONE) {
      updates.completedAt = new Date();
    } else if (updateData.status === ETaskStatus.IN_PROGRESS) {
      updates.startedAt = new Date();
    }
  }

  if (updateData.dueDate !== undefined) {
    updates.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
  }

  if (updateData.assignedTo !== undefined) {
    const empDoc = await db.collection("employees").doc(updateData.assignedTo).get();
    if (!empDoc.exists) {
      throw new AppError("Assigned employee not found", 404);
    }
    updates.assignedTo = updateData.assignedTo;
    updates.assignedToName = empDoc.data()!.name as string;
  }

  await taskDocRef.update(updates);

  const updatedTask = (await taskDocRef.get()).data()!;
  return { id: taskId, ...updatedTask } as TaskPublic;
};

export const deleteTask = async (taskId: string): Promise<TaskPublic> => {
  const db = getDb();
  const taskDocRef = db.collection("tasks").doc(taskId);
  const taskDoc = await taskDocRef.get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const taskData = { id: taskId, ...taskDoc.data() } as TaskPublic;
  await taskDocRef.delete();
  return taskData;
};


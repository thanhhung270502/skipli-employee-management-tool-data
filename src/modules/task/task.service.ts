import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../common/services/firebase";
import { AppError } from "../../common/errors/app-error";
import {
  ETaskStatus,
  type CreateTaskRequest,
  type CreateTaskResult,
  type TaskPublic,
} from "./task.model";

export const createTask = async (
  data: CreateTaskRequest
): Promise<CreateTaskResult> => {
  const { title, description, assignedTo, dueDate } = data;
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
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("tasks").doc(taskId).set(task);

  return { taskId, task: { id: taskId, ...task } };
};

export const listAllTasks = async (): Promise<TaskPublic[]> => {
  const db = getDb();
  const snapshot = await db
    .collection("tasks")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as TaskPublic)
  );
};

export const listMyTasks = async (
  employeeId: string
): Promise<TaskPublic[]> => {
  const db = getDb();
  const snapshot = await db
    .collection("tasks")
    .where("assignedTo", "==", employeeId)
    .get();

  const tasks = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as TaskPublic)
  );

  tasks.sort((a, b) => {
    const getMs = (val: any) => {
      if (!val) return 0;
      if (typeof val.toDate === "function") return val.toDate().getTime();
      return new Date(val).getTime() || 0;
    };
    return getMs(b.createdAt) - getMs(a.createdAt);
  });

  return tasks;
};

export const markTaskDone = async (
  taskId: string,
  employeeId: string
): Promise<void> => {
  const db = getDb();
  const taskDoc = await db.collection("tasks").doc(taskId).get();

  if (!taskDoc.exists) {
    throw new AppError("Task not found", 404);
  }

  const task = taskDoc.data()!;
  if (task.assignedTo !== employeeId) {
    throw new AppError("This task is not assigned to you", 403);
  }

  await taskDoc.ref.update({
    status: ETaskStatus.DONE,
    completedAt: new Date(),
    updatedAt: new Date(),
  });
};

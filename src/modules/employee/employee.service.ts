import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../common/services/firebase";
import { sendEmployeeInviteEmail } from "../../common/services/email";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateEmployeeRequest,
  CreateEmployeeResult,
  EmployeePublic,
  UpdateEmployeeRequest,
  UpdateProfileRequest,
} from "./employee.model";

const toPublicEmployee = (
  id: string,
  data: FirebaseFirestore.DocumentData
): EmployeePublic => {
  const { passwordHash, inviteToken, accessCode, ...safe } = data;
  return { id, ...safe } as EmployeePublic;
};

export const listEmployees = async (): Promise<EmployeePublic[]> => {
  const db = getDb();
  const snapshot = await db
    .collection("employees")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => toPublicEmployee(doc.id, doc.data()));
};

export const getEmployee = async (
  employeeId: string
): Promise<EmployeePublic> => {
  const db = getDb();
  const doc = await db.collection("employees").doc(employeeId).get();

  if (!doc.exists) {
    throw new AppError("Employee not found", 404);
  }

  return toPublicEmployee(doc.id, doc.data()!);
};

export const createEmployee = async (
  data: CreateEmployeeRequest
): Promise<CreateEmployeeResult> => {
  const { name, email, department, phone, role } = data;
  const db = getDb();

  const existing = await db
    .collection("employees")
    .where("email", "==", email)
    .get();
  if (!existing.empty) {
    throw new AppError("An employee with this email already exists", 409);
  }

  const employeeId = uuidv4();
  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const employee = {
    name,
    email,
    department,
    phone: phone ?? "",
    role: role ?? "Employee",
    inviteToken,
    inviteExpiry,
    isSetup: false,
    username: null,
    passwordHash: null,
    workSchedule: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("employees").doc(employeeId).set(employee);
  await sendEmployeeInviteEmail({ to: email, name, inviteToken });

  return {
    employeeId,
    ...(process.env.NODE_ENV !== "production" ? {
      inviteToken,
      setupUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/setup-account?token=${inviteToken}`
    } : {})
  };
};

export const updateEmployee = async (
  employeeId: string,
  data: UpdateEmployeeRequest
): Promise<void> => {
  const db = getDb();
  const doc = await db.collection("employees").doc(employeeId).get();

  if (!doc.exists) {
    throw new AppError("Employee not found", 404);
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.department !== undefined) updates.department = data.department;
  if (data.role !== undefined) updates.role = data.role;
  if (data.workSchedule !== undefined) updates.workSchedule = data.workSchedule;

  await db.collection("employees").doc(employeeId).update(updates);
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  const db = getDb();
  const doc = await db.collection("employees").doc(employeeId).get();

  if (!doc.exists) {
    throw new AppError("Employee not found", 404);
  }

  await db.collection("employees").doc(employeeId).delete();
};

export const getProfile = async (
  employeeId: string
): Promise<EmployeePublic> => {
  const db = getDb();
  const doc = await db.collection("employees").doc(employeeId).get();

  if (!doc.exists) {
    throw new AppError("Employee not found", 404);
  }

  return toPublicEmployee(doc.id, doc.data()!);
};

export const updateProfile = async (
  employeeId: string,
  data: UpdateProfileRequest
): Promise<void> => {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name) updates.name = data.name;
  if (data.phone) updates.phone = data.phone;
  if (data.email) updates.email = data.email;

  const db = getDb();
  await db.collection("employees").doc(employeeId).update(updates);
};

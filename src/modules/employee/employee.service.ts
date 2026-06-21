import { v4 as uuidv4 } from "uuid";
import { getDb } from "../../common/services/firebase";
import { sendEmployeeInviteEmail } from "../../common/services/email";
import { AppError } from "../../common/errors/app-error";
import type {
  PageableResponse,
  PaginationQueryParams,
} from "../../common/types/pagination";
import { paginateFirestoreQuery } from "../../common/utils/firestore-pagination.util";
import type {
  CreateEmployeeRequest,
  CreateEmployeeResult,
  EmployeePublic,
  UpdateEmployeeRequest,
  UpdateProfileRequest,
} from "./employee.model";

export interface ListEmployeesOptions {
  pagination?: PaginationQueryParams | null;
  search?: string;
}

const toPublicEmployee = (
  id: string,
  data: FirebaseFirestore.DocumentData
): EmployeePublic => {
  const { passwordHash, inviteToken, accessCode, ...safe } = data;
  return { id, ...safe } as EmployeePublic;
};

const matchesEmployeeSearch = (
  employee: EmployeePublic,
  search: string
): boolean => {
  const term = search.toLowerCase();
  return (
    employee.name.toLowerCase().includes(term) ||
    employee.email.toLowerCase().includes(term) ||
    employee.department.toLowerCase().includes(term)
  );
};

export const listEmployees = async (
  options: ListEmployeesOptions = {}
): Promise<PageableResponse<EmployeePublic>> => {
  const db = getDb();
  const query = db.collection("employees").orderBy("createdAt", "desc");
  const search = options.search?.trim();

  if (search) {
    const snapshot = await query.get();
    const filtered = snapshot.docs
      .map((doc) => toPublicEmployee(doc.id, doc.data()))
      .filter((employee) => matchesEmployeeSearch(employee, search));

    if (!options.pagination) {
      return { total_record: filtered.length, data: filtered };
    }

    const { limit, offset } = options.pagination;
    return {
      total_record: filtered.length,
      data: filtered.slice(offset, offset + limit),
    };
  }

  if (!options.pagination) {
    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) =>
      toPublicEmployee(doc.id, doc.data())
    );
    return { total_record: data.length, data };
  }

  return paginateFirestoreQuery(query, options.pagination, (doc) =>
    toPublicEmployee(doc.id, doc.data())
  );
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
    workSchedule: data.workSchedule ?? null,
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

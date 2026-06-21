export interface WorkSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}

export interface Employee {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  username: string | null;
  passwordHash: string | null;
  inviteToken: string | null;
  inviteExpiry: Date | null;
  isSetup: boolean;
  accessCode?: string;
  accessCodeExpiry?: Date | null;
  workSchedule?: WorkSchedule | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeePublic
  extends Omit<Employee, "passwordHash" | "inviteToken"> {
  id: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  department: string;
  phone?: string;
  role?: string;
  workSchedule?: WorkSchedule | null;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  workSchedule?: WorkSchedule | null;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}

export interface CreateEmployeeResult {
  employeeId: string;
  inviteToken?: string;
  setupUrl?: string;
}

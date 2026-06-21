import bcrypt from "bcryptjs";
import { getDb } from "../../common/services/firebase";
import { sendOtpEmail } from "../../common/services/email";
import { generateToken } from "../../common/middleware/auth";
import {
  generateOtp,
  getOtpExpiry,
  isOtpExpired,
} from "../../common/utils/otp";
import { AppError } from "../../common/errors/app-error";
import type {
  LoginEmailRequest,
  SetupAccountRequest,
  ValidateAccessCodeRequest,
  ValidateAccessCodeResult,
  VerifyInviteResult,
  LoginUsernameRequest,
  LoginUsernameResult,
} from "./employee-auth.model";

export const loginEmail = async (data: LoginEmailRequest): Promise<string> => {
  const { email } = data;
  const db = getDb();
  const snapshot = await db
    .collection("employees")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("No employee found with this email", 404);
  }

  const employeeDoc = snapshot.docs[0];
  const employee = employeeDoc.data();

  if (!employee.isSetup) {
    throw new AppError(
      "Account not set up yet. Please check your invite email.",
      403
    );
  }

  const otp = generateOtp();
  const expiry = getOtpExpiry();

  await employeeDoc.ref.update({ accessCode: otp, accessCodeExpiry: expiry });
  await sendOtpEmail({ to: email, name: employee.name as string, otp });
  return otp;
};

export const validateAccessCode = async (
  data: ValidateAccessCodeRequest
): Promise<ValidateAccessCodeResult> => {
  const { email, accessCode } = data;
  const db = getDb();
  const snapshot = await db
    .collection("employees")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("Employee not found", 404);
  }

  const employeeDoc = snapshot.docs[0];
  const employee = employeeDoc.data();
  const isDevBypass = process.env.NODE_ENV !== "production" && accessCode === "123456";

  if (!isDevBypass) {
    if (!employee.accessCode) {
      throw new AppError("No access code found. Request a new one.", 400);
    }
    if (employee.accessCode !== accessCode) {
      throw new AppError("Invalid access code", 400);
    }
    if (isOtpExpired(employee.accessCodeExpiry)) {
      throw new AppError("Access code expired. Request a new one.", 400);
    }
  }

  await employeeDoc.ref.update({ accessCode: "", accessCodeExpiry: null });

  const token = generateToken({
    employeeId: employeeDoc.id,
    email,
    role: "employee",
  });

  return {
    token,
    role: "employee",
    employee: {
      id: employeeDoc.id,
      name: employee.name as string,
      email: employee.email as string,
      department: employee.department as string,
      role: employee.role as string,
    },
  };
};

export const setupAccount = async (
  data: SetupAccountRequest
): Promise<void> => {
  const { inviteToken, username, password } = data;
  const db = getDb();
  const snapshot = await db
    .collection("employees")
    .where("inviteToken", "==", inviteToken)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("Invalid or expired invite link", 400);
  }

  const employeeDoc = snapshot.docs[0];
  const employee = employeeDoc.data();

  if (isOtpExpired(employee.inviteExpiry)) {
    throw new AppError(
      "Invite link has expired. Please contact your manager.",
      400
    );
  }

  if (employee.isSetup as boolean) {
    throw new AppError("Account already set up. Please log in.", 400);
  }

  const usernameCheck = await db
    .collection("employees")
    .where("username", "==", username)
    .limit(1)
    .get();
  if (!usernameCheck.empty) {
    throw new AppError("Username already taken", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await employeeDoc.ref.update({
    username,
    passwordHash,
    isSetup: true,
    inviteToken: null,
    updatedAt: new Date(),
  });
};

export const verifyInvite = async (
  token: string
): Promise<VerifyInviteResult> => {
  const db = getDb();
  const snapshot = await db
    .collection("employees")
    .where("inviteToken", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("Invalid invite link", 400);
  }

  const employee = snapshot.docs[0].data();

  if (isOtpExpired(employee.inviteExpiry)) {
    throw new AppError("Invite link has expired", 400);
  }

  if (employee.isSetup as boolean) {
    throw new AppError("Account already set up", 400);
  }

  return {
    name: employee.name as string,
    email: employee.email as string,
  };
};

export const loginUsername = async (
  data: LoginUsernameRequest
): Promise<LoginUsernameResult> => {
  const { username, password } = data;
  const db = getDb();

  const snapshot = await db
    .collection("employees")
    .where("username", "==", username)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new AppError("Invalid username or password", 401);
  }

  const employeeDoc = snapshot.docs[0];
  const employee = employeeDoc.data();

  if (!employee.isSetup) {
    throw new AppError("Account not set up yet. Please check your invite email.", 403);
  }

  const isPasswordMatch = await bcrypt.compare(password, employee.passwordHash || "");
  if (!isPasswordMatch) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = generateToken({
    employeeId: employeeDoc.id,
    email: employee.email,
    role: "employee",
  });

  return {
    token,
    role: "employee",
    employee: {
      id: employeeDoc.id,
      name: employee.name as string,
      email: employee.email as string,
      department: employee.department as string,
      role: employee.role as string,
    },
  };
};

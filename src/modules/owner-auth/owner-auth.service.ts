import { getDb } from "../../common/services/firebase";
import { sendOtpSms } from "../../common/services/sms";
import { generateToken } from "../../common/middleware/auth";
import {
  generateOtp,
  getOtpExpiry,
  isOtpExpired,
} from "../../common/utils/otp";
import { AppError } from "../../common/errors/app-error";
import type {
  ValidateAccessCodeRequest,
  ValidateAccessCodeResult,
} from "./owner-auth.model";

export const createAccessCode = async (phoneNumber: string): Promise<void> => {
  const otp = generateOtp();
  const expiry = getOtpExpiry();
  const db = getDb();

  await db
    .collection("owners")
    .doc(phoneNumber)
    .set(
      {
        phoneNumber,
        accessCode: otp,
        accessCodeExpiry: expiry,
        updatedAt: new Date(),
      },
      { merge: true }
    );

  await sendOtpSms(phoneNumber, otp);
};

export const validateAccessCode = async (
  data: ValidateAccessCodeRequest
): Promise<ValidateAccessCodeResult> => {
  const { phoneNumber, accessCode } = data;
  const db = getDb();
  const ownerDoc = await db.collection("owners").doc(phoneNumber).get();

  if (!ownerDoc.exists) {
    throw new AppError("Phone number not found", 404);
  }

  const ownerData = ownerDoc.data()!;
  const isDevBypass = process.env.NODE_ENV !== "production" && accessCode === "123456";

  if (!isDevBypass) {
    if (!ownerData.accessCode) {
      throw new AppError("No access code found. Request a new one.", 400);
    }
    if (ownerData.accessCode !== accessCode) {
      throw new AppError("Invalid access code", 400);
    }
    if (isOtpExpired(ownerData.accessCodeExpiry)) {
      throw new AppError("Access code expired. Request a new one.", 400);
    }
  }

  await db
    .collection("owners")
    .doc(phoneNumber)
    .update({ accessCode: "", accessCodeExpiry: null });

  const token = generateToken({ phoneNumber, role: "owner" });

  return { token, role: "owner", phoneNumber };
};

import { Response, NextFunction } from "express";
import {
  getValidationMessage,
  handleControllerError,
} from "../../common/utils/controller.util";
import {
  validateLoginEmail,
  validateSetupAccount,
  validateValidateAccessCode,
  validateLoginUsername,
} from "./employee-auth.validator";
import * as employeeAuthService from "./employee-auth.service";

export const loginEmail = async (
  req: { body: unknown },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateLoginEmail(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    await employeeAuthService.loginEmail(value);
    res.json({ success: true, message: "Access code sent to your email" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const validateAccessCode = async (
  req: { body: unknown },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateValidateAccessCode(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const result = await employeeAuthService.validateAccessCode(value);
    res.json({ success: true, ...result });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const setupAccount = async (
  req: { body: unknown },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateSetupAccount(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    await employeeAuthService.setupAccount(value);
    res.json({
      success: true,
      message: "Account setup successful. You can now log in.",
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const verifyInvite = async (
  req: { params: { token?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ success: false, message: "token is required" });
      return;
    }

    const result = await employeeAuthService.verifyInvite(token);
    res.json({ success: true, ...result });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const loginUsername = async (
  req: { body: unknown },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateLoginUsername(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const result = await employeeAuthService.loginUsername(value);
    res.json({ success: true, ...result });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

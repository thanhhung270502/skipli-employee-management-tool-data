import { Response, NextFunction } from "express";
import {
  getValidationMessage,
  handleControllerError,
} from "../../common/utils/controller.util";
import {
  validateCreateAccessCode,
  validateValidateAccessCode,
} from "./owner-auth.validator";
import * as ownerAuthService from "./owner-auth.service";

export const createAccessCode = async (
  req: { body: unknown },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateCreateAccessCode(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    await ownerAuthService.createAccessCode(value.phoneNumber);
    res.json({ success: true, message: "Access code sent via SMS" });
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

    const result = await ownerAuthService.validateAccessCode(value);
    res.json({ success: true, ...result });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

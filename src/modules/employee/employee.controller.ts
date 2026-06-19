import { Response, NextFunction } from "express";
import { AuthRequest, JwtEmployeePayload } from "../../common/types";
import {
  getValidationMessage,
  handleControllerError,
} from "../../common/utils/controller.util";
import {
  validateCreateEmployee,
  validateUpdateEmployee,
  validateUpdateProfile,
} from "./employee.validator";
import * as employeeService from "./employee.service";

export const listEmployees = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employees = await employeeService.listEmployees();
    res.json({ success: true, employees });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const getEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      res
        .status(400)
        .json({ success: false, message: "employeeId is required" });
      return;
    }

    const employee = await employeeService.getEmployee(employeeId);
    res.json({ success: true, employee });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const createEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { error, value } = validateCreateEmployee(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const result = await employeeService.createEmployee(value);
    res
      .status(201)
      .json({
        success: true,
        ...result,
        message: "Employee created and invite email sent",
      });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const updateEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      res
        .status(400)
        .json({ success: false, message: "employeeId is required" });
      return;
    }

    const { error, value } = validateUpdateEmployee(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    await employeeService.updateEmployee(employeeId, value);
    res.json({ success: true, message: "Employee updated successfully" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const deleteEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      res
        .status(400)
        .json({ success: false, message: "employeeId is required" });
      return;
    }

    await employeeService.deleteEmployee(employeeId);
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as JwtEmployeePayload;
    const employee = await employeeService.getProfile(user.employeeId);
    res.json({ success: true, employee });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as JwtEmployeePayload;
    const { error, value } = validateUpdateProfile(req.body);
    if (error) {
      res
        .status(400)
        .json({ success: false, message: getValidationMessage(error) });
      return;
    }

    await employeeService.updateProfile(user.employeeId, value);
    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

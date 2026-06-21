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
  validateListEmployeesQuery,
} from "./employee.validator";
import * as employeeService from "./employee.service";
import { listMyTasks } from "../task/task.service";
import { resolvePaginationParams } from "../../common/validators/pagination.validator";
import { validateListTasksQuery } from "../task/task.validator";
import type { ETaskStatus } from "../task/task.model";

const buildListEmployeesOptions = (query: Record<string, unknown>) => {
  const { error, value } = validateListEmployeesQuery(query);
  if (error) {
    return { error: getValidationMessage(error) };
  }

  return {
    options: {
      pagination: resolvePaginationParams(value),
      search: value.search as string | undefined,
    },
  };
};

const buildEmployeesResponse = (
  result: Awaited<ReturnType<typeof employeeService.listEmployees>>,
  pagination: ReturnType<typeof resolvePaginationParams>
) => ({
  success: true,
  employees: result.data,
  total_record: result.total_record,
  ...(pagination ? { limit: pagination.limit, offset: pagination.offset } : {}),
});

export const listEmployees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = buildListEmployeesOptions(req.query as Record<string, unknown>);
    if ("error" in parsed) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const result = await employeeService.listEmployees(parsed.options);
    res.json(buildEmployeesResponse(result, parsed.options.pagination));
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

export const getEmployeeTasks = async (
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

    const parsed = (() => {
      const { error, value } = validateListTasksQuery(req.query);
      if (error) {
        return { error: getValidationMessage(error) };
      }
      return {
        options: {
          pagination: resolvePaginationParams(value),
          status: value.status as ETaskStatus | undefined,
        },
      };
    })();

    if ("error" in parsed) {
      res.status(400).json({ success: false, message: parsed.error });
      return;
    }

    const result = await listMyTasks(employeeId, parsed.options);
    res.json({
      success: true,
      tasks: result.data,
      total_record: result.total_record,
      ...(parsed.options.pagination
        ? {
            limit: parsed.options.pagination.limit,
            offset: parsed.options.pagination.offset,
          }
        : {}),
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

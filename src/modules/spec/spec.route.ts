import { Router, Response, NextFunction } from "express";
import { authenticateToken, requireOwner } from "../../common/middleware/auth";
import * as ownerAuthService from "../owner-auth/owner-auth.service";
import * as employeeAuthService from "../employee-auth/employee-auth.service";
import * as employeeService from "../employee/employee.service";
import { AuthRequest } from "../../common/types";
import { handleControllerError } from "../../common/utils/controller.util";

const router = Router();

// ─── Owner Spec Routes ───────────────────────────────────

// POST CreateNewAccessCode (Parameters: phoneNumber, Return: accessCode)
router.post(
  "/owner/CreateNewAccessCode",
  async (req: { body: { phoneNumber?: string } }, res: Response, next: NextFunction) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        res.status(400).json({ success: false, message: "phoneNumber is required" });
        return;
      }
      const accessCode = await ownerAuthService.createAccessCode(phoneNumber);
      res.json({ success: true, accessCode });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// POST ValidateAccessCode (Parameters: accessCode, phoneNumber, Return: { success: true })
router.post(
  "/owner/ValidateAccessCode",
  async (
    req: { body: { phoneNumber?: string; accessCode?: string } },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { phoneNumber, accessCode } = req.body;
      if (!phoneNumber || !accessCode) {
        res
          .status(400)
          .json({ success: false, message: "phoneNumber and accessCode are required" });
        return;
      }
      const result = await ownerAuthService.validateAccessCode({ phoneNumber, accessCode });
      res.json({ success: true, ...result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// POST GetEmployee (Parameters: employeeId, Return: Employee object)
router.post(
  "/owner/GetEmployee",
  authenticateToken,
  requireOwner,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        res.status(400).json({ success: false, message: "employeeId is required" });
        return;
      }
      const employee = await employeeService.getEmployee(employeeId);
      res.json(employee);
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// POST CreateEmployee (Parameters: name, email, department, Return: { success: true, employeeId: "generated_id" })
router.post(
  "/owner/CreateEmployee",
  authenticateToken,
  requireOwner,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { name, email, department, phone, role, workSchedule } = req.body;
      if (!name || !email || !department) {
        res
          .status(400)
          .json({ success: false, message: "name, email, and department are required" });
        return;
      }
      const result = await employeeService.createEmployee({
        name,
        email,
        department,
        phone,
        role,
        workSchedule,
      });
      res.json({ success: true, employeeId: result.employeeId });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// POST DeleteEmployee (Parameters: employeeId, Return: { success: true })
router.post(
  "/owner/DeleteEmployee",
  authenticateToken,
  requireOwner,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        res.status(400).json({ success: false, message: "employeeId is required" });
        return;
      }
      await employeeService.deleteEmployee(employeeId);
      res.json({ success: true });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// ─── Employee Spec Routes ─────────────────────────────────

// POST LoginEmail (Parameters: email, Return: accessCode)
router.post(
  "/employee/LoginEmail",
  async (req: { body: { email?: string } }, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: "email is required" });
        return;
      }
      const accessCode = await employeeAuthService.loginEmail({ email });
      res.json({ success: true, accessCode });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

// POST ValidateAccessCode (Parameters: accessCode, email, Return: { success: true })
router.post(
  "/employee/ValidateAccessCode",
  async (
    req: { body: { email?: string; accessCode?: string } },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, accessCode } = req.body;
      if (!email || !accessCode) {
        res.status(400).json({ success: false, message: "email and accessCode are required" });
        return;
      }
      const result = await employeeAuthService.validateAccessCode({ email, accessCode });
      res.json({ success: true, ...result });
    } catch (err) {
      handleControllerError(err, res, next);
    }
  }
);

export default router;

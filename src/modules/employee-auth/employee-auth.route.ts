import { Router } from "express";
import * as employeeAuthController from "./employee-auth.controller";

const router = Router();

router.post("/login-email", employeeAuthController.loginEmail);
router.post("/validate-access-code", employeeAuthController.validateAccessCode);
router.post("/setup-account", employeeAuthController.setupAccount);
router.get("/verify-invite/:token", employeeAuthController.verifyInvite);

export default router;

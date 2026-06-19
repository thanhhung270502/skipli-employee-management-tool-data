import { Router } from "express";
import * as ownerAuthController from "./owner-auth.controller";

const router = Router();

router.post("/create-new-access-code", ownerAuthController.createAccessCode);
router.post("/validate-access-code", ownerAuthController.validateAccessCode);

export default router;

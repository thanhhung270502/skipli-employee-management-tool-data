import Joi from "joi";
import type {
  CreateAccessCodeRequest,
  ValidateAccessCodeRequest,
} from "./owner-auth.model";

export const createAccessCodeSchema = Joi.object<CreateAccessCodeRequest>({
  phoneNumber: Joi.string().trim().required(),
});

export const validateAccessCodeSchema = Joi.object<ValidateAccessCodeRequest>({
  phoneNumber: Joi.string().trim().required(),
  accessCode: Joi.string().trim().required(),
});

export const validateCreateAccessCode = (body: unknown) =>
  createAccessCodeSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

export const validateValidateAccessCode = (body: unknown) =>
  validateAccessCodeSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

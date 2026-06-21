import Joi from "joi";
import type {
  LoginEmailRequest,
  SetupAccountRequest,
  ValidateAccessCodeRequest,
  LoginUsernameRequest,
} from "./employee-auth.model";

export const loginEmailSchema = Joi.object<LoginEmailRequest>({
  email: Joi.string().trim().email().required(),
});

export const validateAccessCodeSchema = Joi.object<ValidateAccessCodeRequest>({
  email: Joi.string().trim().email().required(),
  accessCode: Joi.string().trim().required(),
});

export const setupAccountSchema = Joi.object<SetupAccountRequest>({
  inviteToken: Joi.string().trim().required(),
  username: Joi.string().trim().required(),
  password: Joi.string().min(8).required(),
});

export const loginUsernameSchema = Joi.object<LoginUsernameRequest>({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

export const validateLoginEmail = (body: unknown) =>
  loginEmailSchema.validate(body, { abortEarly: false, stripUnknown: true });

export const validateValidateAccessCode = (body: unknown) =>
  validateAccessCodeSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

export const validateSetupAccount = (body: unknown) =>
  setupAccountSchema.validate(body, { abortEarly: false, stripUnknown: true });

export const validateLoginUsername = (body: unknown) =>
  loginUsernameSchema.validate(body, { abortEarly: false, stripUnknown: true });

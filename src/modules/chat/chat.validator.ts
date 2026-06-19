import Joi from 'joi';

export const getMessagesQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const validateGetMessagesQuery = (query: unknown) =>
  getMessagesQuerySchema.validate(query, { abortEarly: false, stripUnknown: true });

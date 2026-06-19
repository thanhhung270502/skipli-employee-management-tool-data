import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/types';
import { getValidationMessage, handleControllerError } from '../../common/utils/controller.util';
import { validateGetMessagesQuery } from './chat.validator';
import * as chatService from './chat.service';

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      res.status(400).json({ success: false, message: 'roomId is required' });
      return;
    }

    const { error, value } = validateGetMessagesQuery(req.query);
    if (error) {
      res.status(400).json({ success: false, message: getValidationMessage(error) });
      return;
    }

    const limit = value.limit ?? 50;
    const messages = await chatService.getMessages(roomId, limit);
    res.json({ success: true, messages });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

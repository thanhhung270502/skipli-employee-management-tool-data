import { Router } from 'express';
import { authenticateToken } from '../../common/middleware/auth';
import * as chatController from './chat.controller';

const router = Router();

router.get('/:roomId/messages', authenticateToken, chatController.getMessages);

export default router;

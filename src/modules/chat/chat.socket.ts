import { Server, Socket } from 'socket.io';
import type { JoinRoomPayload, SendMessagePayload, TypingPayload } from './chat.model';
import * as chatService from './chat.service';

interface OnlineUser {
  userId: string;
  role: 'owner' | 'employee';
  name: string;
  roomId: string;
}

export const initializeChatSocket = (io: Server): void => {
  const onlineUsers = new Map<string, OnlineUser>();

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join_room', ({ roomId, userId, role, name }: JoinRoomPayload) => {
      socket.join(roomId);
      onlineUsers.set(socket.id, { userId, role, name, roomId });

      console.log(`👤 ${name} (${role}) joined room: ${roomId}`);

      socket.to(roomId).emit('user_joined', { userId, role, name });
      socket.emit('room_joined', { roomId });
    });

    socket.on('send_message', async ({ roomId, senderId, senderName, senderRole, text }: SendMessagePayload) => {
      if (!roomId || !text?.trim()) return;

      try {
        const message = await chatService.saveMessage({
          roomId,
          senderId,
          senderName,
          senderRole,
          text,
        });

        io.to(roomId).emit('receive_message', message);
      } catch (error) {
        const err = error as Error;
        console.error('❌ Failed to save message:', err.message);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing_start', ({ roomId, senderName }: TypingPayload) => {
      socket.to(roomId).emit('user_typing', { senderName });
    });

    socket.on('typing_stop', ({ roomId }: TypingPayload) => {
      socket.to(roomId).emit('user_stopped_typing');
    });

    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        socket.to(user.roomId).emit('user_left', { userId: user.userId, name: user.name });
        onlineUsers.delete(socket.id);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

import { getDb } from '../../common/services/firebase';
import type { ChatMessage, ChatMessagePublic, SendMessagePayload } from './chat.model';

export const getMessages = async (roomId: string, limit = 50): Promise<ChatMessagePublic[]> => {
  const db = getDb();
  const snapshot = await db
    .collection('messages')
    .doc(roomId)
    .collection('chats')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as ChatMessagePublic))
    .reverse();
};

export const saveMessage = async (payload: SendMessagePayload): Promise<ChatMessagePublic> => {
  const messageData: ChatMessage = {
    senderId: payload.senderId,
    senderName: payload.senderName,
    senderRole: payload.senderRole,
    text: payload.text.trim(),
    timestamp: new Date(),
  };

  const db = getDb();
  const docRef = await db
    .collection('messages')
    .doc(payload.roomId)
    .collection('chats')
    .add(messageData);

  return { id: docRef.id, ...messageData };
};

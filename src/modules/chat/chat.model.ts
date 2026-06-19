export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'owner' | 'employee';
  text: string;
  timestamp: Date;
}

export interface ChatMessagePublic extends ChatMessage {
  id: string;
}

export interface SendMessagePayload {
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'owner' | 'employee';
  text: string;
}

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  role: 'owner' | 'employee';
  name: string;
}

export interface TypingPayload {
  roomId: string;
  senderName?: string;
}

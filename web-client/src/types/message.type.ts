export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";

export interface Reaction {
  userId: string;
  emoji: string; // LIKE, LOVE,...
  createdAt: string;
}

export interface ReplyMessage {
  id: string;
  content: string | null;
  senderId: string;
  messageType: MessageType;
  isDeleted: boolean;
}


export interface Message {
  id: string;

  conversationId: string;
  senderId: string;

  content: string;
  messageType: MessageType;

  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;

  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnailUrl: string | null;

  replyToId: string | null;
  replyTo: ReplyMessage | null;

  isDelivered: boolean;
  isDeleted: boolean;
  deletedAt: string | null;

  reactions: Reaction[] | null;

  createdAt: string;
  updatedAt: string;
}

export interface GetMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
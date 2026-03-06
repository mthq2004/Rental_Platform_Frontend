export interface LastMessage {
  content: string | null;
  type: string | null;
  senderId: string | null;
  createdAt: string | null;
}

export interface CustomerCategory {
  id: string,
  name: string,
  color: string,
  description: string
}

export interface Participant {
  id: string,
  fullName: string,
  avatarUrl: string
}

export interface Conversation {
  id: string;
  status: "ACTIVE" | "BLOCKED" | "DELETED";
  participant: Participant;
  lastMessage: LastMessage;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: CustomerCategory[]
}
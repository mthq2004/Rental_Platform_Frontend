export interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  tag: 'new' | 'paid' | 'potential';
}

export interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'me';
  time: string;
  type?: 'text' | 'image' | 'location';
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface PropertyInfo {
  id: string;
  title: string;
  price: string;
  image: string;
}
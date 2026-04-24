export interface AIPropertyCard {
  id: string;
  title: string;
  image: string;
  price: string;
  district: string;
  city: string;
  slug: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  properties?: AIPropertyCard[];
  quickReplies?: string[];
  timestamp: string;
}

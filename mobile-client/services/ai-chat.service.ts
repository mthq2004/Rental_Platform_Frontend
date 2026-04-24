const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AIChatResponse {
  answer: string;
  properties?: Array<{
    id: string;
    title: string;
    image: string;
    price: string;
    district: string;
    city: string;
    slug: string;
  }>;
}

export const sendAIMessage = async (
  userId: string,
  message: string
): Promise<AIChatResponse> => {
  const response = await fetch(`${API_URL}/ai/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message }),
  });

  if (!response.ok) {
    throw new Error(`AI Chat API error: ${response.status}`);
  }

  return response.json();
};

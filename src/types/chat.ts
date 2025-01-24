export type Message = {
  role: 'system' | 'user' | 'developer' | 'assistant';
  content: string;
};

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
} 
export interface Message {
  role: 'system' | 'user' | 'developer' | 'assistant';
  content: string;
  id?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export interface FunctionResult {
  type: string;
  message: string;
}

export interface AIReportItem {
  type: string;
  message: string;
  timestamp: string;
} 
import OpenAI from 'openai';
import { Message } from '@/types/chat';
import { bookingAssistantPrompt } from '@/prompts/bookingAssistant';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Add a helper function for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ChatEngine {
  private apiMessages: Message[];
  private displayMessages: Message[];
  
  constructor() {
    const systemMessage: Message = {
      role: 'system',
      content: bookingAssistantPrompt
    };
    
    this.apiMessages = [systemMessage];
    this.displayMessages = [{
      role: 'assistant',
      content: 'Hello! How can I help you with your booking today?'
    }];
  }

  getDisplayMessages(): Message[] {
    return this.displayMessages;
  }

  async* streamResponse(messages: Message[]) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      stream: true,
    });

    for await (const chunk of completion) {
      if (chunk.choices[0]?.delta?.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }

  async sendMessage(userInput: string, 
    onStream: (partialResponse: string) => void
  ): Promise<{
    success: boolean;
    displayMessages: Message[];
  }> {
    if (!userInput.trim()) return { 
      success: false, 
      displayMessages: this.displayMessages 
    };

    const userMessage: Message = {
      role: 'user',
      content: userInput
    };

    // Update API messages array (including system message)
    this.apiMessages = [...this.apiMessages, userMessage];
    
    try {
      let fullResponse = '';
      
      // Stream the response
      for await (const chunk of this.streamResponse(this.apiMessages)) {
        fullResponse += chunk;
        onStream(fullResponse);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse || 'Sorry, I could not generate a response.'
      };

      // Add the assistant message to API messages
      this.apiMessages = [...this.apiMessages, assistantMessage];
      
      // Update display messages with both user and assistant messages
      this.displayMessages = [...this.displayMessages, userMessage, assistantMessage];

      return {
        success: true,
        displayMessages: this.displayMessages
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      };
      
      // Update display messages with both user message and error
      this.displayMessages = [...this.displayMessages, userMessage, errorMessage];
      this.apiMessages = [...this.apiMessages, errorMessage];
      
      return {
        success: false,
        displayMessages: this.displayMessages
      };
    }
  }

  clearChat(): Message[] {
    const systemMessage: Message = {
      role: 'system',
      content: bookingAssistantPrompt
    };
    
    this.apiMessages = [systemMessage];
    this.displayMessages = [{
      role: 'assistant',
      content: 'Hello! How can I help you with your booking today?'
    }];

    return this.displayMessages;
  }
} 
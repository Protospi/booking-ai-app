'use client';
import React, { useState } from 'react';
import { Message } from '@/types/chat';
import OpenAI from 'openai';
import { bookingAssistantPrompt } from '@/prompts/bookingAssistant';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you should use API routes instead
});

export default function ChatInterface() {
  const systemMessage: Message = {
    role: 'system',
    content: bookingAssistantPrompt
  };

  // Messages for API calls (includes system message)
  const [apiMessages, setApiMessages] = useState<Message[]>([systemMessage]);
  
  // Messages for display (excludes system message)
  const [displayMessages, setDisplayMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! How can I help you with your booking today?'
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add ref for the messages container
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to scroll on new messages
  React.useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    // Update both message arrays
    setApiMessages(prev => [...prev, userMessage]);
    setDisplayMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [...apiMessages, userMessage].map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: completion.choices[0].message.content || 'Sorry, I could not generate a response.'
      };

      // Update both message arrays with the assistant's response
      setApiMessages(prev => [...prev, assistantMessage]);
      setDisplayMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.'
      };
      setDisplayMessages(prev => [...prev, errorMessage]);
      setApiMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    // Reset API messages to only include system message
    setApiMessages([systemMessage]);
    // Reset display messages to only include initial greeting
    setDisplayMessages([
      {
        role: 'assistant',
        content: 'Hello! How can I help you with your booking today?'
      }
    ]);
  };

  return (
    <div className="w-1/2 bg-zinc-900 rounded-xl p-6 h-[700px] flex flex-col">
      {/* Chat Header with Title and Clear Button */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">AI Booker</h2>
        <button
          onClick={handleClearChat}
          className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          title="Clear conversation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar">
        <div className="flex flex-col gap-6 pr-4">
          {displayMessages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === 'assistant'
                  ? 'bg-zinc-800 rounded-xl rounded-tl-none max-w-[80%]'
                  : 'bg-[#6467F2] rounded-xl rounded-tr-none max-w-[80%] self-end'
              } p-4`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-zinc-800 rounded-xl rounded-tl-none max-w-[80%] p-4">
              <div className="flex gap-2">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            </div>
          )}
          {/* Add div for scrolling reference */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex gap-2 flex-shrink-0">
        <input 
          type="text" 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6467F2]"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading}
          className="bg-[#6467F2] px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
} 
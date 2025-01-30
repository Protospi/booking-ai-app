'use client';
import React, { useState, useRef } from 'react';
import { Message } from '@/types/chat';
import { bookingAssistantPrompt } from '@/prompts/conversationalAgent';
import { scheduleAgentPrompt } from '@/prompts/scheduleAgent';
import ReactMarkdown from 'react-markdown';

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Olá! Como posso ajudar você com sua agenda hoje?'
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    let bookingAssistantPromptUpdated = bookingAssistantPrompt

    // Update messages with user input
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setStreamingResponse('');
    let message = ''

    try {
      const response = await fetch('http://localhost:8000/api/schedule/schedule-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: scheduleAgentPrompt },
            ...messages,
            userMessage,
          ]
        }),
      });

      const responseData = await response.json();
      console.log('Response data:', responseData);  // This will show the functionResult

      if (responseData.functionResult.message) {
        message = responseData.functionResult.message
      }
      
      // You can now access responseData.functionResult
      if (responseData.functionResult) {
        console.log('Function result:', responseData.functionResult);
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, encontrei um erro ao processar sua solicitação.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    try {
      if (message.length > 0) {
        bookingAssistantPromptUpdated = bookingAssistantPromptUpdated.split('<<<')[1] + '\n' + '<<<' + message + '<<<'
      }
      
      const response = await fetch('http://localhost:8000/api/schedule/conversational-agent', {
      //const response = await fetch('http://54.175.159.119:8000/api/schedule/conversational-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: bookingAssistantPrompt },
            ...messages,
            userMessage
          ]
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch from backend');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(5);
            if (jsonStr === '[DONE]') continue;
            
            try {
              const json = JSON.parse(jsonStr);
              if (json.content) {
                fullResponse += json.content;
                setStreamingResponse(fullResponse);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }

      // Add assistant's response to messages
      const assistantMessage: Message = {
        role: 'assistant',
        content: fullResponse
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, encontrei um erro ao processar sua solicitação.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
      scrollToBottom();
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Olá! Como posso ajudar você com sua agenda hoje?'
    }]);
  };

  return (
    <div className="w-1/2 bg-zinc-900 rounded-xl p-6 h-[620px] flex flex-col">
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
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${
                message.role === 'assistant'
                  ? 'bg-zinc-800 rounded-xl rounded-tl-none max-w-[80%]'
                  : 'bg-[#6467F2] rounded-xl rounded-tr-none max-w-[80%] self-end'
              } p-4 whitespace-pre-line`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    strong: ({children}) => <strong className="font-bold">{children}</strong>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-zinc-800 rounded-xl rounded-tl-none max-w-[80%] p-4 whitespace-pre-line">
              {streamingResponse ? (
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({children}) => <li>{children}</li>,
                    strong: ({children}) => <strong className="font-bold">{children}</strong>,
                  }}
                >
                  {streamingResponse}
                </ReactMarkdown>
              ) : (
                <div className="flex gap-2">
                  <div className="animate-bounce">●</div>
                  <div className="animate-bounce delay-100">●</div>
                  <div className="animate-bounce delay-200">●</div>
                </div>
              )}
            </div>
          )}
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
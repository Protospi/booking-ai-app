'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Message } from '@/types/chat';
import { bookingAssistantPrompt } from '@/prompts/conversationalAgent';
import { scheduleAgentPrompt } from '@/prompts/scheduleAgent';
import ReactMarkdown from 'react-markdown';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Add S3 client configuration after imports
const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Olá!  👋 
    Sou a Izi!  😊
    Assistente digital da empresa Smart Talks!  💬
    Posso te ajudar a agendar uma reunião com nosso time comercial? 📅` 
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const AudioMessage = ({ audioUrl, messageId }: { audioUrl: string, messageId: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      if (!audioElementsRef.current[messageId]) {
        const audio = new Audio(audioUrl);
        audioElementsRef.current[messageId] = audio;
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
          const progress = (audio.currentTime / audio.duration) * 100;
          setProgress(progress);
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        });
      }

      return () => {
        if (audioElementsRef.current[messageId]) {
          audioElementsRef.current[messageId].pause();
          delete audioElementsRef.current[messageId];
        }
      };
    }, [audioUrl, messageId]);

    const formatTime = (time: number) => {
      if (!isFinite(time) || isNaN(time)) return '0:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
      const audio = audioElementsRef.current[messageId];
      if (audio) {
        if (isPlaying) {
          audio.pause();
        } else {
          Object.values(audioElementsRef.current).forEach(a => a.pause());
          if (progress >= 100) {
            audio.currentTime = 0;
            setCurrentTime(0);
            setProgress(0);
          }
          audio.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className="flex flex-col gap-1 min-w-[250px]">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-[#6467F2] hover:bg-[#5254d4] transition-colors"
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>
          <div className="flex-1 flex flex-col justify-center gap-1 pt-4">
            <div className="h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#6467F2] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-end text-[10px] text-zinc-400 px-0.5">
              <span>{formatTime(progress >= 100 ? duration : currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modify the uploadAudioToS3 function
  const uploadAudioToS3 = async (audioBlob: Blob): Promise<string> => {
    const fileName = `audio-${Date.now()}.wav`;
    
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const params = {
      Bucket: "my-app-audio-files",
      Key: fileName,
      Body: uint8Array,
      ContentType: 'audio/wav',
    };

    try {
      await s3.send(new PutObjectCommand(params));
      return `https://my-app-audio-files.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (err) {
      console.error('Error uploading to S3:', err);
      throw err;
    }
  };

  const handleSendMessage = async (audioBlob?: Blob) => {
    if (!inputMessage.trim() && !audioBlob) return;

    let messageType = 'text';
    let messageContent = inputMessage;
    let userInput = inputMessage;
    let bookingAssistantPromptUpdate = bookingAssistantPrompt;

    try {
      if (audioBlob) {
        messageType = 'audio';
        // Upload to S3 and get URL
        const audioUrl = await uploadAudioToS3(audioBlob);
        messageContent = `audio:${audioUrl}`;
        userInput = audioUrl;
      }

      const userMessage: Message = {
        role: 'user',
        content: messageContent
      };

      // Update messages with user input
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setIsLoading(true);
      setStreamingResponse('');
      let message = ''

      const scheduleResponse = await fetch('http://localhost:8000/api/schedule/schedule-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            type: messageType,
            content: userInput
          },
          userMessage,
          messages: [
            { role: 'system', content: scheduleAgentPrompt },
            ...messages
          ]
        }),
      });

      const responseData = await scheduleResponse.json();
      console.log('Response data:', responseData);  // This will show the functionResult

      if (responseData.functionResult) {
        if (responseData.functionResult.message) {
          message = responseData.functionResult.message;
        }
        
        // Dispatch events based on functionResult
        if (responseData.functionResult.date) {
          // Dispatch date selection event
          const dateEvent = new CustomEvent('selectDate', {
            detail: {
              date: new Date(responseData.functionResult.date).setHours(new Date(responseData.functionResult.date).getHours() + 3)
            }
          });
    
          window.dispatchEvent(dateEvent);
        }
        
        // Existing function call event
        const event = new CustomEvent('functionCall', {
          detail: {
            type: responseData.functionResult.type,
            message: responseData.functionResult.message
          }
        });
        window.dispatchEvent(event);
      }

      if (message.length > 0) {
        bookingAssistantPromptUpdate = bookingAssistantPromptUpdate + '\n' + message
      }

      const chatResponse = await fetch('http://localhost:8000/api/schedule/conversational-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            type: messageType,
            content: userInput
          },
          userMessage,
          messages: [
            { role: 'system', content: bookingAssistantPromptUpdate },
            ...messages
          ]
        }),
      });

      if (!chatResponse.ok) throw new Error('Failed to fetch from backend');

      const reader = chatResponse.body?.getReader();
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
      content: `Olá!  👋 
        Sou a Izi!  😊
        Assistente digital da empresa Smart Talks!  💬
        Posso te ajudar a agendar uma reunião com nosso time comercial? 📅` 
        }]);
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<Blob>((resolve) => {
      if (!mediaRecorderRef.current) return;
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        resolve(audioBlob);
      };
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    });
  }, []);

  return (
    <div className="w-1/2 bg-zinc-900 rounded-xl p-6 h-[720px] flex flex-col">
      {/* Chat Header with Title and Clear Button */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-white">Assistente de Agendamento Smart Talks</h2>
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
                  ? 'bg-[#6467F2] rounded-xl rounded-tl-none max-w-[80%]'
                  : 'bg-zinc-800 rounded-xl rounded-tr-none max-w-[80%] self-end'
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
              ) : message.content.startsWith('audio:') ? (
                <AudioMessage 
                  audioUrl={message.content.replace('audio:', '')}
                  messageId={message.id || index.toString()}
                />
              ) : (
                message.content
              )}
            </div>
          ))}
          {isLoading && (
            <div className="bg-[#6467F2] rounded-xl rounded-tl-none max-w-[80%] p-4 whitespace-pre-line">
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

      {/* Modified Chat Input */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onMouseDown={startRecording}
          onMouseUp={async () => {
            const audioBlob = await stopRecording();
            if (audioBlob) {
              handleSendMessage(audioBlob);
            }
          }}
          onMouseLeave={async () => {
            if (isRecording) {
              const audioBlob = await stopRecording();
              if (audioBlob) {
                handleSendMessage(audioBlob);
              }
            }
          }}
          className={`p-2 rounded-lg ${
            isRecording ? 'bg-red-500' : 'bg-zinc-800'
          } hover:bg-opacity-90 transition-colors`}
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
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
        <input 
          type="text" 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-zinc-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6467F2]"
        />
        <button 
          onClick={() => handleSendMessage()}
          disabled={isLoading}
          className="bg-[#6467F2] px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
} 
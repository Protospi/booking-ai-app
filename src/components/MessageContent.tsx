import React from 'react';
import ReactMarkdown from 'react-markdown';
import AudioPlayer from './AudioDownload';

interface MessageContentProps {
  content: string | { audioUrl: string; text?: string };
}

export default function MessageContent({ content }: MessageContentProps) {
  // If content is a string, render as markdown
  if (typeof content === 'string') {
    return (
      <ReactMarkdown
        components={{
          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({children}) => <li>{children}</li>,
          strong: ({children}) => <strong className="font-bold">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // If content has audioUrl, render audio player and optional text
  return (
    <div className="flex flex-col gap-4">
      <AudioPlayer audioUrl={content.audioUrl} />
      {content.text && (
        <ReactMarkdown
          components={{
            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({children}) => <li>{children}</li>,
            strong: ({children}) => <strong className="font-bold">{children}</strong>,
          }}
        >
          {content.text}
        </ReactMarkdown>
      )}
    </div>
  );
} 
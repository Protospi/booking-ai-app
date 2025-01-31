"use client";

import React, { useEffect, useState } from 'react';

interface FunctionCall {
  type: string;
  message: string;
  timestamp: string;
}

interface AIReportProps {
  onClear: () => void;
}

export default function AIReport({ onClear }: AIReportProps) {
  const [functionCalls, setFunctionCalls] = useState<FunctionCall[]>([]);

  useEffect(() => {
    // Event listener for function calls
    const handleFunctionCall = (event: CustomEvent) => {
      const { type, message } = event.detail;
      // Only add the function call if type is not an empty string
      if (type.trim()) {
        const newCall = {
          type,
          message,
          timestamp: new Date().toLocaleTimeString()
        };
        setFunctionCalls(prev => [...prev, newCall]);
      }
    };

    // Add event listener
    window.addEventListener('functionCall', handleFunctionCall as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('functionCall', handleFunctionCall as EventListener);
    };
  }, []);

  // Update the trash icon click handler to call onClear
  const handleClear = () => {
    // Your existing clear logic
    onClear();
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-4 h-[500px] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Function Calls</h2>
      {functionCalls.length === 0 ? (
        <div className="text-center text-gray-400">
          No function calls recorded
        </div>
      ) : (
        <div className="space-y-3">
          {functionCalls.map((call, index) => (
            <div key={index} className="border-b border-zinc-700 pb-2">
              <div className="font-medium text-[#6467F2]">• {call.type}</div>
              <div className="text-sm text-gray-300 mt-1">{call.message}</div>
              <div className="text-xs text-gray-500 mt-1">{call.timestamp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
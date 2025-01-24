"use client";

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AIReport from './AIReport';

interface TimeSlot {
  hour: string;
  available: boolean;
}

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'calendar' | 'ai'>('calendar');

  // Generate time slots for the day view
  const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    available: true,
  }));

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ));
  };

  return (
    <div className="w-1/2 bg-zinc-900 rounded-xl p-6 min-h-[600px]">
      {/* View Toggle Switch */}
      <div className="flex justify-center mb-6">
        <div className="bg-zinc-800 p-1 rounded-lg inline-flex">
          <button 
            className={`px-4 py-2 rounded-md transition-all ${
              view === 'calendar' ? 'bg-[#6467F2] text-white' : 'text-white hover:bg-zinc-700'
            }`}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-all ${
              view === 'ai' ? 'bg-[#6467F2] text-white' : 'text-white hover:bg-zinc-700'
            }`}
            onClick={() => setView('ai')}
          >
            AI Report
          </button>
        </div>
      </div>

      {/* Content Container */}
      {view === 'calendar' ? (
        <div className="bg-zinc-800 rounded-xl p-4 h-[500px]">
          {selectedDate ? (
            // Day View
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center text-white hover:text-[#6467F2] transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-1" />
                  Back to Calendar
                </button>
                <div className="text-white font-medium">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.hour}
                    className="flex items-center p-3 border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                  >
                    <span className="text-white">{slot.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Month View
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-white font-medium">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1 rounded-full hover:bg-zinc-700 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5 text-white" />
                </button>
              </div>
              <br></br>
              <div className="grid grid-cols-7 gap-[1rem] text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-zinc-400 text-sm py-1.5">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-[1rem]">
                {getDaysInMonth(currentDate).map((date, index) => (
                  <div
                    key={index}
                    className={`
                      h-11 flex items-center justify-center text-sm
                      ${date ? 'cursor-pointer hover:bg-zinc-700 transition-all' : ''}
                      ${date?.toDateString() === new Date().toDateString() ? 'bg-[#6467F2]/20 text-[#6467F2]' : 'text-white'}
                      rounded-md
                    `}
                    onClick={() => date && setSelectedDate(date)}
                  >
                    {date?.getDate()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <AIReport />
      )}
    </div>
  );
} 
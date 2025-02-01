"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AIReport from './AIReport';

interface Booking {
  hour: string;
  userName: string;
  subject: string;
  company: string;
  status: string;
}

interface TimeSlot {
  hour: string;
  available: boolean;
  booking?: Booking;
}

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'calendar' | 'ai'>('calendar');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [showAIReport, setShowAIReport] = useState(true);

  // Add useEffect to listen for date selection events
  useEffect(() => {
    const handleDateSelection = (event: CustomEvent) => {
      const dateStr = event.detail.date; // Format: "2025-02-05"
      const selectedDate = new Date(dateStr);
      
      // Update current date to show correct month
      setCurrentDate(selectedDate);
      // Select the date and fetch schedule
      handleDateSelect(selectedDate);
      // Switch to calendar view
      setView('calendar');
    };

    window.addEventListener('selectDate', handleDateSelection as EventListener);

    return () => {
      window.removeEventListener('selectDate', handleDateSelection as EventListener);
    };
  }, []);

  // Remove the static timeSlots array and add a function to fetch data
  const fetchScheduleData = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const response = await fetch(`http://localhost:8000/api/schedule/schedule-agent/${formattedDate}`);
      
      const data = await response.json();
      console.log('Parsed schedule data:', data);
      
      // Validate data structure and provide default empty array if invalid
      const slots = data?.slots || [];
      
      // Map the API slots to our Booking interface
      const bookings = slots.map((slot: any) => ({
        hour: slot.time,
        userName: slot.clientName,
        subject: slot.subject,
        status: slot.status,
        company: slot.company
      }));
      
      // Create time slots with booking data
      const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => {
        const hour = `${i}:00`;
        const booking = bookings.find((booking: Booking) => booking.hour === hour);
        return {
          hour,
          available: booking ? booking.status === 'available' : true,
          booking: booking?.status === 'booked' ? {
            hour: booking.hour,
            userName: booking.userName,
            subject: booking.subject,
            company: booking.company,
            status: booking.status
          } : undefined
        };
      });
      
      setTimeSlots(timeSlots);
    } catch (error) {
      console.error('Error fetching schedule:', {
        error,
        date: date.toISOString(),
        endpoint: `http://localhost:8000/api/schedule/schedule-agent/${date.toISOString().split('T')[0]}`
      });
      // Fallback to empty slots if fetch fails
      setTimeSlots(Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        available: true,
      })));
    }
  };

  // Update the date selection to fetch data
  const handleDateSelect = (date: Date) => {
    console.log('DATE:', date);
    setSelectedDate(date);
    fetchScheduleData(date);
  };

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
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + (direction === 'next' ? 1 : -1),
      1
    ));
  };

  // Modify the view toggle to handle AI Report visibility
  const handleViewToggle = (newView: 'calendar' | 'ai') => {
    setView(newView);
    // Don't hide the AI Report when switching views
    if (newView === 'ai') {
      setShowAIReport(true);
    }
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
            onClick={() => handleViewToggle('calendar')}
          >
            Calendário
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-all ${
              view === 'ai' ? 'bg-[#6467F2] text-white' : 'text-white hover:bg-zinc-700'
            }`}
            onClick={() => handleViewToggle('ai')}
          >
            Relatório
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className={view === 'calendar' ? 'block' : 'hidden'}>
        <div className="bg-zinc-800 rounded-xl p-4 h-[550px]">
          {selectedDate ? (
            // Day View
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center text-white hover:text-[#6467F2] transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5 mr-1" />
                  Voltar para o Calendário
                </button>
                <div className="text-white font-medium">
                  {selectedDate.toLocaleDateString('pt-BR', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <div key={slot.hour}>
                    <div
                      onClick={() => slot.booking && setExpandedSlot(expandedSlot === slot.hour ? null : slot.hour)}
                      className={`flex items-center justify-between p-3 border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors ${
                        slot.available ? 'cursor-pointer' : 'bg-[#6467F2]/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-white">{slot.hour}</span>
                        {slot.booking && (
                          <span className="font-medium text-sm text-zinc-300">
                            {slot.booking.userName}
                            {slot.booking.company && ` (${slot.booking.company})`}
                          </span>
                        )}
                      </div>
                      {slot.booking && (
                        <ChevronDownIcon 
                          className={`w-4 h-4 text-zinc-300 transition-transform ${
                            expandedSlot === slot.hour ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>
                    {expandedSlot === slot.hour && slot.booking && (
                      <div className="p-3 bg-[#6467F2]/10 text-sm text-zinc-300">
                        <p>Subject: {slot.booking.subject || 'No subject'}</p>
                      </div>
                    )}
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
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
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
                    onClick={() => date && handleDateSelect(date)}
                  >
                    {date?.getDate()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Report - Only hide it when showAIReport is false */}
      <div className={view === 'ai' ? 'block' : 'hidden'}>
        {showAIReport && <AIReport onClear={() => setShowAIReport(false)} />}
      </div>
    </div>
  );
} 
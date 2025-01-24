import React from 'react';

export default function BookingCalendar() {
  return (
    <div className="w-1/2 bg-zinc-900 rounded-xl p-6 min-h-[600px]">
      {/* View Toggle Switch */}
      <div className="flex justify-center mb-6">
        <div className="bg-zinc-800 p-1 rounded-lg inline-flex">
          <button className="px-4 py-2 rounded-md bg-[#6467F2] text-white">
            Calendar
          </button>
          <button className="px-4 py-2 rounded-md text-white hover:bg-zinc-700">
            AI Report
          </button>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="bg-zinc-800 rounded-xl p-4 h-[500px]">
        {/* Calendar will be implemented later */}
        <div className="text-center text-gray-400">
          Calendar view will be implemented here
        </div>
      </div>
    </div>
  );
} 
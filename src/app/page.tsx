import ChatInterface from '@/components/ChatInterface';
import BookingCalendar from '@/components/BookingCalendar';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Main Title */}

      {/* Main Content Container */}
      <div className="flex gap-8">
        <ChatInterface />
        <BookingCalendar />
      </div>
    </div>
  );
}
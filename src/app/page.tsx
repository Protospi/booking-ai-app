import ChatInterface from '@/components/ChatInterface';
import BookingCalendar from '@/components/BookingCalendar';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Main Title */}
      <h1 className="text-4xl font-bold text-center mb-12">Booking AI APP</h1>

      {/* Main Content Container */}
      <div className="flex gap-8">
        <ChatInterface />
        <BookingCalendar />
      </div>
    </div>
  );
}

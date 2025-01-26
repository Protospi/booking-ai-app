import { connectToDatabase } from '../src/lib/dataAgent';

interface TimeSlot {
  time: string;
  clientName: string;
  status: 'available' | 'booked';
}

interface DaySchedule {
  date: Date;
  slots: TimeSlot[];
}

async function generateTimeSlots(): Promise<TimeSlot[]> {
  const morningSlots = ['8:00', '9:00', '10:00', '11:00'];
  const afternoonSlots = ['14:00', '15:00', '16:00', '17:00'];
  const allSlots = [...morningSlots, ...afternoonSlots];

  return allSlots.map(time => ({
    time,
    clientName: '',
    status: 'available'
  }));
}

async function populateSchedule() {
  try {
    const { db } = await connectToDatabase();
    const scheduleCollection = db.collection('schedule');

    // Clear existing documents
    await scheduleCollection.deleteMany({});
    console.log('Cleared existing schedule data');

    // Generate dates from 2025-01-01 to 2025-02-01
    const schedules: DaySchedule[] = [];
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-02-01');

    for (
      let date = new Date(startDate);
      date < endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const slots = await generateTimeSlots();
      schedules.push({
        date: new Date(date),
        slots
      });
    }

    // Insert new documents
    const result = await scheduleCollection.insertMany(schedules);
    console.log(`Successfully populated schedule with ${result.insertedCount} days`);

  } catch (error) {
    console.error('Error populating schedule:', error);
  } finally {
    process.exit();
  }
}

// Run the population script
populateSchedule(); 
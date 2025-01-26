import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env file');
}

async function generateTimeSlots() {
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
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bookerAgent');
    const scheduleCollection = db.collection('schedule');

    // Clear existing documents
    await scheduleCollection.deleteMany({});
    console.log('Cleared existing schedule data');

    // Generate dates from 2025-01-01 to 2025-02-01
    const schedules = [];
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
    await client.close();
    console.log('Disconnected from MongoDB');
    process.exit();
  }
}

// Run the population script
populateSchedule(); 
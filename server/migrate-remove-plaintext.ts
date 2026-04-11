import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
  await mongoose.connect(process.env.MONGO_URI!);
  const result = await mongoose.connection.collection('users').updateMany(
    {},
    { $unset: { passwordPlain: '' } }
  );
  console.log(`Cleared passwordPlain from ${result.modifiedCount} users`);
  await mongoose.disconnect();
}
run();

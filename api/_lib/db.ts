// @ts-nocheck
import mongoose from 'mongoose';

let conn: typeof mongoose | null = null;

export async function connectDB() {
  if (conn && mongoose.connection.readyState === 1) return conn;
  conn = await mongoose.connect(process.env.MONGO_URI!);
  return conn;
}

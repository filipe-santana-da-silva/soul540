import 'dotenv/config';
import serverless from 'serverless-http';
import { connectDB } from '../server/db';
import app from '../server/app';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return serverless(app)(req, res);
}

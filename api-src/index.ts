import 'dotenv/config';
import { connectDB } from '../server/db';
import app from '../server/app';

let dbPromise: Promise<void> | null = null;

const getDb = () => {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
};

module.exports = async (req: any, res: any) => {
  try {
    await getDb();
    app(req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

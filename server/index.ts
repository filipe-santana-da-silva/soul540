import 'dotenv/config';
import { connectDB } from './db';
import app from './app';

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Falha ao conectar ao MongoDB:', err); process.exit(1); });

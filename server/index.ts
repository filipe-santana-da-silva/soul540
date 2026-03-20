import 'dotenv/config';
import { connectDB } from './db';
import app from './app';

const PORT = process.env.PORT || 3001;

console.log('MONGO_URI defined:', !!process.env.MONGO_URI);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

connectDB().catch((err) => console.error('Falha ao conectar ao MongoDB:', err));

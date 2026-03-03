import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './db';
import eventsRouter from './routes/events';
import tasksRouter from './routes/tasks';
import employeesRouter from './routes/employees';
import contractorsRouter from './routes/contractors';
import contractorCategoriesRouter from './routes/contractor-categories';
import financesRouter from './routes/finances';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/contractors', contractorsRouter);
app.use('/api/contractor-categories', contractorCategoriesRouter);
app.use('/api/finances', financesRouter);
app.use('/api/dashboard', dashboardRouter);

connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`)))
  .catch((err) => { console.error('Falha ao conectar ao MongoDB:', err); process.exit(1); });

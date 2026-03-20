import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import eventsRouter from './routes/events';
import tasksRouter from './routes/tasks';
import employeesRouter from './routes/employees';
import contractorsRouter from './routes/contractors';
import contractorCategoriesRouter from './routes/contractor-categories';
import financesRouter from './routes/finances';
import dashboardRouter from './routes/dashboard';
import utensilsRouter from './routes/utensils';
import suppliesRouter from './routes/supplies';
import utensilCategoriesRouter from './routes/utensil-categories';
import supplyCategoriesRouter from './routes/supply-categories';
import authRouter from './routes/auth';
import usersRouter from './routes/users';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/events', eventsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/contractors', contractorsRouter);
app.use('/api/contractor-categories', contractorCategoriesRouter);
app.use('/api/finances', financesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/utensils', utensilsRouter);
app.use('/api/supplies', suppliesRouter);
app.use('/api/utensil-categories', utensilCategoriesRouter);
app.use('/api/supply-categories', supplyCategoriesRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

export default app;

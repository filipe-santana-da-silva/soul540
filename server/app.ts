import express from 'express';
import cors from 'cors';
import path from 'path';
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
import contractsRouter from './routes/contracts';
import franchisesRouter from './routes/franchises';
import menusRouter from './routes/menus';
import invoicesRouter from './routes/invoices';
import { optionalAuth } from './middleware/auth';

const app = express();

app.use(cors({ allowedHeaders: ['Content-Type', 'Authorization', 'X-System'] }));
app.use(express.json());
app.use(optionalAuth);

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
app.use('/api/contracts', contractsRouter);
app.use('/api/franchises', franchisesRouter);
app.use('/api/menus', menusRouter);
app.use('/api/invoices', invoicesRouter);

// Serve franchise app at /franquia
const franchiseDist = path.join(process.cwd(), 'franchise/dist');
app.use('/franquia', express.static(franchiseDist));
app.get('/franquia/*', (_req, res) => res.sendFile(path.join(franchiseDist, 'index.html')));

// Serve factory app at /fabrica
const factoryDist = path.join(process.cwd(), 'factory/dist');
app.use('/fabrica', express.static(factoryDist));
app.get('/fabrica/*', (_req, res) => res.sendFile(path.join(factoryDist, 'index.html')));

// Serve main app
const mainDist = path.join(process.cwd(), 'dist');
app.use(express.static(mainDist));
app.get('*', (_req, res) => res.sendFile(path.join(mainDist, 'index.html')));

export default app;

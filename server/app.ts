import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import chatRouter from './routes/chat';
import auditLogRouter from './routes/auditlog';
import { optionalAuth } from './middleware/auth';

const app = express();

app.use(cors({ allowedHeaders: ['Content-Type', 'Authorization', 'X-System'] }));
app.use(express.json({ limit: '100mb' }));
app.use(cookieParser());
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
app.use('/api/chat', chatRouter);
app.use('/api/audit-log', auditLogRouter);

// Serve franchise app at /franquia
const franchiseDist = path.join(process.cwd(), 'franchise/dist');
app.use('/franquia', express.static(franchiseDist));
app.get(['/franquia', '/franquia/*'], (_req, res) => res.sendFile(path.join(franchiseDist, 'index.html')));

// Serve factory app at /fabrica
const factoryDist = path.join(process.cwd(), 'factory/dist');
app.use('/fabrica', express.static(factoryDist));
app.get(['/fabrica', '/fabrica/*'], (_req, res) => res.sendFile(path.join(factoryDist, 'index.html')));

// Serve main app
const mainDist = path.join(process.cwd(), 'dist');
app.use(express.static(mainDist));
app.get('*', (_req, res) => res.sendFile(path.join(mainDist, 'index.html')));

// Global error handler — must be 4-arg; express-async-errors ensures async throws reach here
app.use((err: any, req: any, res: any, _next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${status}: ${message}`);
  if (!res.headersSent) res.status(status).json({ error: message });
});

export default app;

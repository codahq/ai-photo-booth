import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { ensureStorageDirs, getStorageDir } from './storage/imageStore';
import transformRouter from './routes/transform';
import historyRouter from './routes/history';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

// Ensure storage directories exist on startup
ensureStorageDirs();

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static storage files
app.use('/storage', express.static(getStorageDir()));

// API Routes
app.use('/api/transform', transformRouter);
app.use('/api/history', historyRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`AI Photo Booth backend running on port ${PORT}`);
  console.log(`Serving static files from: ${getStorageDir()}`);
  console.log(`Allowing CORS from: ${FRONTEND_ORIGIN}`);
});

export default app;

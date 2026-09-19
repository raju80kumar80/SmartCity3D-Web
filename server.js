import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './server/config/db.js';
import apiRoutes from './server/routes/apiRoutes.js';
import { errorHandler } from './server/middleware/errorHandler.js';

// Resolve directory paths for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Core Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', apiRoutes);

// Fallback route for SPA - serve index.html
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

// Start HTTP Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SmartCity3D-Web Server is running on port ${PORT}`);
  console.log(`🌐 Local Web App URL: http://localhost:${PORT}`);
  console.log(`🔌 API Healthcheck:   http://localhost:${PORT}/api/status`);
  console.log(`====================================================`);
});

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './models/supabase.js';
import disasterRoutes from './routes/disaster.js';
import geocodeRoutes from './routes/geocode.js';
import resourceRoutes from './routes/resources.js';
import socialMediaRoutes from './routes/socialmedia.js';
import verifyImageRoute from './routes/images.js';
import authMiddleware from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://disaster-response-ui-raghavarora01s-projects.vercel.app', // Allow only frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Attach socket.io instance to app for controller access
app.set('io', io);
app.set('supabase', supabase); // Set Supabase client
// Middleware
app.use(cors({
  origin: 'https://disaster-response-ui-raghavarora01s-projects.vercel.app', // Same as frontend
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', geocodeRoutes);
app.use('/api', resourceRoutes);
app.use('/api', socialMediaRoutes); // /disasters/:id/social-media
app.use('/api', verifyImageRoute);  // /disasters/:id/verify-image
 // Auth-protected disaster routes

// Health check
app.get('/', (req, res) => {
  res.send('Disaster Response Platform Backend is running ✅');
});

app.use('/api', authMiddleware, disasterRoutes);

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 9897;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

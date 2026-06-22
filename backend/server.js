require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const studentRoutes = require('./routes/students');
const academicRoutes = require('./routes/academic');
const complaintsRoutes = require('./routes/complaints');
const reportsRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Setup Socket.io for real-time notification broadcasts
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Pass socket connection to middlewares if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve custom file uploads mock path if needed
app.use('/uploads', express.static('uploads'));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);

// Root path healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    service: "AP School ERP Server"
  });
});

// Socket.io event connection handler
io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET.IO] Client connected: ${socket.id}`);
  
  socket.on('join_room', (roomName) => {
    socket.join(roomName);
    console.log(`🔌 [SOCKET.IO] Socket ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET.IO] Client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 [SERVER ERROR]", err);
  res.status(500).json({ error: "Internal server error" });
});

// Run server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 [SERVER] AP Gov School ERP Backend running on: http://localhost:${PORT}`);
});

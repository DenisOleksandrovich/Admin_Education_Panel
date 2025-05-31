const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initializeWebSocketServer, getWebSocketBroadcaster } = require('./websocketServer');

const eventRoutes = require('./routes/events');
const supervisorRoutes = require('./routes/supervisors');
const studentRoutes = require('./routes/students');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);

initializeWebSocketServer(server);
const wsBroadcaster = getWebSocketBroadcaster();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8000',
}));
app.use(express.json());

app.use((req, res, next) => {
  req.wsBroadcaster = wsBroadcaster;
  next();
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) { }
}
app.use('/uploads', express.static(uploadsDir));

app.use(accountRoutes);
app.use('/', authRoutes);
app.use('/', eventRoutes);
app.use('/', supervisorRoutes);
app.use('/', studentRoutes);
app.use('/', assignmentRoutes);
app.use('/', submissionRoutes);
app.use('/', notificationRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error("Необроблена помилка:", err.stack || err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`HTTP та WebSocket сервер успішно запущено на порту ${port}`);
});

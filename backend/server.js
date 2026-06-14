const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');

// Connect to database
connectDB();

// Initialize the Express application
const app = express();

// Set security headers
app.use(helmet());

// Rate limiting to prevent brute-force attacks
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // 100 requests per 10 mins
});
app.use(limiter);

// Prevent NoSQL injections
app.use(mongoSanitize());

// Middleware
app.use(cors()); // Allows frontend to communicate with backend
app.use(express.json()); // Parses incoming JSON requests

// Route files
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes); // Notice singular 'resume' as requested
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('AI Resume Builder API is running');
});

// Custom error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

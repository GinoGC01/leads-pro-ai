import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Phase 0: Start Asynchronous Enrichment Engine Worker
import './workers/EnrichmentWorker.js';

// Phase 2: Start Deep Vision Worker
import './workers/VisionWorker.js';

// Phase 3: Initialize SPIDER V2 Vector Memory (Qdrant)
import VectorStoreService from './services/VectorStoreService.js';
VectorStoreService.initializeCollection().catch(err => 
    console.warn(`[Server] Qdrant init skipped (non-blocking): ${err.message}`)
);

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

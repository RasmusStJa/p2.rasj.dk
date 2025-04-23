import mysql from 'mysql2/promise'; // Using the promise wrapper for async/await

import path from 'path';

const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'myuser',
    password: process.env.DB_PASSWORD || 'mypassword',
    database: process.env.DB_NAME || 'mydatabase',
    // Add other options like connectionLimit if needed
};

const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000; // 2 seconds

let pool: mysql.Pool | null = null;

async function connectWithRetry(): Promise<mysql.Pool> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const newPool = mysql.createPool(dbConfig);
            // Test the connection
            const connection = await newPool.getConnection();
            console.log(`Database connected successfully on attempt ${attempt}`);
            connection.release();
            return newPool; // Success
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED' && attempt < MAX_RETRIES) {
                console.warn(`Database connection refused (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Wait
            } else {
                console.error(`Database connection failed after ${attempt} attempts:`, error);
                throw error; // Re-throw the error if it's not ECONNREFUSED or max retries reached
            }
        }
    }
    // Should not be reached if MAX_RETRIES > 0, but satisfies TypeScript
    throw new Error('Database connection failed after maximum retries.');
}

// Initialize the pool (call this once when your app starts)
async function initializeDbPool() {
    if (!pool) {
        pool = await connectWithRetry();
    }
    return pool;
}

// Export the function to get the pool or the initialized pool directly
export default initializeDbPool; // Or export 'pool' after it's initialized

// --- In your server.ts (or wherever you need the pool) ---
// import initializeDbPool from './db';
//
// async function startServer() {
//     try {
//         const dbPool = await initializeDbPool();
//         // Now you can use dbPool safely
//         app.listen(port, () => {
//             console.log(`Server listening on port ${port}`);
//         });
//     } catch (error) {
//         console.error("Failed to initialize database pool. Server not started.");
//         process.exit(1);
//     }
// }
// startServer();

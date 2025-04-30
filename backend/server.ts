import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors'; // Uncomment if needed for cross-origin requests

// Import routers
import loginRouter from './login/login';
import signupRouter from './signup/signup'; // Import the new signup router
import feedRouter from './feed/feed';
import postRouter from './post/post.routes'; // Import the new post router

// Import and configure database connection
import pool from './db'; // Import the pool (ensures db.ts runs and connects)
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Use environment variable or default

// Middleware Setup

// Enable CORS if your frontend is on a different origin (e.g., different port during development)
app.use(cors()); // Configure with options if needed, e.g., app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

// Body parsing middleware
app.use(bodyParser.json()); // Parses application/json
app.use(bodyParser.urlencoded({ extended: true })); // Parses application/x-www-form-urlencoded

// Session middleware
// IMPORTANT: Replace 'your_secret_key' with a strong, environment-variable-stored secret!
// Configure session options according to your needs (store, cookie settings, etc.)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Use environment variable for secret
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true, // Prevent client-side JS access
        maxAge: 1000 * 60 * 60 * 24 // Example: 1 day expiration
    }
    // store: // Add a session store for production (e.g., connect-redis, connect-mongo)
}));

// --- Database Initialization ---
// Initialize your DB connection here if needed, making 'db' available
// Example: await db.connect();

// --- API Routes ---
// Mount the routers with path prefixes
app.use('/auth/login', loginRouter); // Login routes will be under /login/login
app.use('/auth/signup', signupRouter); // Signup routes will be under /signup/signup
app.use('/api/feed', feedRouter);   // Feed routes will be under /api/feed
app.use('/api/posts', postRouter);  // Mount the post router

// --- Static Files (Optional) ---
// If you want Express to serve static files from 'public' (like your original feed.html, CSS, frontend JS)
// import path from 'path';
// app.use(express.static(path.join(__dirname, '../../public')));
// app.get('*', (req, res) => { // Handle SPA routing if needed - redirect non-API calls to index.html
//    res.sendFile(path.join(__dirname, '../../public/index.html'));
// });


// --- Error Handling (Basic Example) ---
// Add more specific error handling middleware as needed
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Database host: ${process.env.DB_HOST}`); // Optional: Log DB host to confirm .env loaded
}); 

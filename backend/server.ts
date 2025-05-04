import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors'; // Uncomment if needed for cross-origin requests
import { get_user_by_id } from './database/database.mjs';

// Import routers
import loginRouter from './login/login';
import signupRouter from './signup/signup'; // Import the new signup router
import feedRouter from './feed/feed';
import postRouter from './post/post.routes'; // Import the new post router

// Import and configure database connection
import pool from './db'; // Import the pool (ensures db.ts runs and connects)

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
app.set('trust proxy', 1);

type UserRow = RowDataPacket & {
  username: string;
};

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

// --- route to check login status ---
app.get('/api/auth/status', async (req, res) => {
  if (req.session.userId) {
    const user = await get_user_by_id(req.session.userId);
    if (user) {
      res.json({ loggedIn: true, userId: user.user_id, username: user.username });
    } else {
      res.status(404).json({ loggedIn: false, error: 'User not found' });
    }
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout destroy the session
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});


// --- API Routes ---
// Mount the routers with path prefixes
app.use('/api/auth/login', loginRouter); // Login routes will be under /login/login
app.use('/api/auth/signup', signupRouter); // Signup routes will be under /signup/signup
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
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Database host: ${process.env.DB_HOST}`); // Optional: Log DB host to confirm .env loaded
}); 

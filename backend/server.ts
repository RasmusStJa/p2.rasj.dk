import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import cors from 'cors'; // Uncomment if needed for cross-origin requests
import { RowDataPacket } from 'mysql2';

// Import routers
import loginRouter from './login/login';
import signupRouter from './signup/signup'; // Import the new signup router
import feedRouter from './feed/feed';
import postRouter from './post/post.routes'; // Import the new post router
import followsRouter from './follows/follows';
import userRouter from './api/users'; // Adjust path as needed

// Import and configure database connection
import initializeDbPool from './db';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
app.set('trust proxy', 1);

interface UserRow extends RowDataPacket {
  user_id: number;
  username: string;
}

// Middleware Setup

// Enable CORS if your frontend is on a different origin (e.g., different port during development)
app.use(cors({
  origin: 'https://p2.rasj.dk',
  credentials: true
})); // Configure with options if needed, e.g., app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

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

// ——— Status endpoint ———
app.get('/api/auth/status', async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }

  try {
    const dbPool = await initializeDbPool();
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT user_id, username FROM users WHERE user_id = ?',
      [req.session.userId]
    );

    console.log('–– STATUS ROWS:', rows);

    if (rows.length === 0) {
      return res.status(404).json({ loggedIn: false, error: 'User not found' });
    }

    const user = rows[0] as UserRow;
    res.json({
      loggedIn: true,
      userId:   user.user_id,
      username: user.username,
    });
  } catch (err) {
    console.error('Error fetching login status:', err);
    res.status(500).json({ loggedIn: false, error: 'Internal server error' });
  }
});

// ——— Logout ———
app.post('/api/auth/logout', (req: Request, res: Response) => {
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
app.use('/api/follows', followsRouter);
app.use('/api/users', userRouter); // Mount the new user routes


// --- Error Handling (Basic Example) ---
// Add more specific error handling middleware as needed
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Database host: ${process.env.DB_HOST}`); // Optional: Log DB host to confirm .env loaded
}); 

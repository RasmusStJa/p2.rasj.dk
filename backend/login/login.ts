import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express'; // Explicit type import
import bcrypt from 'bcrypt';
import session from 'express-session'; // Import session to potentially extend Request type if needed, though middleware is moved
import pool from '../db'; // Import the database connection pool function

// Assuming db is properly configured and exported elsewhere, possibly in server.ts or a dedicated db file
// import db from '../db'; // Adjust path if necessary

// Extend the express-session Request type to include userId
// This allows TypeScript to recognize req.session.userId
declare module 'express-session' {
    interface SessionData {
        userId?: number; // Or string, depending on your user ID type
    }
}


const router: Router = express.Router();

// Placeholder for db connection - this should be handled globally, likely in server.ts
// const db = require('../db'); // Remove this - db connection should be accessible

// /login route - path changed to '/' as '/login' prefix will be added in server.ts
router.post('/', (async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get the actual pool connection to query
        const dbPool = await pool();

        // Query user from database
        // Ensure your 'users' table has 'user_id', 'email', and 'password_hash' columns
        const query = 'SELECT user_id, email, password_hash FROM users WHERE email = ?';
        const [rows]: [any[], any] = await dbPool.query(query, [email]);
        const user = rows[0];

        if (!user) {
            console.warn(`Login attempt failed: Email not found - ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare submitted password with stored hash (use password_hash column)
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            console.warn(`Login attempt failed: Invalid password for email - ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Authentication successful
        // Regenerate session ID to prevent session fixation
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                return res.status(500).json({ error: 'Internal server error during login' });
            }

            // Store user ID in session (use user_id column)
            req.session.userId = user.user_id;
            console.log(`Login successful: User ID ${user.user_id} logged in. Session ID: ${req.session.id}`);

            // Send success response (avoid redirect for API)
            res.json({ message: 'Login successful', userId: user.user_id });
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler); // Add type assertion


export default router;


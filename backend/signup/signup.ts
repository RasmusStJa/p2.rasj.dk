import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../db'; // Import the database connection pool function

// Extend the express-session Request type if you plan to log in the user immediately
// You'll need to import session and add the declare module block as in login.ts
/*
import session from 'express-session';
declare module 'express-session' {
    interface SessionData {
        userId?: number; // Or string, depending on your user ID type
    }
}
*/

const router: Router = express.Router();

// POST / (mounted at /auth/signup in server.ts)
router.post('/', (async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const username = email.split('@')[0];

        // Get the actual pool connection to query
        const dbPool = await pool();

        // Check if user already exists (by email)
        const checkUserQuery = 'SELECT user_id, email FROM users WHERE email = ?';
        const [existingUsers]: [any[], any] = await dbPool.query(checkUserQuery, [email]);

        if (existingUsers.length > 0) {
            // Provide more specific conflict information
            const existing = existingUsers[0];
            let conflictField = 'unknown';
            if (existing.email === email) {
                conflictField = 'email';
            }
            console.warn(`Signup conflict: Attempted email=${email}. Conflict on ${conflictField}.`);
            return res.status(409).json({ error: `User with this ${conflictField} already exists` }); // 409 Conflict
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        // Also include the 'role', defaulting to 'student' for signup
        const insertUserQuery = 'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)';
        const role = 'student'; // Default role for signup
        const [result]: [any, any] = await dbPool.query(insertUserQuery, [username, email, hashedPassword, role]);

        // Optionally log the user in immediately after signup by setting the session
        // const userId = result.insertId;
        // req.session.userId = userId; // Make sure session middleware runs before this route in server.ts

        console.log(`User created successfully: ID=${result.insertId}, Email=${email}, Username=${username}`);
        // Ensure the correct column name user_id is used if your schema uses SERIAL PRIMARY KEY which might be named user_id
        // Assuming result.insertId gives the correct ID. Adjust if your DB driver returns it differently.
        res.status(201).json({ message: 'User created successfully', userId: result.insertId }); // 201 Created

    } catch (error) {
        console.error('Signup error:', error);
        // Consider more specific error handling based on potential DB errors (e.g., constraint violations)
        res.status(500).json({ error: 'Internal server error during signup' });
    }
}) as RequestHandler); // Type assertion for async route handler

export default router;

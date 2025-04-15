import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express'; // Explicit type import
import bcrypt from 'bcrypt';
import session from 'express-session'; // Import session to potentially extend Request type if needed, though middleware is moved

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

        // !! IMPORTANT !!
        // You need to make sure the 'db' object is accessible here.
        // It might need to be imported from your central db setup file.
        // For now, I'm commenting out the database interaction.
        // Replace the commented section with your actual database logic.

        /*
        // Query user from database
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows]: [any[], any] = await db.query(query, [email]); // Assuming db.query returns a promise like [rows, fields]
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Authentication successful
        req.session.userId = user.id; // Store user ID in session
        res.redirect('/dashboard'); // Redirect to dashboard - Or perhaps send JSON response? e.g., res.json({ message: 'Login successful' });
        */

        // Placeholder response until DB logic is integrated
        console.log(`Login attempt: Email=${email}`); // Log attempt for now
        if (email === 'test@example.com' && password === 'password123') { // Basic check without bcrypt/db for now
             // Assuming db gives user.id = 1 for test user
             req.session.userId = 1;
             console.log('Session userId set:', req.session.userId);
             // Redirect or send success message
             // res.redirect('/dashboard'); // Redirect might not work well with API calls, consider JSON
             res.json({ message: 'Login successful (placeholder)', userId: 1 });
        } else {
             res.status(401).json({ error: 'Invalid email or password (placeholder)' });
        }


    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler); // Add type assertion


export default router;


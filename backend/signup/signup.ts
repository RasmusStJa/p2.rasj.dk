import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express';
import { signupUser } from '../api/auth';

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

        // Enforce AAU email domain check
        const aauDomainRegex = /^[^@]+@[^@]*aau\.dk$/i;
        if (!aauDomainRegex.test(email)) {
            return res.status(400).json({ error: 'Email must be an AAU email address (contain aau.dk)' });
        }

        const result = await signupUser({ email, password });
        
        console.log(`User created successfully: ID=${result.userId}, Email=${email}, Username=${result.username}`);
        res.status(201).json({ 
            message: 'User created successfully', 
            userId: result.userId 
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(409).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal server error during signup' });
    }
}) as RequestHandler);

export default router;

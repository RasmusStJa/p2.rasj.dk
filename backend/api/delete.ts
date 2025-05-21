import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express'; 
import initializeDbPool from '../db';

declare module 'express-session' {
    interface SessionData {
        userId?: number; 
    }
}


const router: Router = express.Router();

const isAuthenticated: RequestHandler = (req, res, next) => {
    if (req.session?.userId) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
    const userId = req.session.userId!;
    const db = await initializeDbPool();
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

            // Step 1: Get all post_ids created by this user
        const [posts] = await connection.query('SELECT post_id FROM posts WHERE user_id = ?', [userId]);
        const postIds = (posts as any[]).map(p => p.post_id);

        if (postIds.length > 0) {
            // Step 2: Delete post reactions to the user's posts
            await connection.query('DELETE FROM post_reactions WHERE post_id IN (?)', [postIds]);

            // Step 3: Delete comments on the user's posts
            await connection.query('DELETE FROM comments WHERE post_id IN (?)', [postIds]);
        }

        // Step 4: Delete the user's own posts
        await connection.query('DELETE FROM posts WHERE user_id = ?', [userId]);

        // Step 5: Delete comments the user made on other posts
        await connection.query('DELETE FROM comments WHERE user_id = ?', [userId]);

        // Step 6: Delete from friends (both sides of the relationship)
        await connection.query('DELETE FROM friends WHERE user_id = ? OR friend_id = ?', [userId, userId]);

        // Step 7: Delete the user's profile if it exists
        await connection.query('DELETE FROM user_profiles WHERE user_id = ?', [userId]);

        // Step 8: Delete the user
        await connection.query('DELETE FROM users WHERE user_id = ?', [userId]);

        await connection.commit();

        // destroy the session
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'User and all associated data deleted successfully.' });
        });

    } catch (error) {
        await connection.rollback();
        console.error('Delete error:', error);
        res.status(500).json({ message: `Error deleting user account: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
        connection.release();
    }
});

export default router;

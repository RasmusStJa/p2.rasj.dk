import express, { Request, Response, Router } from 'express';
import getDbPool from '../db';
import { RowDataPacket } from 'mysql2/promise';

const router: Router = express.Router();

router.get('/:id', async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const pool = await getDbPool();

        // Fetch user info
        const [userRows] = await pool.query<RowDataPacket[]>(
            `SELECT user_id, username, email, created_at FROM users WHERE user_id = ?`,
            [userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userRows[0];

        // Fetch user posts
        const [posts] = await pool.query<RowDataPacket[]>(
            `SELECT post_id, content, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );

        res.json({ user, posts });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
});

export default router;

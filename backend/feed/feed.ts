import express, { Request, Response, Router } from 'express';
import getDbPool from '../db';
import { RowDataPacket } from 'mysql2/promise';

interface FeedPost extends RowDataPacket {
    post_id: number;
    content: string;
    created_at: Date;
    username: string;
}

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    const userId = req.session?.userId ?? null;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        const pool = await getDbPool();

        const query = `
            SELECT p.post_id, p.content, p.created_at, u.username
            FROM posts p
            JOIN users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC;
        `;

        const [rows] = await pool.query<FeedPost[]>(query);
        res.json(rows);

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Failed to fetch feed' });
    }
});

export default router;

import express, { Request, Response, Router } from 'express';
import getDbPool from '../db';
import { RowDataPacket } from 'mysql2/promise';

interface FeedPost extends RowDataPacket {
    post_id: number;
    content: string;
    created_at: Date;
    username: string;
    reactions: {
        like: number;
        laugh: number;
        heart: number;
    };
}

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    const userId = req.session?.userId ?? null;

    console.log('[DEBUG] /api/feed called by userId:', userId);

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

        const [posts] = await pool.query<FeedPost[]>(query);

        for (const post of posts) {
            // Fetch reaction counts for each post
            const [reactionRows] = await pool.query<RowDataPacket[]>(
                `SELECT reaction_type, COUNT(*) as count
                 FROM post_reactions
                 WHERE post_id = ?
                 GROUP BY reaction_type`,
                [post.post_id]
            );

            // Initialize the reactions
            post.reactions = {
                like: 0,
                laugh: 0,
                heart: 0
            };

            // Populate the reaction counts
            reactionRows.forEach(row => {
                const type = row.reaction_type as 'like' | 'laugh' | 'heart';
                post.reactions[type] = row.count;
            });
        }

        res.json(posts);

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Failed to fetch feed' });
    }
});

export default router;

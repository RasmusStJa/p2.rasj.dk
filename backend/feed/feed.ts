import express, { Request, Response, Router } from 'express';
import getDbPool from '../db'; // Import the ASYNC function that gets the pool
// Import RowDataPacket type for explicit typing of query results
import { RowDataPacket } from 'mysql2/promise';

// Define an interface for the expected shape of a feed post
// Extend RowDataPacket to satisfy mysql2's type requirements
interface FeedPost extends RowDataPacket {
    id: number;
    content: string;
    created_at: Date; // Adjust type if necessary (e.g., string)
    author: string;
}

const router: Router = express.Router();

// GET /api/feed - Fetch the user's personalized feed
router.get('/', async (req: Request, res: Response) => {
    // --- Authentication Check ---
    // Make sure session middleware is configured correctly in server.ts
    // and userId is set upon successful login.
    const userId = req.session?.userId ?? null;

    if (!userId) {
        // If no user ID in session, return unauthorized
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }

    try {
        // Get the actual pool object by calling the imported function
        const pool = await getDbPool();

        // --- Database Query ---
        // Fetches posts that have tags matching the user's interests
        // Also fetches the username of the post's author
        const query = `
            SELECT DISTINCT p.id, p.content, p.created_at, u.username AS author
            FROM posts p
            JOIN users u ON p.user_id = u.id        -- Join to get author username
            JOIN post_tags pt ON p.id = pt.post_id  -- Join posts to their tags
            JOIN user_interests ui ON pt.tag_id = ui.tag_id -- Join tags to user interests
            WHERE ui.user_id = ?                   -- Filter by the logged-in user's interests (use ? for mysql2)
            ORDER BY p.created_at DESC;             -- Show newest posts first
        `;

        // Execute the query: mysql2/promise returns an array [rows, fields]
        // Destructure the first element (rows) and provide the explicit type FeedPost[]
        const [rows] = await pool.query<FeedPost[]>(query, [userId]);

        // Send the fetched posts (rows) as the response
        res.json(rows); // Send the rows directly

    } catch (error) {
        console.error('Error fetching feed:', error);
        res.status(500).json({ message: 'Failed to fetch feed' });
    }
});

export default router; 
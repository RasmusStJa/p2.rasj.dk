import {Request, Response} from 'express';
// Import the database pool
import getDbPool from '../db'; 
import { RowDataPacket, OkPacket } from 'mysql2'; // Import necessary types from mysql2

export const createPost = async (req: Request, res: Response) => {
    // Extract user_id and content from the request body
    const userId = req.session?.userId;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: 'Post content cannot be empty' });
    }

    try {
        const pool = await getDbPool();
        const [result] = await pool.query<OkPacket>(
            'INSERT INTO posts (user_id, content) VALUES (?, ?)',
            [userId, content]
        );

        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT post_id, content, created_at FROM posts WHERE post_id = ?',
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ message: 'Failed to create post' });
    }
};

// React  to post
export const reactToPost = async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    const postId = parseInt(req.params.id, 10);
    const { reactionType } = req.body;

    const validReactions = ['like', 'laugh', 'heart'];

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (!validReactions.includes(reactionType)) {
        return res.status(400).json({ message: 'Invalid reaction type' });
    }
    if (isNaN(postId)) return res.status(400).json({ message: 'Invalid post ID' });

    try {
        const pool = await getDbPool();

        // Check if this reaction already exists
        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM post_reactions WHERE user_id = ? AND post_id = ? AND reaction_type = ?',
            [userId, postId, reactionType]
        );

        if (existing.length > 0) {
            // User is toggling off the reaction
            await pool.query(
                'DELETE FROM post_reactions WHERE user_id = ? AND post_id = ? AND reaction_type = ?',
                [userId, postId, reactionType]
            );
        } else {
            // Add new reaction
            await pool.query(
                'INSERT INTO post_reactions (user_id, post_id, reaction_type) VALUES (?, ?, ?)',
                [userId, postId, reactionType]
            );
        }

        // Return updated reaction counts
        const [counts] = await pool.query<RowDataPacket[]>(
            `SELECT reaction_type, COUNT(*) as count
             FROM post_reactions
             WHERE post_id = ?
             GROUP BY reaction_type`,
            [postId]
        );

        const reactionSummary = {
            like: 0,
            laugh: 0,
            heart: 0,
        };

        counts.forEach(row => {
            reactionSummary[row.reaction_type as 'like' | 'laugh' | 'heart'] = row.count
        });

        res.json({ message: 'Reaction updated', reactions: reactionSummary });
    } catch (err) {
        console.error('Error reacting to post:', err);
        res.status(500).json({ message: 'Failed to react to post' });
    }
};

// --- Comment on Post ---
export const commentOnPost = async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    const postId = parseInt(req.params.id, 10);
    const { comment } = req.body;

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (!comment?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
    if (isNaN(postId)) return res.status(400).json({ message: 'Invalid post ID' });

    try {
        const pool = await getDbPool();

        const [result] = await pool.query<OkPacket>(
            'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
            [userId, postId, comment]
        );

        res.status(201).json({ message: 'Comment added', commentId: result.insertId });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ message: 'Failed to add comment' });
    }
};


// --- Comment on Post ---
export const commentsOnPost = async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    const postId = parseInt(req.params.id, 10);
    const pool = await getDbPool();

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (isNaN(postId)) return res.status(400).json({ message: 'Invalid post ID' });

    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT c.comment_id, c.content, c.created_at, u.username
            FROM comments c
            JOIN users u ON c.user_id = u.user_id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC`,
            [postId]
            );
            res.json(rows);
    } catch (err) {
        console.error('Failed to fetch comments:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

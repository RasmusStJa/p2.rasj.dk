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

// --- Like Post ---
export const likePost = async (req: Request, res: Response) => {
    const userId = req.session?.userId;
    const postId = parseInt(req.params.id, 10);

    if (!userId) return res.status(401).json({ message: 'Not logged in' });
    if (isNaN(postId)) return res.status(400).json({ message: 'Invalid post ID' });

    try {
        const pool = await getDbPool();

        // Check if user already liked
        const [existingLikes] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM likes WHERE user_id = ? AND post_id = ?',
            [userId, postId]
        );

        if (existingLikes.length > 0) {
            return res.status(400).json({ message: 'You already liked this post' });
        }

        await pool.query<OkPacket>(
            'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
            [userId, postId]
        );

        res.status(201).json({ message: 'Post liked' });
    } catch (err) {
        console.error('Error liking post:', err);
        res.status(500).json({ message: 'Failed to like post' });
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
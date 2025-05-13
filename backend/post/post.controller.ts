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

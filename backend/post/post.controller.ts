import {Request, Response} from 'express';
// Import the database pool
import getDbPool from '../db'; 
import { RowDataPacket, OkPacket } from 'mysql2'; // Import necessary types from mysql2

export const createPost = async (req: Request, res: Response) => {
    // Extract user_id and content from the request body
    const {user_id, content} =req.body;

    // Consider adding more robust validation here (e.g., check content length)
    if (!user_id || typeof user_id !== 'number' || !content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: 'Invalid input: user_id (number) and content (non-empty string) are required.' });
    }

    try{
        // --- THIS IS THE CRITICAL LINE ---
        // Ensure you are calling the imported function and awaiting it
        const pool = await getDbPool();
        // --- END CRITICAL LINE ---

        // Now 'pool' should be the actual Pool object
        const sql = 'INSERT INTO posts (user_id, content) VALUES (?, ?)';
        
        // Execute the query using the pool
        const [result] = await pool.query<OkPacket>(sql, [user_id, content]);

        // Check if the insertion was successful
        if (result.affectedRows === 1 && result.insertId) {
            // Fetch the newly created post to return it in the response
            const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM posts WHERE post_id = ?', [result.insertId]);
            
            if (rows.length > 0) {
                const newPost = rows[0];
                 // Send the newly created post back as a response
                res.status(201).json(newPost);
            } else {
                 // Should not happen if insertId is valid, but good to handle
                console.error('Failed to fetch the newly created post with id:', result.insertId);
                res.status(500).json({ message: 'Post created but failed to retrieve.' });
            }
        } else {
            console.error('Failed to insert post, result:', result);
            res.status(500).json({ message: 'Failed to create post.' });
        }

    } catch (error) {
        console.error('Error creating post:', error);
        // You might want to check for specific MySQL error codes (e.g., foreign key constraint violation)
        res.status(500).json({ message: 'Internal server error while creating post.' });
    }
};

// You can add other controller functions here later (e.g., getPosts)
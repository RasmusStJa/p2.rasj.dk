import express, { Request, Response, Router } from 'express';
import initializeDbPool from '../db'; 
import { Pool } from 'mysql2/promise'; 

interface Friends {
    user_id: number;         
    friend_id: number;        
    status: string;          
    created_at?: string;    
}

const router = Router();
let dbPool: Pool;

// Initialize DB Pool
initializeDbPool().then(pool => {
    dbPool = pool;
}).catch(error => {
    console.error("Failed to initialize database pool for friends API:", error);
});

// Middleware to check auth
const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session?.userId) {
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized: Please log in.' });
    }
};

// Send a friend request
router.post('/request', isAuthenticated, async (req: Request, res: Response) => {
    const senderId = req.session.userId;
    const { friendId } = req.body;

    if (!friendId || friendId === senderId) {
        return res.status(400).json({ error: "Invalid friend ID." });
    }

    try {
        const [existing] = await dbPool.query(
            `SELECT * FROM friends WHERE user_id = ? AND friend_id = ?`,
            [senderId, friendId]
        ) as any;

        if (existing.length > 0) {
            return res.status(409).json({ error: "Friend request already exists." });
        }

        await dbPool.query(
            `INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')`,
            [senderId, friendId]
        );

        res.json({ message: "Friend request sent." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Answer a friend request

router.post('/answer', isAuthenticated, async (req: Request, res: Response) => {
    const receiverId = req.session.userId;
    const { senderId, action } = req.body;

    if (!senderId || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: "Invalid request." });
    }

    try {
        // Check if the request exists and is pending
        const [rows] = await dbPool.query(
            `SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
            [senderId, receiverId]
        ) as any;

        if (rows.length === 0) {
            return res.status(404).json({ error: "No pending friend request found." });
        }

        if (action === 'accept') {
            // Update status to accepted
            await dbPool.query(
                `UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?`,
                [senderId, receiverId]
            );

            // Optional: Add reciprocal friendship
            await dbPool.query(
                `INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')`,
                [receiverId, senderId]
            );

            res.json({ message: "Friend request accepted." });

        } else if (action === 'reject') {
            await dbPool.query(
                `DELETE FROM friends WHERE user_id = ? AND friend_id = ?`,
                [senderId, receiverId]
            );

            res.json({ message: "Friend request rejected." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/status/:targetUserId', isAuthenticated, async (req: Request, res: Response) => {
    const currentUserId = req.session.userId;
    const targetUserId = parseInt(req.params.targetUserId, 10);

    if (!targetUserId || currentUserId === targetUserId) {
        return res.json({ status: 'none' });
    }

    try {
        const [rows] = await dbPool.query(
            `SELECT status FROM friends WHERE user_id = ? AND friend_id = ?`,
            [currentUserId, targetUserId]
        ) as any;

        if (rows.length === 0) {
            return res.json({ status: 'none' });
        }

        return res.json({ status: rows[0].status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to get friendship status." });
    }
});

router.post('/delete', isAuthenticated, async (req: Request, res: Response) => {
    const currentUserId = req.session.userId;
    const { friendId } = req.body;

    if (!friendId || friendId === currentUserId) {
        return res.status(400).json({ error: "Invalid friend ID." });
    }

    try {
        await dbPool.query(
            `DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
            [currentUserId, friendId, friendId, currentUserId]
        );

        res.json({ message: "Friendship removed or request cancelled." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete friendship." });
    }
});

router.get('/requests', isAuthenticated, async (req: Request, res: Response) => {
    const currentUserId = req.session.userId;

    try {
        const [rows] = await dbPool.query(
            `
            SELECT
            f.user_id   AS senderId,
            u.username   AS senderName,
            f.created_at
            FROM friends f
            JOIN users u ON f.user_id = u.user_id
            WHERE f.friend_id = ? AND f.status = 'pending'
            `,
            [currentUserId]
        ) as any;

        res.json({ requests: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch friend requests." });
    }
});

export default router;

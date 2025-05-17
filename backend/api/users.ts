import express, { Request, Response, Router } from 'express';
import initializeDbPool from '../db'; // Your database initialization
import { Pool } from 'mysql2/promise'; // Or your specific Pool type
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';

// Define an interface for the combined User Profile data
interface UserProfile {
    user_id: number;         // From users table
    username: string;        // From users table
    email: string;           // From users table
    role: string;            // From users table
    displayName?: string | null; // From user_profiles table
    program?: string | null;     // From user_profiles table
    bio?: string | null;         // From user_profiles table
    created_at?: string;     // From users table (optional to send to frontend)
}

// Middleware to check if user is authenticated 
const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized: Please log in.' });
};

const router = Router();
let dbPool: Pool;

initializeDbPool().then(pool => {
    dbPool = pool;
}).catch(error => {
    console.error("Failed to initialize database pool for users API:", error);
});

// --- API Endpoints ---

// GET /api/users/me - Get current authenticated user's profile
router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
    if (!dbPool) {
        return res.status(503).json({ message: 'Database service not available.' });
    }
    const userId = req.session.userId;

    try {
        const sql = `
            SELECT
                u.user_id,
                u.username,
                u.email,
                u.role,
                u.created_at,
                up.display_name AS displayName,
                up.program,
                up.bio
            FROM
                users u
            LEFT JOIN
                user_profiles up ON u.user_id = up.user_id
            WHERE
                u.user_id = ?
        `;
        const [rows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(sql, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // The query returns RowDataPacket, cast it to UserProfile
        // Note: SQL returns 'display_name', we aliased it to 'displayName' for consistency
        const userProfile: UserProfile = rows[0] as UserProfile;
        res.json(userProfile);

    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to retrieve user profile.' });
    }
});

// PUT /api/users/me - Update current authenticated user's profile
router.put('/me', isAuthenticated, async (req: Request, res: Response) => {
    console.log('--- PUT /api/users/me route handler ENTERED ---');

    if (!dbPool) {
        console.error('PUT /api/users/me: dbPool not available!');
        return res.status(503).json({ message: 'Database service not available.' });
    }
    const userId = req.session.userId;
    // console.log(`PUT /api/users/me: Received request for userId: ${userId}`);

    const {
        // role, // Not typically sent from basic profile edit form
        displayName, 
        program,     
        bio          
    } = req.body;
    // console.log(`PUT /api/users/me: Body params:`, { displayName, program, bio });

    const connection = await dbPool.getConnection();
    // console.log('PUT /api/users/me: Database connection obtained.');
    await connection.beginTransaction();
    // console.log('PUT /api/users/me: Transaction started.');

    try {
        // 1. Update 'users' table (only if 'role' is provided)
        // --- COMMENT OUT OR DELETE THIS ENTIRE 'if' BLOCK ---
        /*
        if (role !== undefined) { 
            if (typeof role !== 'string' || !['student', 'staff'].includes(role.toLowerCase())) { // Validate role
                await connection.rollback();
                return res.status(400).json({ message: 'Invalid role specified. Must be "student" or "staff".' });
            }
            await connection.query<ResultSetHeader>(
                'UPDATE users SET role = ? WHERE user_id = ?',
                [role, userId]
            );
        }
        */
        // --- END OF BLOCK TO COMMENT OR DELETE ---

        // 2. Update 'user_profiles' table
        // Prepare fields for user_profiles update or insert
        const profileFields: { [key: string]: any } = {};
        if (displayName !== undefined) profileFields.display_name = displayName;
        if (program !== undefined) profileFields.program = program; // Keep if you might send it
        if (bio !== undefined) profileFields.bio = bio;

        if (Object.keys(profileFields).length > 0) {
            // Try to update existing profile. If no row exists, insert one.
            // This is an "UPSERT" operation.
            // For MySQL: INSERT ... ON DUPLICATE KEY UPDATE
            // For PostgreSQL: INSERT ... ON CONFLICT ... DO UPDATE
            // Assuming MySQL syntax for user_profiles PK (BIGINT UNSIGNED)
            const upsertSql = `
                INSERT INTO user_profiles (user_id, ${Object.keys(profileFields).join(', ')})
                VALUES (?, ${Object.values(profileFields).map(() => '?').join(', ')})
                ON DUPLICATE KEY UPDATE
                ${Object.keys(profileFields).map(key => `${key} = VALUES(${key})`).join(', ')}
            `;
            const upsertValues = [userId, ...Object.values(profileFields)];
            
            await connection.query<ResultSetHeader>(upsertSql, upsertValues);
        }

        // --- Commit transaction ---
        await connection.commit();

        // Fetch and return the updated profile (as in the GET request)
        const getUpdatedProfileSql = `
            SELECT
                u.user_id, u.username, u.email, u.role, u.created_at,
                up.display_name AS displayName, up.program, up.bio
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE u.user_id = ?
        `;
        const [updatedRows]: [RowDataPacket[], FieldPacket[]] = await connection.query<RowDataPacket[]>(
            getUpdatedProfileSql,
            [userId]
        );
        
        if (updatedRows.length === 0) {
            // This case should ideally not be reached if the user exists and the update was successful.
            // However, if it does, it's an inconsistent state.
            // We'll signal an error that will be caught by the catch block.
            throw new Error('Updated user profile could not be retrieved after commit.');
        }
        res.json(updatedRows[0] as UserProfile);

    } catch (error) {
        // console.log('PUT /api/users/me: ERROR caught in try-catch block.');
        // Attempt to rollback the transaction if an error occurs.
        // If rollback fails or transaction was already handled, this might throw, but we are already in an error state.
        try {
            if (connection) { // Check if connection was successfully obtained
                 await connection.rollback(); 
            }
        } catch (rollbackError) {
            console.error('Error during rollback attempt:', rollbackError);
        }

        console.error('Error updating user profile (users.ts PUT /me):', error); 
        // Check if response has already been sent before sending another one.
        if (!res.headersSent) {
            res.status(500).json({ message: 'Failed to update user profile.' });
        }
    } finally {
        // console.log('PUT /api/users/me: Releasing database connection.');
        if (connection) { // Ensure connection exists before trying to release
            connection.release(); 
        }
    }
});

export default router;

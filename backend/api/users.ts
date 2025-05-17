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
    console.log(`PUT /api/users/me: Received request for userId: ${userId}`);

    const {
        displayName,
        program,
        bio
    } = req.body;
    console.log(`PUT /api/users/me: Body params:`, { displayName, program, bio });

    let connection;

    try {
        connection = await dbPool.getConnection();
        console.log('PUT /api/users/me: Database connection obtained.');
        await connection.beginTransaction();
        console.log('PUT /api/users/me: Transaction started.');

        // 2. Update 'user_profiles' table
        const profileFields: { [key: string]: any } = {};
        if (displayName !== undefined) profileFields.display_name = displayName;
        if (program !== undefined) profileFields.program = program;
        if (bio !== undefined) profileFields.bio = bio;

        if (Object.keys(profileFields).length > 0) {
            const upsertSql = `
                INSERT INTO user_profiles (user_id, ${Object.keys(profileFields).join(', ')})
                VALUES (?, ${Object.values(profileFields).map(() => '?').join(', ')})
                ON DUPLICATE KEY UPDATE
                ${Object.keys(profileFields).map(key => `${key} = VALUES(${key})`).join(', ')}
            `;
            const upsertValues = [userId, ...Object.values(profileFields)];
            console.log('PUT /api/users/me: Executing UPSERT SQL:', upsertSql, upsertValues);
            await connection.query<ResultSetHeader>(upsertSql, upsertValues);
            console.log('PUT /api/users/me: UPSERT SQL executed.');
        }

        await connection.commit();
        console.log('PUT /api/users/me: Transaction committed.');

        const getUpdatedProfileSql = `
            SELECT
                u.user_id, u.username, u.email, u.role, u.created_at,
                up.display_name AS displayName, up.program, up.bio
            FROM users u
            LEFT JOIN user_profiles up ON u.user_id = up.user_id
            WHERE u.user_id = ?
        `;
        console.log('PUT /api/users/me: Fetching updated profile SQL:', getUpdatedProfileSql, [userId]);
        const [updatedRows]: [RowDataPacket[], FieldPacket[]] = await connection.query<RowDataPacket[]>(
            getUpdatedProfileSql,
            [userId]
        );
        console.log('PUT /api/users/me: Updated profile fetched, rows count:', updatedRows.length);
        
        if (updatedRows.length === 0) {
            console.error('PUT /api/users/me: Updated user profile could not be retrieved after commit. UserID:', userId);
            throw new Error('Updated user profile could not be retrieved after commit.');
        }
        console.log('PUT /api/users/me: Sending updated profile data as JSON.');
        res.json(updatedRows[0] as UserProfile);

    } catch (error: any) {
        console.error('PUT /api/users/me: ERROR caught in try-catch block. Details:', error);
        if (connection) {
            try {
                console.log('PUT /api/users/me: Attempting to rollback transaction.');
                await connection.rollback();
                console.log('PUT /api/users/me: Transaction rolled back.');
            } catch (rollbackError) {
                console.error('PUT /api/users/me: Error during rollback attempt:', rollbackError);
            }
        }

        if (!res.headersSent) {
            console.log('PUT /api/users/me: Headers not sent, sending JSON error response.');
            res.status(500).json({ message: error.message || 'Failed to update user profile due to an internal error.' });
        } else {
            console.log('PUT /api/users/me: Headers already sent, cannot send JSON error response.');
        }
    } finally {
        if (connection) {
            try {
                console.log('PUT /api/users/me: Releasing database connection in finally block.');
                await connection.release();
                console.log('PUT /api/users/me: Database connection released.');
            } catch (releaseError) {
                console.error('PUT /api/users/me: Error releasing database connection in finally block:', releaseError);
            }
        } else {
            console.log('PUT /api/users/me: No database connection to release in finally block.');
        }
    }
});

export default router;

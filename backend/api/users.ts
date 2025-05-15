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

// Middleware to check if user is authenticated (example - ensure this is your actual auth check)
const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.user && (req.user as any).id) { // Adjust req.user.id to your actual user identifier path
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
    const userId = (req.user as any).id;

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
    if (!dbPool) {
        return res.status(503).json({ message: 'Database service not available.' });
    }
    const userId = (req.user as any).id;
    const {
        role, // Goes to 'users' table
        displayName, // Goes to 'user_profiles' table (as display_name)
        program,     // Goes to 'user_profiles' table
        bio          // Goes to 'user_profiles' table
    } = req.body;

    // --- Start a transaction ---
    // Transactions are important here to ensure that updates to multiple tables
    // either all succeed or all fail.
    const connection = await dbPool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Update 'users' table (only if 'role' is provided)
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

        // 2. Update 'user_profiles' table
        // Prepare fields for user_profiles update or insert
        const profileFields: { [key: string]: any } = {};
        if (displayName !== undefined) profileFields.display_name = displayName; // map to schema column name
        if (program !== undefined) profileFields.program = program;
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
        const [updatedRows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
            getUpdatedProfileSql,
            [userId]
        );
        
        if (updatedRows.length === 0) {
            // Should not happen if user exists and updates were committed
            return res.status(404).json({ message: 'Updated user profile could not be retrieved.' });
        }
        res.json(updatedRows[0] as UserProfile);

    } catch (error) {
        await connection.rollback(); // Rollback on any error
        console.error('Error updating user profile:', error);
        // Check for specific SQL errors if needed, e.g., duplicate entry for unique constraints
        // if not handled by UPSERT directly (though UPSERT should handle PK conflicts).
        res.status(500).json({ message: 'Failed to update user profile.' });
    } finally {
        connection.release(); // Always release the connection
    }
});

export default router;

import initializeDbPool from '../db';
import { ResultSetHeader, RowDataPacket, FieldPacket } from 'mysql2/promise';

// Define an interface for the user object returned by getFollowers and getFollowing
interface UserIdentifier {
    user_id: number; // Or string, depending on your schema
    username: string;
}

// Define a more specific type for query results if possible, e.g., from a library like 'mysql2'
// For now, we'll use 'any' for simplicity, but it's good practice to type these
// import { RowDataPacket } from 'mysql2';

// API Functions
export async function followUser(followerId: number, followingId: number): Promise<void> {
    const dbPool = await initializeDbPool();

    // Check if the user to follow exists
    const [userRows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
        'SELECT user_id FROM users WHERE user_id = ?',
        [followingId]
    );

    if (!userRows.length) {
        throw new Error('User not found');
    }

    // Check if already following
    const [existingFollow]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    if (existingFollow.length > 0) {
        throw new Error('Already following this user');
    }

    // Create the follow relationship
    await dbPool.query<ResultSetHeader>( // ResultSetHeader for INSERT
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
    );
}

export async function unfollowUser(followerId: number, followingId: number): Promise<void> {
    const dbPool = await initializeDbPool();

    // For DELETE, UPDATE, INSERT, the first element of the tuple is ResultSetHeader
    const [result]: [ResultSetHeader, FieldPacket[]] = await dbPool.query<ResultSetHeader>(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Follow relationship not found');
    }
}

export async function getFollowers(userId: number): Promise<UserIdentifier[]> {
    const dbPool = await initializeDbPool();

    // Specify RowDataPacket[] for queries returning rows
    // Then cast the result to your specific interface if the structure matches
    const [followersRows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
        `SELECT u.user_id, u.username 
         FROM follows f 
         JOIN users u ON f.follower_id = u.user_id 
         WHERE f.following_id = ?`,
        [userId]
    );
    // You might need to cast or map if RowDataPacket doesn't directly match UserIdentifier
    // For example, if column names are different or need transformation.
    // Assuming direct compatibility for now:
    return followersRows as UserIdentifier[];
}

export async function getFollowing(userId: number): Promise<UserIdentifier[]> {
    const dbPool = await initializeDbPool();

    const [followingRows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
        `SELECT u.user_id, u.username 
         FROM follows f 
         JOIN users u ON f.following_id = u.user_id 
         WHERE f.follower_id = ?`,
        [userId]
    );
    // Assuming direct compatibility:
    return followingRows as UserIdentifier[];
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const dbPool = await initializeDbPool();

    const [rows]: [RowDataPacket[], FieldPacket[]] = await dbPool.query<RowDataPacket[]>(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    return rows.length > 0;
}

// Example usage in your API (updated for TypeScript):
async function exampleUsage() {
    const followerId = 1;
    const followingId = 2;
    try {
        await followUser(followerId, followingId);
        console.log('Successfully followed user.');

        const followers = await getFollowers(followingId);
        console.log('Followers:', followers);

        const isNowFollowing = await isFollowing(followerId, followingId);
        console.log(`User ${followerId} is following user ${followingId}: ${isNowFollowing}`);

        await unfollowUser(followerId, followingId);
        console.log('Successfully unfollowed user.');

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
        } else {
            console.error('An unexpected error occurred');
        }
    }
}
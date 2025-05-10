import initializeDbPool from '../db';

// API Functions
export async function followUser(followerId, followingId) {
    const dbPool = await initializeDbPool();

    // Check if the user to follow exists
    const [userRows] = await dbPool.query(
        'SELECT user_id FROM users WHERE user_id = ?',
        [followingId]
    );

    if (!userRows.length) {
        throw new Error('User not found');
    }

    // Check if already following
    const [existingFollow] = await dbPool.query(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    if (existingFollow.length > 0) {
        throw new Error('Already following this user');
    }

    // Create the follow relationship
    await dbPool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
    );
}

export async function unfollowUser(followerId, followingId) {
    const dbPool = await initializeDbPool();

    const [result] = await dbPool.query(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    if (result.affectedRows === 0) {
        throw new Error('Follow relationship not found');
    }
}

export async function getFollowers(userId) {
    const dbPool = await initializeDbPool();

    const [followers] = await dbPool.query(
        `SELECT u.user_id, u.username 
         FROM follows f 
         JOIN users u ON f.follower_id = u.user_id 
         WHERE f.following_id = ?`,
        [userId]
    );

    return followers;
}

export async function getFollowing(userId) {
    const dbPool = await initializeDbPool();

    const [following] = await dbPool.query(
        `SELECT u.user_id, u.username 
         FROM follows f 
         JOIN users u ON f.following_id = u.user_id 
         WHERE f.follower_id = ?`,
        [userId]
    );

    return following;
}

export async function isFollowing(followerId, followingId) {
    const dbPool = await initializeDbPool();

    const [rows] = await dbPool.query(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [followerId, followingId]
    );

    return rows.length > 0;
}

// Example usage in your API:
const result = await create_follow(followerId, followingId);
if (result === -1) {
    // Handle error
} else {
    // Handle success
}
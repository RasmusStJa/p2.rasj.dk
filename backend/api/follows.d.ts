export interface User {
    user_id: number;
    username: string;
}

export interface Follow {
    follower_id: number;
    following_id: number;
    created_at: Date;
}

export function followUser(followerId: number, followingId: number): Promise<void>;
export function unfollowUser(followerId: number, followingId: number): Promise<void>;
export function getFollowers(userId: number): Promise<User[]>;
export function getFollowing(userId: number): Promise<User[]>;
export function isFollowing(followerId: number, followingId: number): Promise<boolean>;

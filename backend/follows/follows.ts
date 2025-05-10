import express, { Router, RequestHandler } from 'express';
import type { Request, Response } from 'express';
import * as followsApi from '../api/follows';

const router: Router = express.Router();

// Follow a user
router.post('/:userId', (async (req: Request, res: Response) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const followerId = req.session.userId;
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    try {
        await followsApi.followUser(followerId, followingId);
        res.status(201).json({ message: 'Successfully followed user' });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'User not found') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Already following this user') {
                return res.status(400).json({ error: error.message });
            }
        }
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

// Unfollow a user
router.delete('/:userId', (async (req: Request, res: Response) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const followerId = req.session.userId;
    const followingId = parseInt(req.params.userId);

    try {
        await followsApi.unfollowUser(followerId, followingId);
        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        if (error instanceof Error && error.message === 'Follow relationship not found') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

// Get followers of a user
router.get('/followers/:userId', (async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    try {
        const followers = await followsApi.getFollowers(userId);
        res.json(followers);
    } catch (error) {
        console.error('Error fetching followers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

// Get users that a user is following
router.get('/following/:userId', (async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);

    try {
        const following = await followsApi.getFollowing(userId);
        res.json(following);
    } catch (error) {
        console.error('Error fetching following:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

// Check if current user is following another user
router.get('/check/:userId', (async (req: Request, res: Response) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const followerId = req.session.userId;
    const followingId = parseInt(req.params.userId);

    try {
        const isFollowing = await followsApi.isFollowing(followerId, followingId);
        res.json({ isFollowing });
    } catch (error) {
        console.error('Error checking follow status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}) as RequestHandler);

export default router;

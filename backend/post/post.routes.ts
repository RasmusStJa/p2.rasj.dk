import express, { RequestHandler } from 'express';
import { createPost, likePost, commentOnPost } from './post.controller';

const router = express.Router();

router.post('/', createPost as RequestHandler);

// Like a post
router.post('/:id/like', likePost as RequestHandler);

// Comment on a post
router.post('/:id/comment', commentOnPost as RequestHandler);

export default router;
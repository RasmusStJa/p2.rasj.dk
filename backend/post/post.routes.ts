import express, { RequestHandler } from 'express';
import { createPost, reactToPost, commentOnPost } from './post.controller';

const router = express.Router();

router.post('/', createPost as RequestHandler);

// React to a post
router.post('/:id/react', reactToPost as RequestHandler);

// Comment on a post
router.post('/:id/comment', commentOnPost as RequestHandler);

export default router;

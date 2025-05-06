import express, { RequestHandler } from 'express';
import {createPost} from './post.controller';

const router = express.Router();

router.post('/', createPost as RequestHandler);

export default router;
import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth.middleware';
import { reportPost, reportComment } from '../controllers/report.controller';

const router = Router();
router.use(isAuthenticated);

router.post('/post/:postId', reportPost);
router.post('/comment/:commentId', reportComment);

export default router; 
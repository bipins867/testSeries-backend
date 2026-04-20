import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import catalogRoutes from '../modules/catalog/catalog.routes';
import quizRoutes from '../modules/quizzes/quizzes.routes';
import bookmarkRoutes from '../modules/bookmarks/bookmarks.routes';
import adminRoutes from '../modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);        // /exams, /subjects, /topics
router.use('/quizzes', quizRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/admin', adminRoutes);

export default router;

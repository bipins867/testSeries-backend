import { Router } from 'express';
import { BookmarkController } from './bookmarks.controller';
import { authenticate } from '../../common/middleware/authenticate';

const router = Router();
const controller = new BookmarkController();

router.use(authenticate);

router.post('/', (req, res, next) => controller.addBookmark(req, res, next));
router.get('/', (req, res, next) => controller.getBookmarks(req, res, next));
router.delete('/:questionId', (req, res, next) => controller.removeBookmark(req, res, next));

export default router;

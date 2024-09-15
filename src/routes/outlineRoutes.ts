import express from 'express';
import { getOutlineById, createNewOutline, editOutline } from '../controllers/outlineController';

const router = express.Router();

// 获取大纲
router.get('/:outlineId', getOutlineById);

// 创建大纲
router.post('/', createNewOutline);

// 编辑大纲
router.put('/:outlineId', editOutline);

export default router;

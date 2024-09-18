// src/routes/outlineRoutes.ts

import express from 'express';
import { createAndGenerateOutline, editOutline } from '../controllers/outlineController';

const router = express.Router();

// 获取大纲
//router.get('/:outlineId', getOutlineById);

// 创建并生成大纲
router.post('/', createAndGenerateOutline);

// 编辑大纲
router.put('/:outlineId', editOutline);

export default router;

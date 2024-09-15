// src/app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import outlineRoutes from './routes/outlineRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/outlines', outlineRoutes);

// 根路由
app.get('/', (req, res) => {
  res.send('PPT Outline Backend is running.');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

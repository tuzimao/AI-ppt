// src/controllers/outlineController.ts

import { Request, Response } from 'express';
import { Outline, Chapter, SubChapter, Point } from '../models/outline';
import { getOutline, updateOutline, createOutline } from '../services/firestoreService';
import { updateOutlineWithTransaction } from '../services/firestoreService';
import { generateContent } from '../services/openaiService';
import { v4 as uuidv4 } from 'uuid';

// 创建并生成大纲
const createAndGenerateOutline = async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: '标题不能为空' });
  }

  try {
    // 初始化大纲
    const outline: Outline = {
      id: uuidv4(),
      title: title.trim(),
      chapters: [],
    };

    // 生成大纲内容
    const prompt = `
      请为“${outline.title}”生成一个详细的PPT大纲，涵盖内容请根据topic提供的信息生成一份与时俱进的完美的ppt大纲。大纲应包含主要章节，每个章节下有子章节，每个子章节进一步细分为几个小点。小点的数量应根据主题的复杂性灵活调整，最多不超过6个。如果“${outline.title}”里面有要求子章节和小点的数量，请根据要求生成对应的子章节数量和小点数量。请遵循以下格式：

      ${outline.title}
      1. 主要章节
        1.1 子章节
          1.1.1 小点
          1.1.2 小点
          1.1.3 小点
          1.1.4 小点
          1.1.5 小点
          1.1.6 小点

      ...请严格遵守上面的格式生成适合“${outline.title}”的内容，不要更改格式。
    `;

    const generatedText = await generateContent(prompt);
    console.log('Generated Text:', generatedText);

    // 解析生成的文本
    const parsedOutline = convertOutlineToJSON(generatedText, outline.title);
    outline.chapters = parsedOutline.chapters;

    // 存储到 Firestore
    await createOutline(outline);

    res.status(201).json(outline);
  } catch (error) {
    console.error('Error creating and generating outline:', error);
    res.status(500).json({ message: '内部服务器错误' });
  }
};

// 编辑大纲（章节、子章节、小点）
const editOutline = async (req: Request, res: Response) => {
  const { outlineId } = req.params;
  const { editPath, newTitle, regenerate } = req.body;

  try {
    await updateOutlineWithTransaction(outlineId, async (outline) => {
      let updated = false;

      // 编辑章节标题
      if (editPath.chapterId) {
        const chapter = outline.chapters.find(c => c.id === editPath.chapterId);
        if (chapter) {
          chapter.title = newTitle;
          updated = true;

          if (regenerate) {
            // 生成新的子章节
            const prompt = `
              请根据章节标题 "${newTitle}" 生成相关的子章节列表，格式如下：
              1. 子章节标题
              2. 子章节标题
              3. 子章节标题
            `;

            const generatedText = await generateContent(prompt);
            const newSubChapters = parseSubChapters(generatedText);

            // 清空旧的子章节并添加新的
            chapter.subChapters = newSubChapters;
          }
        }
      }

      // 编辑子章节标题
      if (editPath.subChapterId) {
        for (const chapter of outline.chapters) {
          const subChapter = chapter.subChapters.find(sc => sc.id === editPath.subChapterId);
          if (subChapter) {
            subChapter.title = newTitle;
            updated = true;

            if (regenerate) {
              // 生成新的小点
              const prompt = `
                请根据子章节标题 "${newTitle}" 生成相关的小点列表，格式如下：
                1. 小点内容
                2. 小点内容
                3. 小点内容
              `;

              const generatedText = await generateContent(prompt);
              const newPoints = parsePoints(generatedText);

              // 清空旧的小点并添加新的
              subChapter.points = newPoints;
            }
            break;
          }
        }
      }

      // 编辑小点标题
      if (editPath.pointId) {
        for (const chapter of outline.chapters) {
          for (const subChapter of chapter.subChapters) {
            const point = subChapter.points.find(p => p.id === editPath.pointId);
            if (point) {
              point.title = newTitle;
              updated = true;
              break;
            }
          }
        }
      }

      if (!updated) {
        throw new Error('Invalid edit path');
      }
    });

    const updatedOutline = await getOutline(outlineId);
    res.json(updatedOutline);
  } catch (error) {
    console.error('Error editing outline:', error);
    res.status(500).json({ message: '内部服务器错误' });
  }
};

// 定义解析函数
const convertOutlineToJSON = (outlineText: string, topic: string): Outline => {
  const outline: Outline = {
    id: uuidv4(),
    title: topic,
    chapters: [],
  };

  const lines = outlineText.split('\n').filter(line => line.trim() !== '');

  let currentChapter: Chapter | null = null;
  let currentSubChapter: SubChapter | null = null;

  lines.forEach(line => {
    line = line.trim();

    const chapterMatch = line.match(/^(\d+)\.\s+(.*)/);
    const subChapterMatch = line.match(/^(\d+\.\d+)\s+(.*)/);
    const pointMatch = line.match(/^(\d+\.\d+\.\d+)\s+(.*)/);

    if (chapterMatch) {
      // 匹配章节
      currentChapter = {
        id: uuidv4(),
        title: chapterMatch[2],
        subChapters: [],
      };
      outline.chapters.push(currentChapter);
      currentSubChapter = null;
    } else if (subChapterMatch) {
      // 匹配子章节
      currentSubChapter = {
        id: uuidv4(),
        title: subChapterMatch[2],
        points: [],
      };
      if (currentChapter) {
        currentChapter.subChapters.push(currentSubChapter);
      }
    } else if (pointMatch) {
      // 匹配小点
      if (currentSubChapter) {
        currentSubChapter.points.push({
          id: uuidv4(),
          title: pointMatch[2],
        });
      }
    }
  });

  return outline;
};

// 解析子章节
const parseSubChapters = (text: string): SubChapter[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const subChapters: SubChapter[] = [];

  lines.forEach(line => {
    const match = line.match(/^\d+\.\s+(.*)/);
    if (match) {
      subChapters.push({
        id: uuidv4(),
        title: match[1].trim(),
        points: [],
      });
    }
  });

  return subChapters;
};

// 解析小点
const parsePoints = (text: string): Point[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const points: Point[] = [];

  lines.forEach(line => {
    const match = line.match(/^\d+\.\s+(.*)/);
    if (match) {
      points.push({
        id: uuidv4(),
        title: match[1].trim(),
      });
    }
  });

  return points;
};

export { createAndGenerateOutline, editOutline };

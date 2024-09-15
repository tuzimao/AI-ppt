import { Request, Response } from 'express';
import { Outline, Chapter, SubChapter, Point } from '../models/outline';
import { getOutline, updateOutline, createOutline } from '../services/firestoreService';
import { generateContent } from '../services/openaiService';
import { v4 as uuidv4 } from 'uuid';

// 获取大纲
const getOutlineById = async (req: Request, res: Response) => {
  const { outlineId } = req.params;
  try {
    const outline = await getOutline(outlineId);
    if (!outline) {
      return res.status(404).json({ message: 'Outline not found' });
    }
    res.json(outline);
  } catch (error) {
    console.error('Error getting outline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 创建大纲
const createNewOutline = async (req: Request, res: Response) => {
  const { title } = req.body;
  const outline: Outline = {
    id: uuidv4(),
    title: title || '新大纲',
    chapters: [],
  };
  try {
    await createOutline(outline);
    res.status(201).json(outline);
  } catch (error) {
    console.error('Error creating outline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 编辑章节、子章节、小点
const editOutline = async (req: Request, res: Response) => {
  const { outlineId } = req.params;
  const { editPath, newTitle, regenerate } = req.body;

  /**
   * editPath 示例:
   * {
   *   chapterId: "chapter_id",
   *   subChapterId: "subchapter_id",
   *   pointId: "point_id"
   * }
   */

  try {
    const outline = await getOutline(outlineId);
    if (!outline) {
      return res.status(404).json({ message: 'Outline not found' });
    }

    let updated = false;

    // 编辑章节标题
    if (editPath.chapterId) {
      const chapter = outline.chapters.find(c => c.id === editPath.chapterId);
      if (chapter) {
        chapter.title = newTitle;
        updated = true;

        if (regenerate) {
          // 生成新的子章节
          const prompt = `根据章节标题 "${newTitle}" 生成相关的子章节列表，格式如下：
1. 子章节标题
2. 子章节标题
...`;

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
            const prompt = `根据子章节标题 "${newTitle}" 生成相关的小点列表，格式如下：
1. 小点内容
2. 小点内容
...`;

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

    if (updated) {
      await updateOutline(outlineId, outline);
      res.json(outline);
    } else {
      res.status(400).json({ message: 'Invalid edit path' });
    }
  } catch (error) {
    console.error('Error editing outline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 解析生成的子章节文本
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

// 解析生成的小点文本
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

export { getOutlineById, createNewOutline, editOutline };

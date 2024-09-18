

import { Firestore } from '@google-cloud/firestore';
import { Outline } from '../models/outline';

const firestore = new Firestore();

// 获取大纲
const getOutline = async (outlineId: string): Promise<Outline | null> => {
  const doc = await firestore.collection('outlines').doc(outlineId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as Outline;
};

// 更新大纲
const updateOutline = async (outlineId: string, outline: Outline): Promise<void> => {
  await firestore.collection('outlines').doc(outlineId).set(outline);
};

// 创建大纲
const createOutline = async (outline: Outline): Promise<void> => {
  await firestore.collection('outlines').doc(outline.id).set(outline);
};

const updateOutlineWithTransaction = async (outlineId: string, updateFn: (outline: Outline) => void): Promise<void> => {
  const outlineRef = firestore.collection('outlines').doc(outlineId);

  await firestore.runTransaction(async (transaction) => {
    const outlineDoc = await transaction.get(outlineRef);
    if (!outlineDoc.exists) {
      throw new Error('Outline does not exist');
    }

    const outline = outlineDoc.data() as Outline;
    updateFn(outline);
    transaction.set(outlineRef, outline);
  });
};

export { firestore, getOutline, updateOutline, createOutline, updateOutlineWithTransaction };


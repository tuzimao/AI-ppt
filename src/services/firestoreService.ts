// src/services/firestoreService.ts

import { Firestore } from '@google-cloud/firestore';
import { Outline } from '../models/outline';

const firestore = new Firestore();

const getOutline = async (outlineId: string): Promise<Outline | null> => {
  const doc = await firestore.collection('outlines').doc(outlineId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as Outline;
};

const updateOutline = async (outlineId: string, outline: Outline): Promise<void> => {
  await firestore.collection('outlines').doc(outlineId).set(outline);
};

const createOutline = async (outline: Outline): Promise<void> => {
  await firestore.collection('outlines').doc(outline.id).set(outline);
};

export { firestore, getOutline, updateOutline, createOutline };

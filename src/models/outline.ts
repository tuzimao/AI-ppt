

export interface Point {
  id: string;
  title: string;
}

export interface SubChapter {
  id: string;
  title: string;
  points: Point[];
}

export interface Chapter {
  id: string;
  title: string;
  subChapters: SubChapter[];
}

export interface Outline {
  id: string;
  title: string;
  chapters: Chapter[];
}

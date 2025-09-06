export interface StoryChapter {
  id: string;
  chapterText: string;
  choiceMade: string; // The choice that led to this chapter. Empty for the first chapter.
}

export interface Story {
  id: string;
  hero: string;
  setting: string;
  chapters: StoryChapter[];
  currentChoices: [string, string] | [];
  createdAt: string;
  updatedAt: string;
  readingLevel?: number;
  age?: number;
  profileId?: string;
  theme?: string;
}

export interface Profile {
  id: string;
  name: string;
  age: number;
  readingLevel: number;
}

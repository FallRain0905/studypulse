import ch10Raw from './tutorials/ch10.json';
import ch1To3Raw from './tutorials/ch1_3.json';
import ch4Raw from './tutorials/ch4.json';
import ch5Raw from './tutorials/ch5.json';
import ch6Raw from './tutorials/ch6.json';
import ch7Raw from './tutorials/ch7.json';
import ch8Raw from './tutorials/ch8.json';
import type { ChapterTutorial } from '../types/tutorial';

export const CHAPTER_TUTORIALS: ChapterTutorial[] = [
  ...(ch1To3Raw as ChapterTutorial[]),
  ch4Raw as ChapterTutorial,
  ch5Raw as ChapterTutorial,
  ch6Raw as ChapterTutorial,
  ch7Raw as ChapterTutorial,
  ch8Raw as ChapterTutorial,
  ch10Raw as ChapterTutorial,
].sort((a, b) => a.chapter - b.chapter);

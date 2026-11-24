export interface SyntaxBreakdown {
  part: string;
  meaning: string;
}

export interface SyntaxCard {
  title: string;
  syntax: string;
  breakdown: SyntaxBreakdown[];
}

export interface CodeDemo {
  title: string;
  code: string;
  expectedOutput: string;
  stdin?: string;
  lineByLine: string[];
}

export interface CautionBox {
  title: string;
  wrongCode: string;
  rightCode: string;
  why: string;
}

export interface TutorialSection {
  id: string;
  title: string;
  concept: string;
  syntaxCard?: SyntaxCard;
  keyRules: string[];
  codeDemo: CodeDemo;
  cautionBox?: CautionBox;
}

export interface WorkedExample {
  id: string;
  title: string;
  difficulty: '入门' | '常考' | '综合压轴';
  source: string;
  problemStatement: string;
  thinkingSteps: string[];
  code: string;
  stdin?: string;
  sampleOutput: string;
  codeWalkthrough: Array<{ lines: string; explanation: string }>;
  commonMistakes: string[];
  variationTip: string;
}

export interface CheatsheetItem {
  label: string;
  snippet: string;
  note: string;
}

export interface ChapterTutorial {
  chapter: number;
  title: string;
  subtitle: string;
  isExamScope: boolean;
  estimatedMinutes: number;
  learningGoals: string[];
  intro: string;
  sections: TutorialSection[];
  workedExamples: WorkedExample[];
  summaryCheatsheet: CheatsheetItem[];
}

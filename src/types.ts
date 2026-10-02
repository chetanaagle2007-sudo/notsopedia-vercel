export interface StudyTopic {
  id: string;
  title: string;
  definition: string;
  syntax?: string;
  typesOrFeatures?: string[];
  advantages?: string[];
  example?: string;
  isImportant?: boolean;
}

export interface StudyUnit {
  id: string;
  title: string;
  description: string;
  topics: StudyTopic[];
}

export interface ExpectedQuestion {
  id: string;
  question: string;
  marks: number;
  hint: string;
  idealOutline: {
    definition: string;
    syntax?: string;
    typesOrFeatures?: string[];
    advantages?: string[];
    example?: string;
  };
}

export interface VivaQuestion {
  id: string;
  question: string;
  answer: string;
  proTip: string;
}

export interface MemoryTrick {
  id: string;
  concept: string;
  acronym: string;
  expansion: string;
  explanation: string;
  color: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  subjectName: string;
  subjectCode: string;
  topicName: string;
  uploaderName: string;
  uploaderRole: string;
  uploaderEmail?: string;
  uploadedAt: string;
  likes: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;

  // Universal vault metadata - all optional.
  noteType?: string;
  tags?: string[];
  language?: string;
  sourceType?: string;
}

export interface SimulatorState {
  variables: Record<string, { type: string; value: any }>;
  cursors: Record<string, { status: 'CLOSED' | 'OPEN' | 'FETCHING'; position: number; data: any[] }>;
  triggers: Record<string, { table: string; event: string; status: 'ACTIVE' | 'FIRED' }>;
  dbState: Record<string, Record<string, any>[]>;
  output: string[];
  currentLine: number;
  isExecuting: boolean;
}

export interface SignedInUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institution: string;
  isAdmin: boolean;
}

export interface SystemConfig {
  announcement: string;
  announcementActive: boolean;
  enableSubmissions: boolean;
  enableSimulator?: boolean;
}

export type AIMode = "news-gk" | "notes-expert" | "exam-prep";

export interface AIChatMessage {
  sender: "user" | "ai";
  text: string;
  sources?: Array<{ title: string; uri: string }>;
  timestamp: string;
}


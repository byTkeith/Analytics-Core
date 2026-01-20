
export interface DataFile {
  id: string;
  name: string;
  headers: string[];
  rows: any[];
  rowCount: number;
  mapping?: Record<string, string>;
  metadata: {
    extractedDate?: string;
    companyName?: string;
  };
}

export interface AnalysisResult {
  summary: string;
  chartData?: any[];
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  columns?: string[];
  reasoning: string;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  result?: AnalysisResult;
}

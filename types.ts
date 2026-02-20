
export interface ExecutionPlan {
  objective: string;
  steps: string[];
  firstAction: string;
  commonMistakes: string[];
  rawMarkdown: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  plan: ExecutionPlan;
}

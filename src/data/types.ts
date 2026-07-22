// 共用：藍圖/任務相關資料型別

export interface InvestorRating {
  score: number;
  verdict: string;
}

export interface VibeListMilestone {
  title: string;
  metric: string;
  condition: string;
  fallbackPlan?: string;
}

export type VibeListTask =
  | { id: string; kind: "single"; content: string }
  | { id: string; kind: "single-with-lines"; content: string; lines: string[] }
  | { id: string; kind: "highlight"; title: string; lines: string[] }
  | { id: string; kind: "theory"; lines: string[] }
  | { id: string; kind: "warning"; content: string };

export interface VibeListLevel {
  id: string;
  label: string;
  title: string;
  summary: string;
  tasks: VibeListTask[];
  milestone: VibeListMilestone | null;
}

export interface VibeListVersion {
  id: string;
  name: string;
  tagline: string;
  overview: string;
  intro: string;
  levels: VibeListLevel[];
}

export interface VibeListData {
  id: string;
  name: string;
  shortLabel: string;
  theme: string;
  overview: string;
  investorRating?: InvestorRating;
  intro: string;
  legend: string[];
  resourceLinks: { label: string; url: string }[];
  levels: VibeListLevel[];
  versions?: VibeListVersion[];
}